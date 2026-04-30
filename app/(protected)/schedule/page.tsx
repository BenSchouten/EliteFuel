import { DayType, OverrideReason } from "@prisma/client";
import { RotateCcw } from "lucide-react";
import { AsyncForm } from "@/components/async-form";
import { TeamScheduleCalendar } from "@/components/team-schedule-calendar";
import { Badge, Button, Input, Panel, PageHeader, Select, Textarea } from "@/components/ui";
import { getClubTeams } from "@/lib/data";
import { dateKey, dayLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { monthKey, monthStartFromParam } from "@/lib/schedule-calendar";
import { getPlannedTeamScheduleEntries, getTeamScheduleRhythm } from "@/lib/schedule-data";
import { athleteName, dayTypeLabel, defaultForDate } from "@/lib/schedule";
import { requireSession } from "@/lib/session";

const dayTypeOptions = Object.values(DayType);
const scheduleTimes = Array.from({ length: 32 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";
  return { value, label: `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}` };
});

export default async function TeamSchedulePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  const isAdmin = session.user.role === "CLUB_ADMIN";
  const allTeams = await getClubTeams(session.user.clubId);
  const teams = isAdmin ? allTeams : allTeams.filter((team) => team.staff.some((assignment) => assignment.userId === session.user.id));
  const selectedTeamId = isAdmin
    ? searchParams.team
    : teams.some((team) => team.id === searchParams.team)
      ? searchParams.team
      : teams[0]?.id;
  const selectedTeam = selectedTeamId ? teams.find((team) => team.id === selectedTeamId) ?? null : null;
  const visibleMonth = monthStartFromParam(searchParams.month);
  const plannedEntries = selectedTeam ? await getPlannedTeamScheduleEntries(selectedTeam.id, visibleMonth) : [];
  const scheduleRhythm = selectedTeam ? await getTeamScheduleRhythm(selectedTeam.id) : [];
  const overrides = selectedTeam ? await prisma.athleteScheduleOverride.findMany({
    where: {
      athlete: { clubId: session.user.clubId, teamId: selectedTeam.id },
      ...(searchParams.active === "true" ? { active: true } : {}),
      ...(searchParams.reason ? { reason: searchParams.reason as OverrideReason } : {})
    },
    include: { athlete: { include: { team: { include: { defaults: true } } } } },
    orderBy: { date: "asc" }
  }) : [];

  return (
    <>
      <PageHeader title="Team schedule" eyebrow={isAdmin ? "Team calendar planning" : "Team calendar and athlete exceptions"} />
      <Panel className="mb-5 border-fuel-green/40 bg-gradient-to-br from-white via-fuel-mint/30 to-white">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Schedule workspace</p>
            <h2 className="mt-1 text-2xl font-semibold">{selectedTeam ? `Working in: ${selectedTeam.name}` : "Choose a team schedule"}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {selectedTeam
                ? "Build the team schedule, repeat sessions when useful, and review athlete exceptions. Staff own athlete-specific overrides."
                : "Select a team to build the schedule and plan future months."}
            </p>
          </div>
          <form className="grid gap-2">
            <label className="text-sm font-semibold text-stone-800">
              Team
              <Select name="team" defaultValue={selectedTeam?.id ?? ""} className="mt-1">
                <option value="">Select a team</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </Select>
            </label>
            <input type="hidden" name="month" value={monthKey(visibleMonth)} />
            <Button type="submit" className="bg-fuel-blue hover:bg-sky-800">Open schedule</Button>
          </form>
        </div>
      </Panel>

      {selectedTeam ? (
        <>
          <Panel>
            <TeamScheduleCalendar
              basePath="/schedule"
              defaults={scheduleRhythm}
              month={visibleMonth}
              plannedEntries={plannedEntries}
              teamId={selectedTeam.id}
              teamName={selectedTeam.name}
            />
          </Panel>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel>
              <h2 className="text-xl font-semibold">Create schedule item</h2>
              <p className="mt-2 text-sm text-stone-600">Add a one-off date or repeat it weekly to build the normal team rhythm.</p>
              <AsyncForm action="/api/schedule/entries" className="mt-5 grid gap-3 lg:grid-cols-[0.75fr_0.8fr_1fr_0.8fr]" successMessage="Schedule item saved">
                <input type="hidden" name="teamId" value={selectedTeam.id} />
                <label className="text-sm font-semibold text-stone-800">
                  Date / start date
                  <Input name="date" type="date" defaultValue={dateKey(visibleMonth)} className="mt-1" />
                </label>
                <label className="text-sm font-semibold text-stone-800">
                  Day type
                  <Select name="dayType" defaultValue="TRAINING" className="mt-1">
                    {dayTypeOptions.map((dayType) => <option key={dayType}>{dayType}</option>)}
                  </Select>
                </label>
                <label className="text-sm font-semibold text-stone-800">
                  Plan label
                  <Input name="title" placeholder="Tournament travel, preseason, break..." className="mt-1" />
                </label>
                <label className="text-sm font-semibold text-stone-800">
                  Start time
                  <Select name="startTime" defaultValue="17:00" required className="mt-1">
                    {scheduleTimes.map((time) => <option key={time.value} value={time.value}>{time.label}</option>)}
                  </Select>
                </label>
                <label className="text-sm font-semibold text-stone-800">
                  End time optional
                  <Select name="endTime" defaultValue="" className="mt-1">
                    <option value="">No end time</option>
                    {scheduleTimes.map((time) => <option key={time.value} value={time.value}>{time.label}</option>)}
                  </Select>
                </label>
                <label className="text-sm font-semibold text-stone-800">
                  Repeat
                  <Select name="repeat" defaultValue="none" className="mt-1">
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Repeats weekly</option>
                  </Select>
                </label>
                <label className="text-sm font-semibold text-stone-800 lg:col-span-3">
                  Team notes
                  <Input name="notes" placeholder="Optional team-level context for this date" className="mt-1" />
                </label>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">Save schedule item</Button>
                </div>
              </AsyncForm>
            </Panel>
            <Panel>
              <h2 className="text-xl font-semibold">Schedule status</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-md border border-stone-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Selected team</p>
                  <p className="mt-1 font-semibold">{selectedTeam.name}</p>
                </div>
                <div className="rounded-md border border-stone-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Repeating rhythm</p>
                  <p className="mt-1 font-semibold">{selectedTeam.defaults.length}/7 weekdays set</p>
                </div>
                <div className="rounded-md border border-stone-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Visible athlete exceptions</p>
                  <p className="mt-1 font-semibold">{overrides.length}</p>
                </div>
              </div>
              <p className="mt-4 rounded-md bg-fuel-mint p-3 text-sm leading-6 text-fuel-green">
                {isAdmin
                  ? "Admins manage the team-level calendar across club teams. Staff handle athlete-specific tailoring."
                  : "Staff can manage calendars for assigned teams and handle athlete-specific overrides."}
              </p>
            </Panel>
          </div>
        </>
      ) : (
        <Panel>
          <h2 className="text-xl font-semibold">{session.user.role === "STAFF" ? "No teams assigned" : "Select a team to build the schedule"}</h2>
          <p className="mt-2 text-stone-700">
            {session.user.role === "STAFF"
              ? "No teams assigned. Ask a club admin to assign you to a team."
              : "Team schedule stays club-operational here. Choose a team above to plan future months and repeating sessions."}
          </p>
        </Panel>
      )}

      {!isAdmin && selectedTeam ? (
        <Panel className="mt-5">
          <h2 className="text-xl font-semibold">Add athlete override</h2>
          <AsyncForm action="/api/schedule/overrides" className="mt-4 grid gap-3" successMessage="Athlete override saved">
            <input type="hidden" name="teamId" value={selectedTeam.id} />
            <input type="hidden" name="month" value={monthKey(visibleMonth)} />
            <Select name="athleteId">
              {selectedTeam.athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athleteName(athlete)}</option>)}
            </Select>
            <Input name="date" type="date" defaultValue={dateKey(new Date())} />
            <div className="grid gap-3 md:grid-cols-2">
              <Select name="dayType" defaultValue="MODIFIED_LOAD">
                {dayTypeOptions.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Select name="reason" defaultValue="MODIFIED_LOAD">
                {["INJURY", "REHAB", "TRAVEL", "RETURN_TO_PLAY", "MODIFIED_LOAD", "REST", "OTHER"].map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
            <Textarea name="note" rows={3} placeholder="Reason note for staff context" />
            <Button type="submit">Save override</Button>
          </AsyncForm>
        </Panel>
      ) : null}

      {selectedTeam ? (
        <Panel className="mt-5">
          <h2 className="text-xl font-semibold">Exceptions oversight</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-4">
            <input type="hidden" name="team" value={selectedTeam.id} />
            <Select name="reason" defaultValue={searchParams.reason ?? ""}>
              <option value="">Any reason</option>
              {["INJURY", "REHAB", "TRAVEL", "RETURN_TO_PLAY", "MODIFIED_LOAD", "REST", "OTHER"].map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Select name="active" defaultValue={searchParams.active ?? ""}>
              <option value="">All overrides</option>
              <option value="true">Active overrides only</option>
            </Select>
            <Button type="submit">Apply filters</Button>
          </form>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="py-2">Athlete</th>
                  <th>Team</th>
                  <th>Date/day</th>
                  <th>Team rhythm</th>
                  <th>Athlete override</th>
                  <th>Reason</th>
                  <th>Note</th>
                  {!isAdmin ? <th>Reset</th> : null}
                </tr>
              </thead>
              <tbody>
                {overrides.map((override) => {
                  const teamDefault = defaultForDate(override.athlete.team.defaults, override.date);
                  return (
                    <tr key={override.id} className="border-b border-stone-100">
                      <td className="py-3 font-medium">{athleteName(override.athlete)}</td>
                      <td>{override.athlete.team.name}</td>
                      <td>{dayLabel(override.date)}</td>
                      <td>{dayTypeLabel(teamDefault?.dayType ?? "REST")}</td>
                      <td><Badge tone={override.active ? "amber" : "neutral"}>{dayTypeLabel(override.dayType)}</Badge></td>
                      <td>{dayTypeLabel(override.reason)}</td>
                      <td>{override.note}</td>
                      {!isAdmin ? (
                        <td>
                          {override.active ? (
                            <AsyncForm action={`/api/schedule/overrides/${override.id}/reset?team=${selectedTeam.id}&month=${monthKey(visibleMonth)}`} successMessage="Override reset">
                              <Button type="submit" className="bg-stone-800 hover:bg-stone-950"><RotateCcw size={14} aria-hidden /> Reset</Button>
                            </AsyncForm>
                          ) : "Default"}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </>
  );
}
