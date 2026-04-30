import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Utensils } from "lucide-react";
import { AskEliteFuelCard } from "@/components/ask-elitefuel-card";
import { TeamScheduleCalendar } from "@/components/team-schedule-calendar";
import { Badge, Panel, PageHeader } from "@/components/ui";
import { UrineColorTrendSummary } from "@/components/urine-color-trend";
import { getPrimaryAthlete } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { monthStartFromParam } from "@/lib/schedule-calendar";
import { getPlannedTeamScheduleEntries, getTeamScheduleRhythm } from "@/lib/schedule-data";
import { athleteName, dayTypeLabel, effectiveDayType, weeklyPlan } from "@/lib/schedule";
import { requireSession } from "@/lib/session";

export default async function AthleteOverviewPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  if (session.user.role === "CLUB_ADMIN") redirect("/admin");
  if (session.user.role === "STAFF") redirect("/staff");
  const athlete = await getPrimaryAthlete(session.user);
  if (!athlete) {
    return (
      <>
        <PageHeader title="Athlete overview" eyebrow="No athlete connected" />
        <Panel>
          <h2 className="text-xl font-semibold">No athlete profile is connected yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Ask a club admin or staff member to connect this login to an athlete roster profile before using the athlete dashboard.
          </p>
        </Panel>
      </>
    );
  }
  const todayContext = effectiveDayType(athlete.team.defaults, athlete.overrides);
  const week = weeklyPlan(athlete.team.defaults, athlete.overrides);
  const visibleMonth = monthStartFromParam(searchParams.month);
  const plannedEntries = await getPlannedTeamScheduleEntries(athlete.teamId, visibleMonth);
  const scheduleRhythm = await getTeamScheduleRhythm(athlete.teamId);
  const adherence = athlete.mealLogs.length >= 3 ? "Steady recent logging" : "Needs a few more meal logs this week";
  const fluidEntries = await prisma.fluidCheckIn.findMany({
    where: { athleteId: athlete.id, urineColor: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <>
      <PageHeader title="Athlete overview" eyebrow={athleteName(athlete)}>
        <div className="flex gap-2">
          <Link className="rounded-md bg-fuel-green px-3 py-2 text-sm font-semibold text-white" href="/meals">Meals</Link>
          <Link className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold" href="/library">Club meal library</Link>
        </div>
      </PageHeader>
      <div className="mb-5">
        <AskEliteFuelCard
          title="Ask a quick fueling question"
          description="Get a short, practical answer about meal timing, snacks, hydration, recovery, or food prep."
          examples={[
            "What should I eat before evening training?",
            "What is a good recovery snack after practice?",
            "How can I improve this lunch before a game?"
          ]}
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-500">Today’s guidance</p>
              <h2 className="mt-1 text-2xl font-semibold">{dayTypeLabel(todayContext.dayType)}</h2>
            </div>
            <Badge tone={todayContext.override ? "amber" : "green"}>{todayContext.override ? "Athlete exception" : "Team default"}</Badge>
          </div>
          <p className="mt-4 text-stone-700">
            Match the meal to the next session window: carbohydrate before harder work, protein plus carbohydrate after training, and fluids throughout the day.
          </p>
          {todayContext.override?.note ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{todayContext.override.note}</p> : null}
        </Panel>
        <Panel>
          <p className="text-sm font-semibold text-stone-500">Recent adherence</p>
          <h2 className="mt-1 text-xl font-semibold">{adherence}</h2>
          <div className="mt-4 space-y-3">
            {athlete.mealLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-md border border-stone-200 p-3 text-sm">
                <span>{log.note}</span>
                <Badge tone={log.score >= 8 ? "green" : log.score >= 6 ? "amber" : "red"}>{log.score}/10</Badge>
              </div>
            ))}
          </div>
          <UrineColorTrendSummary entries={fluidEntries} />
        </Panel>
      </div>
      <Panel className="mt-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={18} aria-hidden />
          <h2 className="text-lg font-semibold">Weekly schedule preview</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-7">
          {week.map((day) => (
            <div key={day.date.toISOString()} className="rounded-md border border-stone-200 p-3">
              <p className="text-xs font-semibold text-stone-500">{dayLabel(day.date)}</p>
              <p className="mt-2 text-sm font-semibold">{dayTypeLabel(day.dayType)}</p>
              {day.override ? <Badge tone="amber">Override</Badge> : null}
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="mt-5">
        <TeamScheduleCalendar
          basePath="/athlete"
          defaults={scheduleRhythm}
          month={visibleMonth}
          plannedEntries={plannedEntries}
          teamName={athlete.team.name}
          athleteOverrides={athlete.overrides}
          readOnly
        />
      </Panel>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Link href="/meals" className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft hover:border-fuel-green">
          <Utensils size={20} aria-hidden />
          <p className="mt-3 font-semibold">Log or correct meals</p>
          <p className="mt-1 text-sm text-stone-600">Use Meals as the daily logging hub.</p>
        </Link>
        <Link href="/library" className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft hover:border-fuel-green">
          <ArrowRight size={20} aria-hidden />
          <p className="mt-3 font-semibold">Find a club meal example</p>
          <p className="mt-1 text-sm text-stone-600">See a strong example for today’s context.</p>
        </Link>
      </div>
    </>
  );
}
