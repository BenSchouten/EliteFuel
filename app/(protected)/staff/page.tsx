import Link from "next/link";
import { AskEliteFuelCard } from "@/components/ask-elitefuel-card";
import { Badge, Button, Panel, Select } from "@/components/ui";
import { hydrationTrend } from "@/lib/hydration-trend";
import { prisma } from "@/lib/prisma";
import { athleteName, dayTypeLabel, effectiveDayType } from "@/lib/schedule";
import { requireSession } from "@/lib/session";

function recommendedAction({
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
  if (openFollowUpNote) return openFollowUpNote;
  if (lowestScore !== null && lowestScore <= 5) return "Open the review and pick one practical meal improvement to discuss.";
  if (/return to play|modified load|rehab/i.test(contextLabel)) return "Quickly check how recovery food and fluids fit today’s modified work.";
  if (/match|travel/i.test(contextLabel)) return "Confirm a simple packing plan for fuel, fluids, and recovery.";
  if (/darker|mixed/i.test(hydrationLabel)) return "Ask one quick question about fluids around training.";
  return "No action needed right now; scan again later this week.";
}

function reasonFlagged({
  contextLabel,
  openFollowUpNote,
  lowestScore,
  hydrationLabel,
  hasMeals,
}: {
  contextLabel: string;
  openFollowUpNote?: string;
  lowestScore: number | null;
  hydrationLabel: string;
  hasMeals: boolean;
}) {
  if (openFollowUpNote) return `Open follow-up: ${openFollowUpNote}`;
  if (lowestScore !== null && lowestScore <= 5) return `Latest concern is a low recent meal score (${lowestScore}/10).`;
  if (/return to play|modified load|rehab/i.test(contextLabel)) return `${contextLabel} day, so recovery support matters.`;
  if (/match|travel/i.test(contextLabel)) return `${contextLabel} day, so packing and recovery planning matter.`;
  if (/darker|mixed/i.test(hydrationLabel)) return `${hydrationLabel}; worth a quick fluid check-in conversation.`;
  if (!hasMeals) return "No recent meal logs yet.";
  return "Recent signals look steady.";
}

function priorityScore({
  openFollowUpState,
  lowestScore,
  hydrationLabel,
  contextLabel,
  hasMeals,
}: {
  openFollowUpState?: string;
  lowestScore: number | null;
  hydrationLabel: string;
  contextLabel: string;
  hasMeals: boolean;
}) {
  let score = 0;
  if (openFollowUpState === "NEW") score += 70;
  else if (openFollowUpState === "ACKNOWLEDGED") score += 50;
  if (lowestScore !== null && lowestScore <= 5) score += 35;
  else if (lowestScore !== null && lowestScore <= 6) score += 18;
  if (/darker|mixed|attention/i.test(hydrationLabel)) score += 20;
  if (/return to play|modified load|rehab/i.test(contextLabel)) score += 25;
  if (/match|travel/i.test(contextLabel)) score += 12;
  if (!hasMeals) score += 8;
  return score;
}

function statusFromPriority(score: number) {
  if (score >= 60) return { label: "Check in today", tone: "red" as const };
  if (score >= 20) return { label: "Watch this week", tone: "amber" as const };
  return { label: "Looks steady", tone: "green" as const };
}

export default async function StaffOperationsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  const legacyFilter = searchParams.filter;
  const selectedFilters = new Set(
    (searchParams.filters ?? legacyFilter ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const assignedTeams = await prisma.team.findMany({
    where: { clubId: session.user.clubId, staff: { some: { userId: session.user.id } } },
    select: {
      id: true,
      name: true,
      defaults: { orderBy: { dayOfWeek: "asc" } }
    },
    orderBy: { name: "asc" }
  });
  const selectedTeamId = assignedTeams.some((team) => team.id === searchParams.team)
    ? searchParams.team
    : assignedTeams.length > 1
      ? assignedTeams[0]?.id ?? ""
      : "";
  const visibleTeams = selectedTeamId ? assignedTeams.filter((team) => team.id === selectedTeamId) : assignedTeams;
  const teamIds = visibleTeams.map((team) => team.id);
  const athletes = teamIds.length ? await prisma.athlete.findMany({
    where: { clubId: session.user.clubId, teamId: { in: teamIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      teamId: true,
      primaryGoal: true
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 80
  }) : [];
  const athleteIds = athletes.map((athlete) => athlete.id);
  const [overrides, mealLogs, fluidChecks, followUps] = athleteIds.length ? await Promise.all([
    prisma.athleteScheduleOverride.findMany({
      where: { athleteId: { in: athleteIds } },
      orderBy: { date: "asc" }
    }),
    prisma.mealLog.findMany({
      where: { athleteId: { in: athleteIds } },
      select: {
        id: true,
        athleteId: true,
        mealType: true,
        mealWindow: true,
        displayTitle: true,
        extractedDescription: true,
        components: true,
        qualityConcern: true,
        interpretationConfidence: true,
        score: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(athleteIds.length * 5, 400)
    }),
    prisma.fluidCheckIn.findMany({
      where: { athleteId: { in: athleteIds }, urineColor: { not: null } },
      select: { id: true, athleteId: true, urineColor: true, createdAt: true, note: true },
      orderBy: { createdAt: "desc" },
      take: Math.min(athleteIds.length * 5, 400)
    }),
    prisma.followUp.findMany({
      where: { athleteId: { in: athleteIds } },
      select: { id: true, athleteId: true, state: true, note: true, reason: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: Math.min(athleteIds.length * 3, 240)
    })
  ]) : [[], [], [], []];

  const teamById = new Map(assignedTeams.map((team) => [team.id, team]));
  const overridesByAthlete = new Map<string, typeof overrides>();
  const mealsByAthlete = new Map<string, typeof mealLogs>();
  const fluidsByAthlete = new Map<string, typeof fluidChecks>();
  const followUpsByAthlete = new Map<string, typeof followUps>();
  for (const item of overrides) {
    const values = overridesByAthlete.get(item.athleteId) ?? [];
    if (values.length < 10) values.push(item);
    overridesByAthlete.set(item.athleteId, values);
  }
  for (const item of mealLogs) {
    const values = mealsByAthlete.get(item.athleteId) ?? [];
    if (values.length < 3) values.push(item);
    mealsByAthlete.set(item.athleteId, values);
  }
  for (const item of fluidChecks) {
    const values = fluidsByAthlete.get(item.athleteId) ?? [];
    if (values.length < 5) values.push(item);
    fluidsByAthlete.set(item.athleteId, values);
  }
  for (const item of followUps) {
    const values = followUpsByAthlete.get(item.athleteId) ?? [];
    if (values.length < 3) values.push(item);
    followUpsByAthlete.set(item.athleteId, values);
  }

  const triageRows = athletes.map((athlete) => {
    const team = teamById.get(athlete.teamId);
    const athleteOverrides = overridesByAthlete.get(athlete.id) ?? [];
    const athleteMeals = mealsByAthlete.get(athlete.id) ?? [];
    const athleteFluids = fluidsByAthlete.get(athlete.id) ?? [];
    const athleteFollowUps = followUpsByAthlete.get(athlete.id) ?? [];
    const context = effectiveDayType(team?.defaults ?? [], athleteOverrides);
    const contextLabel = dayTypeLabel(context.dayType);
    const openFollowUp = athleteFollowUps.find((item) => item.state !== "RESOLVED");
    const recentScores = athleteMeals.map((meal) => meal.score);
    const lowestScore = recentScores.length ? Math.min(...recentScores) : null;
    const latestMeal = athleteMeals[0] ?? null;
    const hydration = hydrationTrend([...athleteFluids].reverse());
    const priority = priorityScore({
      openFollowUpState: openFollowUp?.state,
      lowestScore,
      hydrationLabel: hydration.label,
      contextLabel,
      hasMeals: Boolean(athleteMeals.length)
    });
    const status = statusFromPriority(priority);
    return {
      athlete,
      context,
      contextLabel,
      hydration,
      latestMeal,
      lowestScore,
      openFollowUp,
      priority,
      status,
      teamName: team?.name ?? "Assigned team",
      reason: reasonFlagged({
        contextLabel,
        openFollowUpNote: openFollowUp?.note,
        lowestScore,
        hydrationLabel: hydration.label,
        hasMeals: Boolean(athleteMeals.length)
      }),
      action: recommendedAction({
        contextLabel,
        openFollowUpNote: openFollowUp?.note,
        lowestScore,
        hydrationLabel: hydration.label
      })
    };
  }).sort((a, b) => b.priority - a.priority || athleteName(a.athlete).localeCompare(athleteName(b.athlete))).slice(0, 40);

  const filterMatches = {
    "check-in": (row: (typeof triageRows)[number]) => row.status.label === "Check in today",
    watch: (row: (typeof triageRows)[number]) => row.status.label === "Watch this week",
    "return-to-play": (row: (typeof triageRows)[number]) => /return to play/i.test(row.contextLabel),
    "open-follow-ups": (row: (typeof triageRows)[number]) => Boolean(row.openFollowUp)
  };
  const activeFilters = [...selectedFilters].filter((value): value is keyof typeof filterMatches => value in filterMatches);
  const filteredRows = triageRows.filter((row) => {
    if (!activeFilters.length) return true;
    return activeFilters.some((value) => filterMatches[value](row));
  });

  const filterLinks = [
    ["Check in today", "check-in"],
    ["Watch this week", "watch"],
    ["Return to play", "return-to-play"],
    ["Open follow-ups", "open-follow-ups"]
  ] as const;
  const staffHref = (filters: string[]) => {
    const params = new URLSearchParams();
    if (selectedTeamId) params.set("team", selectedTeamId);
    if (filters.length) params.set("filters", filters.join(","));
    const query = params.toString();
    return query ? `/staff?${query}` : "/staff";
  };

  return (
    <>
      <div className="mb-5">
        <AskEliteFuelCard
          title="Ask a team fueling question"
          description="Get a concise staff-facing cue for general team fueling, hydration reminders, tournament snacks, recovery support, or staff workflow."
          safetyNote="General team fueling education and workflow support only. For allergies, supplements, injuries, eating concerns, or medical questions, involve the athlete’s parent or guardian and a qualified professional."
          examples={[
            "What should athletes eat between tournament games?",
            "What hydration reminder should I give before practice?",
            "What are good sideline snacks for a hot day?"
          ]}
        />
      </div>

      <div className="mb-5">
        {assignedTeams.length > 1 ? (
          <form className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm sm:flex sm:items-end sm:gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Choose team
              <Select name="team" defaultValue={selectedTeamId} className="mt-2">
                {assignedTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </Select>
            </label>
            {activeFilters.length ? <input type="hidden" name="filters" value={activeFilters.join(",")} /> : null}
            <Button type="submit" className="mt-3 bg-fuel-blue hover:bg-sky-800 sm:mt-0">View roster</Button>
          </form>
        ) : (
          <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Viewing team</p>
            <p className="mt-2 text-base font-semibold text-fuel-ink">{assignedTeams[0]?.name ?? "No assigned team"}</p>
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href={staffHref([])}
          aria-current={!activeFilters.length ? "page" : undefined}
          className={!activeFilters.length
            ? "rounded-lg bg-fuel-green px-3 py-2 text-sm font-semibold text-white shadow-sm"
            : "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-fuel-mint"}
        >
          All
        </Link>
        {filterLinks.map(([label, value]) => {
            const active = activeFilters.includes(value);
            const nextFilters = active ? activeFilters.filter((item) => item !== value) : [...activeFilters, value];
            return (
              <Link
                key={label}
                href={staffHref(nextFilters)}
                aria-pressed={active}
                className={active
                  ? "rounded-lg bg-fuel-green px-3 py-2 text-sm font-semibold text-white shadow-sm"
                  : "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-fuel-mint"}
              >
                {label}
              </Link>
            );
          })}
      </div>

      {filteredRows.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredRows.map((row) => (
            <Panel key={row.athlete.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{athleteName(row.athlete)}</h2>
                  <p className="mt-1 text-sm text-stone-600">{row.teamName} · {row.contextLabel}</p>
                </div>
                <Badge tone={row.status.tone}>{row.status.label}</Badge>
              </div>

              <div className="mt-4 rounded-xl border border-stone-200/80 bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Why</p>
                <p className="mt-1 text-sm leading-6 text-stone-700">{row.reason}</p>
              </div>

              <div className="mt-3 rounded-xl border border-fuel-mint bg-fuel-mint/45 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Suggested action</p>
                <p className="mt-1 text-sm leading-6 text-fuel-ink">{row.action}</p>
              </div>

              <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Meal</p>
                  {row.latestMeal ? (
                    <>
                      <p className="mt-1 font-semibold">{row.latestMeal.score}/10 latest</p>
                      <p className="mt-1 text-xs leading-5 text-stone-600">{row.latestMeal.displayTitle ?? row.latestMeal.extractedDescription}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-stone-600">No recent logs</p>
                  )}
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Hydration</p>
                  <p className="mt-1 font-semibold">{row.hydration.label}</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Schedule</p>
                  <p className="mt-1 font-semibold">{row.contextLabel}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="rounded-lg bg-fuel-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800" href={`/staff/athletes/${row.athlete.id}`}>
                  Open review
                </Link>
                <Link className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-fuel-mint" href={`/schedule?team=${row.athlete.teamId}`}>
                  Team schedule
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      ) : assignedTeams.length ? (
        <Panel>
          <h2 className="text-xl font-semibold">{activeFilters.length ? "No athletes match these filters" : "No athletes need immediate follow-up right now"}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {activeFilters.length
              ? "Clear filters or choose a different team to return to the full assigned roster."
              : "Keep monitoring meal logs, hydration trends, and schedule context across your assigned teams."}
          </p>
        </Panel>
      ) : (
        <Panel>
          <h2 className="text-xl font-semibold">No teams assigned</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Ask a club admin to assign you to a team before using the roster check-in board.
          </p>
        </Panel>
      )}
    </>
  );
}
