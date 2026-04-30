import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { AsyncForm } from "@/components/async-form";
import { Badge, Button, Panel, PageHeader, Select, Textarea } from "@/components/ui";
import { hydrationTrend } from "@/lib/hydration-trend";
import { mealContextLine, mealFeedbackSummary } from "@/lib/meal-feedback";
import { prisma } from "@/lib/prisma";
import { athleteName, dayTypeLabel, effectiveDayType, weeklyPlan } from "@/lib/schedule";
import { requireSession } from "@/lib/session";

function followUpStateLabel(state: string) {
  return state.toLowerCase().replaceAll("_", " ");
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function recommendedAction({
  contextLabel,
  hasOpenFollowUp,
  latestFollowUpNote,
  lowestScore,
  hydrationLabel,
}: {
  contextLabel: string;
  hasOpenFollowUp: boolean;
  latestFollowUpNote?: string;
  lowestScore: number | null;
  hydrationLabel: string;
}) {
  if (hasOpenFollowUp && latestFollowUpNote) return latestFollowUpNote;
  if (lowestScore !== null && lowestScore <= 5) return "Review the recent low-score meal and suggest one practical improvement for the next session window.";
  if (/return to play|modified load|rehab/i.test(contextLabel)) return "Check in about recovery food, fluids, and the plan around today’s modified training demand.";
  if (/match|travel/i.test(contextLabel)) return "Confirm the athlete has a familiar packing plan with easy carbs, fluids, and a recovery option.";
  if (/darker|mixed/i.test(hydrationLabel)) return "Ask about fluid routine around training and encourage one simple water bottle reminder.";
  return "No urgent follow-up. Keep monitoring meal logs and schedule context this week.";
}

function reasonFlagged({
  contextLabel,
  openFollowUpNote,
  lowestScore,
  hydrationLabel,
}: {
  contextLabel: string;
  openFollowUpNote?: string;
  lowestScore: number | null;
  hydrationLabel: string;
}) {
  if (openFollowUpNote) return `Open follow-up: ${openFollowUpNote}`;
  if (lowestScore !== null && lowestScore <= 5) return `Recent meal score dropped to ${lowestScore}/10.`;
  if (/return to play|modified load|rehab/i.test(contextLabel)) return `${contextLabel} context may need a quick fueling/recovery check.`;
  if (/match|travel/i.test(contextLabel)) return `${contextLabel} day calls for a simple packing and recovery plan.`;
  if (/darker|mixed/i.test(hydrationLabel)) return `${hydrationLabel}; ask about fluids around training.`;
  return "No urgent signal; this is a quick review before the next check-in.";
}

function checkInLine(firstName: string, action: string) {
  if (/low-score meal|recent low-score/i.test(action)) return `Ask ${firstName}: "What is one easy upgrade you can make to that meal before the next session?"`;
  if (/recovery/i.test(action)) return `Ask ${firstName}: "What snack can you reliably get after training this week?"`;
  if (/packing|travel|match/i.test(action)) return `Ask ${firstName}: "What are you packing for fuel and fluids before the next game or trip?"`;
  if (/fluid|water/i.test(action)) return `Ask ${firstName}: "When can you get your water bottle filled before training?"`;
  return `Ask ${firstName}: "Anything getting in the way of meals, snacks, or fluids this week?"`;
}

export default async function StaffAthleteDetailPage({ params }: { params: { athleteId: string } }) {
  const session = await requireSession();
  const athlete = await prisma.athlete.findFirst({
    where: {
      id: params.athleteId,
      clubId: session.user.clubId,
      team: { staff: { some: { userId: session.user.id } } }
    },
    include: {
      team: { include: { defaults: true } },
      overrides: { orderBy: { date: "asc" } },
      mealLogs: { include: { loggedBy: true }, orderBy: { createdAt: "desc" }, take: 6 },
      fluidChecks: { where: { urineColor: { not: null } }, orderBy: { createdAt: "desc" }, take: 5 },
      followUps: { include: { updatedBy: true }, orderBy: { updatedAt: "desc" }, take: 5 }
    }
  });
  if (!athlete) return <PageHeader title="Athlete support review" eyebrow="Athlete not found" />;

  const context = effectiveDayType(athlete.team.defaults, athlete.overrides);
  const contextLabel = dayTypeLabel(context.dayType);
  const openFollowUps = athlete.followUps.filter((item) => item.state !== "RESOLVED");
  const latestFollowUp = athlete.followUps[0] ?? null;
  const editableFollowUp = openFollowUps[0] ?? latestFollowUp;
  const recentScores = athlete.mealLogs.map((meal) => meal.score);
  const lowestScore = recentScores.length ? Math.min(...recentScores) : null;
  const averageScore = recentScores.length ? Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length) : null;
  const hydration = hydrationTrend([...athlete.fluidChecks].reverse());
  const action = recommendedAction({
    contextLabel,
    hasOpenFollowUp: Boolean(openFollowUps.length),
    latestFollowUpNote: openFollowUps[0]?.note,
    lowestScore,
    hydrationLabel: hydration.label
  });
  const flaggedReason = reasonFlagged({
    contextLabel,
    openFollowUpNote: openFollowUps[0]?.note,
    lowestScore,
    hydrationLabel: hydration.label
  });
  const suggestedCheckIn = checkInLine(athlete.firstName, action);
  const latestMeal = athlete.mealLogs[0] ?? null;
  const latestMealSummary = latestMeal
    ? mealFeedbackSummary({
      mealType: latestMeal.mealType,
      mealWindow: latestMeal.mealWindow,
      dayType: context.dayType,
      score: latestMeal.score,
      components: latestMeal.components,
      qualityConcern: latestMeal.qualityConcern,
      interpretationConfidence: latestMeal.interpretationConfidence,
      athleteGoal: athlete.primaryGoal
    })
    : null;
  const badges = [
    openFollowUps.length ? { label: "Needs follow-up", tone: "red" as const } : { label: "Monitoring", tone: "green" as const },
    /return to play|modified load|rehab/i.test(contextLabel) ? { label: contextLabel, tone: "amber" as const } : null,
    lowestScore !== null && lowestScore <= 5 ? { label: "Recent low meal score", tone: "red" as const } : null,
    /mixed|darker|attention/i.test(hydration.label) ? { label: hydration.label, tone: "amber" as const } : null,
    /match|travel/i.test(contextLabel) ? { label: `${contextLabel} context`, tone: "blue" as const } : null
  ].filter(Boolean) as Array<{ label: string; tone: "green" | "amber" | "red" | "blue" }>;
  const nextSevenDays = weeklyPlan(athlete.team.defaults, athlete.overrides);

  return (
    <>
      <PageHeader title={`${athlete.firstName} ${athlete.lastName} quick review`} eyebrow="Staff support triage">
        <Link href="/staff" className="focus-ring rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-fuel-mint">
          Back to Staff Operations
        </Link>
      </PageHeader>

      <Panel className="border-fuel-green/30 bg-gradient-to-br from-white via-fuel-mint/30 to-white">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Quick support review</p>
            <h2 className="mt-1 text-2xl font-semibold">{athleteName(athlete)}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              Use this when an athlete is flagged or before a quick check-in. {athlete.team.name} · {contextLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => <Badge key={badge.label} tone={badge.tone}>{badge.label}</Badge>)}
          </div>
        </div>
      </Panel>

      <Panel className="mt-5 border-fuel-green/40 bg-gradient-to-br from-white via-white to-fuel-mint/25">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Recommended staff action</p>
            <h2 className="mt-1 text-2xl font-semibold">What to do next</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-800">{action}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-stone-200/80 bg-white/85 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Reason flagged</p>
                <p className="mt-1 text-sm leading-6 text-stone-700">{flaggedReason}</p>
              </div>
              <div className="rounded-xl border border-fuel-mint bg-fuel-mint/55 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Suggested check-in line</p>
                <p className="mt-1 text-sm leading-6 text-fuel-ink">{suggestedCheckIn}</p>
              </div>
            </div>
          </div>
          {editableFollowUp ? <Badge tone={editableFollowUp.state === "RESOLVED" ? "green" : editableFollowUp.state === "ACKNOWLEDGED" ? "amber" : "red"}>{followUpStateLabel(editableFollowUp.state)}</Badge> : <Badge tone="green">No open follow-up</Badge>}
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Key signal: meals</p>
          <h3 className="mt-1 text-xl font-semibold">{averageScore ? `${averageScore}/10 avg` : "No logs yet"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{lowestScore !== null ? `Lowest recent score: ${lowestScore}/10.` : "Meal logs will appear here after the athlete or parent logs meals."}</p>
        </Panel>
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Key signal: hydration</p>
          <h3 className="mt-1 text-xl font-semibold">{hydration.label}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{hydration.suggestion}</p>
        </Panel>
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Safety/profile flags</p>
          <h3 className="mt-1 text-xl font-semibold">{athlete.injuryStatus ?? "No rehab flag"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {athlete.allergies || athlete.dietaryRestrictions
              ? [athlete.allergies && `Avoid: ${athlete.allergies}`, athlete.dietaryRestrictions && `Restrictions: ${athlete.dietaryRestrictions}`].filter(Boolean).join(" · ")
              : "No food safety limits entered yet."}
          </p>
        </Panel>
      </div>

      {latestMeal && latestMeal.score <= 6 ? (
        <Panel className="mt-5 border-amber-200 bg-amber-50/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Recent meal concern</p>
              <h2 className="mt-1 text-xl font-semibold">{latestMeal.displayTitle ?? latestMeal.extractedDescription}</h2>
              <p className="mt-2 text-sm leading-6 text-amber-900">{latestMealSummary?.whatToDoNext}</p>
            </div>
            <Badge tone={latestMeal.score <= 5 ? "red" : "amber"}>{latestMeal.score}/10</Badge>
          </div>
        </Panel>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel>
          <h2 className="text-xl font-semibold">Follow-up</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Update the active note after the check-in. Keep it short and operational.</p>
          {editableFollowUp ? (
            <AsyncForm action={`/api/followups/${editableFollowUp.id}`} className="mt-4 grid gap-2" successMessage="Follow-up updated">
              <Select name="state" defaultValue={editableFollowUp.state}>
                <option>NEW</option>
                <option>ACKNOWLEDGED</option>
                <option>RESOLVED</option>
              </Select>
              <Textarea name="note" rows={3} defaultValue={editableFollowUp.note} />
              <Button type="submit"><ClipboardList size={16} aria-hidden /> Update follow-up</Button>
            </AsyncForm>
          ) : (
            <p className="mt-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm leading-6 text-stone-700">
              No follow-up has been opened for this athlete yet.
            </p>
          )}
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold">Today and next steps</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Today</p>
              <p className="mt-1 font-semibold">{contextLabel}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{context.override ? "Athlete-specific override is active today." : "Following team schedule today."}</p>
            </div>
            <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Profile anchor</p>
              <p className="mt-1 text-sm leading-6 text-stone-700">{athlete.primaryGoal}</p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <details>
            <summary className="cursor-pointer text-xl font-semibold">Deeper schedule context</summary>
            <div className="mt-4 rounded-xl border border-stone-200/80 bg-white/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Today</p>
                  <p className="mt-1 font-semibold">{contextLabel}</p>
                </div>
                <Badge tone={context.override ? "amber" : "green"}>{context.override ? "Athlete-specific override" : "Team schedule"}</Badge>
              </div>
              {context.override?.note ? <p className="mt-3 text-sm leading-6 text-amber-900">{context.override.note}</p> : null}
            </div>
            <div className="mt-4 grid gap-2">
              {nextSevenDays.map((day) => (
                <div key={day.date.toISOString()} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-white/80 p-3 text-sm shadow-sm">
                  <span className="font-medium">{day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span className="text-right text-stone-700">{dayTypeLabel(day.dayType)} {day.override ? "· Override" : ""}</span>
                </div>
              ))}
            </div>
          </details>
        </Panel>

        <Panel>
          <details>
            <summary className="cursor-pointer text-xl font-semibold">Deeper profile notes</summary>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Primary goal</p>
                <p className="mt-1 leading-6 text-stone-700">{athlete.primaryGoal}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Dietary restrictions</p>
                  <p className="mt-1 leading-6 text-stone-700">{athlete.dietaryRestrictions || "None entered"}</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Allergies / avoid</p>
                  <p className="mt-1 leading-6 text-stone-700">{athlete.allergies || "None entered"}</p>
                </div>
              </div>
              <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Rehab / return-to-play context</p>
                <p className="mt-1 leading-6 text-stone-700">{athlete.injuryStatus ?? "None noted"}</p>
                {athlete.rehabNotes ? <p className="mt-2 leading-6 text-stone-600">{athlete.rehabNotes}</p> : null}
              </div>
            </div>
          </details>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <details>
            <summary className="cursor-pointer text-xl font-semibold">Recent fueling detail</summary>
            <div className="mt-4 grid gap-3">
              {athlete.mealLogs.length ? athlete.mealLogs.map((meal) => {
                const summary = mealFeedbackSummary({
                  mealType: meal.mealType,
                  mealWindow: meal.mealWindow,
                  dayType: context.dayType,
                  score: meal.score,
                  components: meal.components,
                  qualityConcern: meal.qualityConcern,
                  interpretationConfidence: meal.interpretationConfidence,
                  athleteGoal: athlete.primaryGoal
                });
                return (
                  <div key={meal.id} className="rounded-xl border border-stone-200/80 bg-white/85 p-3 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{meal.displayTitle ?? meal.extractedDescription}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{mealContextLine(meal.mealType, meal.mealWindow, context.dayType)}</p>
                      </div>
                      <Badge tone={meal.score >= 8 ? "green" : meal.score >= 6 ? "amber" : "red"}>{meal.score}/10</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-700">{summary.whatToDoNext}</p>
                    <p className="mt-2 text-xs leading-5 text-stone-500">Identified: {meal.components.join(", ") || meal.extractedDescription}</p>
                    <p className="mt-1 text-xs text-stone-500">Logged by {meal.loggedBy.name} · {formatDateTime(meal.createdAt)}</p>
                  </div>
                );
              }) : (
                <p className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm leading-6 text-stone-700">
                  No recent meal logs yet. Check back after the athlete or linked parent logs meals.
                </p>
              )}
            </div>
          </details>
        </Panel>

        <Panel>
          <details>
            <summary className="cursor-pointer text-xl font-semibold">Follow-up history</summary>
            <div className="mt-4 space-y-3">
              {athlete.followUps.length ? athlete.followUps.map((item) => (
                <div key={item.id} className="rounded-xl border border-stone-200/80 bg-white/85 p-3 text-sm shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={item.state === "RESOLVED" ? "green" : item.state === "ACKNOWLEDGED" ? "amber" : "red"}>{followUpStateLabel(item.state)}</Badge>
                    <span className="text-xs text-stone-500">{formatDateTime(item.updatedAt)}</span>
                  </div>
                  <p className="mt-2 leading-6 text-stone-700">{item.note}</p>
                  <p className="mt-2 text-xs text-stone-500">Updated by {item.updatedBy.name}</p>
                </div>
              )) : (
                <p className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm leading-6 text-stone-700">
                  No follow-up history yet.
                </p>
              )}
            </div>
          </details>
        </Panel>
      </div>
    </>
  );
}
