import Link from "next/link";
import { redirect } from "next/navigation";
import { AskEliteFuelCard } from "@/components/ask-elitefuel-card";
import { TeamScheduleCalendar } from "@/components/team-schedule-calendar";
import { Badge, Panel, PageHeader, Select } from "@/components/ui";
import { UrineColorTrendSummary } from "@/components/urine-color-trend";
import { parentHydrationSummary } from "@/lib/hydration-trend";
import { mealFeedbackSummary } from "@/lib/meal-feedback";
import { prisma } from "@/lib/prisma";
import { monthStartFromParam } from "@/lib/schedule-calendar";
import { getPlannedTeamScheduleEntries, getTeamScheduleRhythm } from "@/lib/schedule-data";
import { effectiveDayType, dayTypeLabel, athleteName } from "@/lib/schedule";
import { requireSession } from "@/lib/session";

function parentSupportCue(dayType: string) {
  if (dayType === "MATCH") {
    return {
      headline: "Game-day support",
      pack: "Pack familiar easy carbs, water, and a simple recovery option.",
      prep: "Keep breakfast or lunch familiar, with carbs carrying the fuel.",
      after: "Have protein plus carbs ready after the match."
    };
  }
  if (dayType === "TRAVEL") {
    return {
      headline: "Travel support",
      pack: "Pack portable carbs plus protein and a water bottle.",
      prep: "Choose familiar foods that hold up between stops.",
      after: "Plan a normal recovery meal when the travel window ends."
    };
  }
  if (dayType === "REHAB" || dayType === "RETURN_TO_PLAY" || dayType === "MODIFIED_LOAD") {
    return {
      headline: "Modified-load support",
      pack: "Pack water and a steady snack so fueling stays consistent.",
      prep: "Keep meals balanced and predictable while training load changes.",
      after: "Support recovery with protein plus a practical carb."
    };
  }
  if (dayType === "TRAINING") {
    return {
      headline: "Training-day support",
      pack: "Pack an easy carb snack and a water bottle before training.",
      prep: "Have a recovery meal or snack ready after practice.",
      after: "Pair protein with carbs after training for repair and refuel."
    };
  }
  return {
    headline: "Daily support",
    pack: "Keep a water bottle and a simple snack available.",
    prep: "Use normal meals with protein, carbs, and fruit or vegetables.",
    after: "Stay consistent without making food feel like a project."
  };
}

export default async function ParentOverviewPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  if (session.user.role === "CLUB_ADMIN") redirect("/admin");
  const linkedAthletes = session.user.role === "PARENT"
    ? await prisma.parentAthlete.findMany({
      where: { parentId: session.user.id, athlete: { clubId: session.user.clubId } },
      include: { athlete: { include: { team: { include: { defaults: true } }, overrides: true, mealLogs: { orderBy: { createdAt: "desc" }, take: 5 } } } },
      orderBy: { athlete: { lastName: "asc" } }
    })
    : [];
  const selectedLink = searchParams.athlete
    ? linkedAthletes.find((link) => link.athleteId === searchParams.athlete) ?? linkedAthletes[0]
    : linkedAthletes[0];
  const athlete = selectedLink?.athlete ?? null;
  if (!athlete) {
    return (
      <>
        <PageHeader title="Parent overview" eyebrow="No linked athlete" />
        <Panel>
          <h2 className="text-xl font-semibold">No linked athlete yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Ask your club admin to link this parent account to an athlete roster profile. Once linked, schedule, meals, hydration trends, and food safety updates will appear here.
          </p>
        </Panel>
      </>
    );
  }
  const context = effectiveDayType(athlete.team.defaults, athlete.overrides);
  const visibleMonth = monthStartFromParam(searchParams.month);
  const plannedEntries = await getPlannedTeamScheduleEntries(athlete.teamId, visibleMonth);
  const scheduleRhythm = await getTeamScheduleRhythm(athlete.teamId);
  const fluidEntries = await prisma.fluidCheckIn.findMany({
    where: { athleteId: athlete.id, urineColor: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  const supportCue = parentSupportCue(context.dayType);
  const recentMeals = athlete.mealLogs.slice(0, 3);
  const averageScore = recentMeals.length
    ? Math.round(recentMeals.reduce((total, meal) => total + meal.score, 0) / recentMeals.length)
    : null;
  const chronologicalFluidEntries = [...fluidEntries].reverse();
  const hydrationSummary = parentHydrationSummary(chronologicalFluidEntries);

  return (
    <>
      <PageHeader title="Parent overview" eyebrow={`Linked athlete: ${athleteName(athlete)}`}>
        {linkedAthletes.length > 1 ? (
          <form className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Choose athlete
              <Select name="athlete" defaultValue={athlete.id} className="mt-1 min-w-48">
                {linkedAthletes.map((link) => <option key={link.athleteId} value={link.athleteId}>{athleteName(link.athlete)}</option>)}
              </Select>
            </label>
            <input type="hidden" name="month" value={searchParams.month ?? ""} />
            <button type="submit" className="focus-ring rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-fuel-mint">View child</button>
          </form>
        ) : (
          <div className="rounded-full border border-fuel-mint bg-fuel-mint/70 px-3 py-2 text-sm font-semibold text-fuel-green">
            Viewing {athleteName(athlete)}
          </div>
        )}
      </PageHeader>
      <Panel className="mb-5 border-fuel-green/30 bg-gradient-to-br from-white via-fuel-mint/35 to-white">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Child context</p>
            <h2 className="mt-1 text-2xl font-semibold">{athleteName(athlete)}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {athlete.team.name} · {athlete.sport} · Today is {dayTypeLabel(context.dayType).toLowerCase()}.
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-white/80 bg-white/75 p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Today</p>
              <p className="mt-1 font-semibold">{dayTypeLabel(context.dayType)}</p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/75 p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Recent meals</p>
              <p className="mt-1 font-semibold">{averageScore ? `${averageScore}/10 avg` : "No logs yet"}</p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/75 p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Hydration</p>
              <p className="mt-1 font-semibold">{hydrationSummary.label}</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="mb-5">
        <AskEliteFuelCard
          title="Ask about supporting your athlete’s fueling"
          description={`Get a practical answer for packing, prep, meal timing, hydration, or recovery support for ${athlete.firstName}.`}
          safetyNote="General fueling education only. For allergies, supplements, injuries, eating concerns, or medical questions, check with your athlete’s doctor, athletic trainer, or a registered dietitian."
          examples={[
            "What should I pack before a tournament?",
            "What is a good breakfast before a morning game?",
            "How can I help my athlete recover after late practice?"
          ]}
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel>
          <Badge tone={context.override ? "amber" : "green"}>{dayTypeLabel(context.dayType)}</Badge>
          <h2 className="mt-3 text-2xl font-semibold">Today’s action</h2>
          <p className="mt-3 text-stone-700">{supportCue.pack}</p>
          {context.override?.note ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{context.override.note}</p> : null}
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">{supportCue.headline}</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <p><strong>What to pack:</strong> {supportCue.pack}</p>
            <p><strong>What to prep:</strong> {supportCue.prep}</p>
            <p><strong>After activity:</strong> {supportCue.after}</p>
          </div>
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recent meal feedback</h2>
              <p className="mt-2 text-sm text-stone-600">A light summary to help with groceries, packing, and recovery meals without over-monitoring.</p>
            </div>
            {averageScore ? <Badge tone={averageScore >= 8 ? "green" : averageScore >= 6 ? "amber" : "red"}>{averageScore}/10 recent avg</Badge> : null}
          </div>
          {recentMeals.length ? (
            <div className="mt-4 grid gap-3">
              {recentMeals.map((meal) => {
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
                  <div key={meal.id} className="rounded-xl border border-stone-200/80 bg-white/80 p-3 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{meal.displayTitle ?? meal.extractedDescription}</p>
                        <p className="mt-1 text-sm leading-6 text-stone-600">{summary.whatToDoNext}</p>
                      </div>
                      <Badge tone={meal.score >= 8 ? "green" : meal.score >= 6 ? "amber" : "red"}>{meal.score}/10</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm leading-6 text-stone-700">
              No meals have been logged yet. When {athlete.firstName} logs meals, you’ll see practical support cues here.
            </p>
          )}
          <Link className="mt-4 inline-flex rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-fuel-blue shadow-sm hover:bg-fuel-mint" href="/meals">
            View meal feedback
          </Link>
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">Hydration trend</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Visible so you can support hydration habits at home. Athletes log their own fluid check-ins.
          </p>
          <div className="mt-4 rounded-xl border border-stone-200/80 bg-white/80 p-3 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Parent summary</p>
                <p className="mt-1 font-semibold text-fuel-ink">{hydrationSummary.label}</p>
              </div>
              <Badge tone={hydrationSummary.tone}>{fluidEntries.length ? `${fluidEntries.length} recent` : "No entries"}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-stone-700">{hydrationSummary.detail}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-stone-800">{hydrationSummary.cue}</p>
          </div>
          <UrineColorTrendSummary entries={fluidEntries} readOnly />
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-semibold">Example support for today</h2>
          <p className="mt-2 text-stone-700">Use the club meal library for practical examples that match {athlete.firstName}’s schedule context.</p>
          <Link className="mt-4 inline-flex rounded-lg bg-fuel-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800" href="/library">Open club meal library</Link>
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">Food safety and profile updates</h2>
          <p className="mt-2 text-stone-700">
            Update allergies, dietary restrictions, food preferences, parent contact info, and basic fueling profile details. Staff-only rehab notes and internal follow-ups stay protected.
          </p>
          <Link className="mt-4 inline-flex rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-fuel-mint" href="/profile">Update {athlete.firstName}’s profile</Link>
        </Panel>
      </div>
      <Panel className="mt-5">
        <TeamScheduleCalendar
          basePath="/parent"
          defaults={scheduleRhythm}
          month={visibleMonth}
          plannedEntries={plannedEntries}
          teamName={athlete.team.name}
          athleteOverrides={athlete.overrides}
          queryParams={{ athlete: athlete.id }}
          readOnly
        />
      </Panel>
    </>
  );
}
