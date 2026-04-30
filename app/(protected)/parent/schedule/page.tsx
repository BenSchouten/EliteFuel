import { redirect } from "next/navigation";
import { TeamScheduleCalendar } from "@/components/team-schedule-calendar";
import { Badge, Panel, PageHeader, Select } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { monthStartFromParam } from "@/lib/schedule-calendar";
import { getPlannedTeamScheduleEntries, getTeamScheduleRhythm } from "@/lib/schedule-data";
import { athleteName, dayTypeLabel, effectiveDayType } from "@/lib/schedule";
import { homeForRole, requireSession } from "@/lib/session";

export default async function ParentSchedulePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  if (session.user.role !== "PARENT") redirect(homeForRole(session.user.role));

  const linkedAthletes = await prisma.parentAthlete.findMany({
    where: { parentId: session.user.id, athlete: { clubId: session.user.clubId } },
    include: { athlete: { include: { team: { include: { defaults: true } }, overrides: true } } },
    orderBy: { athlete: { lastName: "asc" } }
  });
  const selectedLink = searchParams.athlete
    ? linkedAthletes.find((link) => link.athleteId === searchParams.athlete) ?? linkedAthletes[0]
    : linkedAthletes[0];
  const athlete = selectedLink?.athlete ?? null;

  if (!athlete) {
    return (
      <>
        <PageHeader title="Schedule" eyebrow="No linked athlete" />
        <Panel>
          <h2 className="text-xl font-semibold">No linked athlete yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Ask your club admin to link this parent account to an athlete roster profile. Once linked, the monthly team schedule and athlete-specific changes will appear here.
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
      <PageHeader title="Schedule" eyebrow={`Linked athlete: ${athleteName(athlete)}`}>
        {linkedAthletes.length > 1 ? (
          <form className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Choose athlete
              <Select name="athlete" defaultValue={athlete.id} className="mt-1 min-w-48">
                {linkedAthletes.map((link) => <option key={link.athleteId} value={link.athleteId}>{athleteName(link.athlete)}</option>)}
              </Select>
            </label>
            <input type="hidden" name="month" value={searchParams.month ?? ""} />
            <button type="submit" className="focus-ring rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-fuel-mint">View schedule</button>
          </form>
        ) : (
          <div className="rounded-full border border-fuel-mint bg-fuel-mint/70 px-3 py-2 text-sm font-semibold text-fuel-green">
            Viewing {athleteName(athlete)}
          </div>
        )}
      </PageHeader>

      <Panel className="mb-5 border-fuel-green/30 bg-gradient-to-br from-white via-fuel-mint/30 to-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Read-only parent view</p>
            <h2 className="mt-1 text-2xl font-semibold">{athlete.team.name}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              View training, match, travel, rest, and athlete-specific schedule context for {athlete.firstName}. Parents can view this calendar but cannot edit team plans.
            </p>
          </div>
          <Badge tone={context.override ? "amber" : "green"}>{dayTypeLabel(context.dayType)}</Badge>
        </div>
      </Panel>

      <Panel>
        <TeamScheduleCalendar
          basePath="/parent/schedule"
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
