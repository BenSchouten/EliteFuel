import { redirect } from "next/navigation";
import { TeamScheduleCalendar } from "@/components/team-schedule-calendar";
import { Badge, Panel, PageHeader } from "@/components/ui";
import { getPrimaryAthlete } from "@/lib/data";
import { monthStartFromParam } from "@/lib/schedule-calendar";
import { getPlannedTeamScheduleEntries, getTeamScheduleRhythm } from "@/lib/schedule-data";
import { athleteName, dayTypeLabel, effectiveDayType } from "@/lib/schedule";
import { homeForRole, requireSession } from "@/lib/session";

export default async function AthleteSchedulePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  if (session.user.role !== "ATHLETE") redirect(homeForRole(session.user.role));

  const athlete = await getPrimaryAthlete(session.user);
  if (!athlete) {
    return (
      <>
        <PageHeader title="Schedule" eyebrow="No athlete connected" />
        <Panel>
          <h2 className="text-xl font-semibold">No athlete profile is connected yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Ask a club admin or staff member to connect this login to an athlete roster profile before viewing the athlete schedule.
          </p>
        </Panel>
      </>
    );
  }

  const visibleMonth = monthStartFromParam(searchParams.month);
  const plannedEntries = await getPlannedTeamScheduleEntries(athlete.teamId, visibleMonth);
  const scheduleRhythm = await getTeamScheduleRhythm(athlete.teamId);
  const context = effectiveDayType(athlete.team.defaults, athlete.overrides);

  return (
    <>
      <PageHeader title="Schedule" eyebrow={athleteName(athlete)} />

      <Panel className="mb-5 border-fuel-green/30 bg-gradient-to-br from-white via-fuel-mint/30 to-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Read-only athlete view</p>
            <h2 className="mt-1 text-2xl font-semibold">{athlete.team.name}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              View your team rhythm, planned dates, travel, matches, rest days, and athlete-specific schedule changes. Schedule edits are handled by staff and admins.
            </p>
          </div>
          <Badge tone={context.override ? "amber" : "green"}>{dayTypeLabel(context.dayType)}</Badge>
        </div>
      </Panel>

      <Panel>
        <TeamScheduleCalendar
          basePath="/athlete/schedule"
          defaults={scheduleRhythm}
          month={visibleMonth}
          plannedEntries={plannedEntries}
          teamName={athlete.team.name}
          athleteOverrides={athlete.overrides}
          readOnly
        />
      </Panel>
    </>
  );
}
