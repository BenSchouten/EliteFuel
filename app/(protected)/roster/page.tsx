import { UserPlus, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { AsyncForm } from "@/components/async-form";
import { RosterImportGrid } from "@/components/roster-import-grid";
import { Button, Input, Panel, PageHeader, Select } from "@/components/ui";
import { getClubTeams } from "@/lib/data";
import { requireSession } from "@/lib/session";

export default async function TeamRosterPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  if (!["CLUB_ADMIN", "STAFF"].includes(session.user.role)) redirect("/athlete");
  const isAdmin = session.user.role === "CLUB_ADMIN";
  const allTeams = await getClubTeams(session.user.clubId);
  const teams = isAdmin ? allTeams : allTeams.filter((team) => team.staff.some((assignment) => assignment.userId === session.user.id));
  const selectedTeamId = isAdmin
    ? searchParams.team
    : teams.some((team) => team.id === searchParams.team)
      ? searchParams.team
      : teams[0]?.id;
  const selectedTeam = selectedTeamId ? teams.find((team) => team.id === selectedTeamId) ?? null : null;

  return (
    <>
      <PageHeader title="Team roster" eyebrow={isAdmin ? "Roster, parent access, and staff assignment" : "Assigned team roster context"} />
      <Panel className="mb-5 border-fuel-green/40 bg-gradient-to-br from-white via-fuel-mint/30 to-white">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Team workspace</p>
            <h2 className="mt-1 text-2xl font-semibold">{selectedTeam ? `Working in: ${selectedTeam.name}` : isAdmin ? "Choose a team to manage" : "No teams assigned"}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {selectedTeam
                ? isAdmin
                  ? `Roster rows, parent access, and staff assignment below are scoped to ${selectedTeam.name}.`
                  : `Manage athlete roster rows for ${selectedTeam.name}. Staff assignment stays with club admins.`
                : isAdmin
                  ? "Select a team to manage roster rows, parent access, account status, and staff assignments."
                  : "No teams assigned. Ask a club admin to assign you to a team."}
            </p>
          </div>
          {teams.length ? <form className="grid gap-2">
            <label className="text-sm font-semibold text-stone-800">
              Team workspace
              <Select name="team" defaultValue={selectedTeam?.id ?? ""} className="mt-1">
                <option value="">Select a team</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </Select>
            </label>
            <Button type="submit" className="bg-fuel-blue hover:bg-sky-800">Open roster workspace</Button>
          </form> : null}
        </div>
      </Panel>

      <Panel>
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Users size={18} aria-hidden /> Team roster</h2>
        {selectedTeam ? (
          <>
            <p className="mt-2 text-sm text-stone-600">Management view for {selectedTeam.name}. This is setup and account readiness, not day-to-day athlete coaching.</p>
            {selectedTeam.athletes.length ? (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-inner">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-gradient-to-r from-stone-50 to-fuel-mint/20 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-3 py-2">Athlete</th>
                      <th className="px-3 py-2">Account</th>
                      <th className="px-3 py-2">Parent / guardian</th>
                      <th className="px-3 py-2">Team</th>
                      <th className="px-3 py-2">Profile setup</th>
                      <th className="px-3 py-2">Roster action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeam.athletes.map((athlete) => {
                      const linkedParents = athlete.parentLinks.map((link) => link.parent);
                      const hasFoodSafety = Boolean(athlete.dietaryRestrictions || athlete.allergies);
                      const hasSupportConnection = Boolean(athlete.user || linkedParents.length || athlete.parentContactEmail);
                      const setupChecks = [
                        true,
                        athlete.primaryGoal,
                        hasFoodSafety,
                        hasSupportConnection
                      ].filter(Boolean).length;
                      return (
                        <tr key={athlete.id} className="border-t border-stone-100 transition-colors hover:bg-fuel-mint/15">
                          <td className="px-3 py-3 font-semibold">{athlete.firstName} {athlete.lastName}</td>
                          <td className="px-3 py-3">
                            {athlete.user?.email ? (
                              <span>{athlete.user.email}</span>
                            ) : (
                              <span className="text-stone-500">No athlete login yet</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {linkedParents.length ? (
                              linkedParents.map((parent) => parent.email).join(", ")
                            ) : athlete.parentContactEmail ? (
                              <span>Contact only: {athlete.parentContactEmail}</span>
                            ) : (
                              <span className="text-stone-500">No parent linked</span>
                            )}
                          </td>
                          <td className="px-3 py-3">{selectedTeam.name}</td>
                          <td className="px-3 py-3">{setupChecks}/4 ready</td>
                          <td className="px-3 py-3"><a href="#roster-import" className="font-semibold text-fuel-blue hover:text-sky-800">Update via roster import</a></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                No athletes are on {selectedTeam.name} yet. Use roster import below to add athletes and parent access.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
            {isAdmin ? "Select a team to manage roster and staff assignments." : "No teams assigned. Ask a club admin to assign you to a team."}
          </p>
        )}
      </Panel>

      {selectedTeam ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel id="roster-import">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Users size={18} aria-hidden /> Add athletes and parents</h2>
            <p className="mt-2 text-sm text-stone-600">
              Paste from Excel or type directly into the table for {selectedTeam.name}. Leave emails blank for roster-only athletes,
              parent-managed athletes, or athletes who will get login access later.
            </p>
            <RosterImportGrid teamId={selectedTeam.id} />
          </Panel>
          {isAdmin ? <Panel>
            <h2 className="flex items-center gap-2 text-xl font-semibold"><UserPlus size={18} aria-hidden /> Assign staff</h2>
            <p className="mt-2 text-sm text-stone-600">Assign staff accounts to {selectedTeam.name}. Staff handle day-to-day athlete support.</p>
            <AsyncForm action="/api/admin/staff" resetOnSuccess className="mt-4 grid gap-3" successMessage="Staff assignment saved">
              <input type="hidden" name="teamId" value={selectedTeam.id} />
              <Input name="name" placeholder="Staff name" required />
              <Input name="email" type="email" placeholder="staff@example.com" required />
              <Button type="submit">Assign staff to team</Button>
            </AsyncForm>
            <div className="mt-5 space-y-2">
              {selectedTeam.staff.length ? selectedTeam.staff.map((item) => (
                <p key={item.id} className="rounded-md border border-stone-200 p-3 text-sm">{item.user.name} · {item.user.email}</p>
              )) : <p className="rounded-md border border-stone-200 p-3 text-sm text-stone-600">No staff assigned yet.</p>}
            </div>
          </Panel> : (
            <Panel>
              <h2 className="flex items-center gap-2 text-xl font-semibold"><UserPlus size={18} aria-hidden /> Staff assignment</h2>
              <p className="mt-2 text-sm text-stone-600">Club admins manage staff access. You can update athlete roster rows for assigned teams here.</p>
              <div className="mt-5 space-y-2">
                {selectedTeam.staff.length ? selectedTeam.staff.map((item) => (
                  <p key={item.id} className="rounded-md border border-stone-200 p-3 text-sm">{item.user.name} · {item.user.email}</p>
                )) : <p className="rounded-md border border-stone-200 p-3 text-sm text-stone-600">No staff assigned yet.</p>}
              </div>
            </Panel>
          )}
        </div>
      ) : null}
    </>
  );
}
