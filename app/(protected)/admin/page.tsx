import Link from "next/link";
import { AsyncForm } from "@/components/async-form";
import { AskEliteFuelCard } from "@/components/ask-elitefuel-card";
import { Button, Input, Panel, PageHeader } from "@/components/ui";
import { getClubTeams } from "@/lib/data";
import { requireSession } from "@/lib/session";

export default async function ClubAdminPage() {
  const session = await requireSession();
  const teams = await getClubTeams(session.user.clubId);
  const totalAthletes = teams.reduce((sum, team) => sum + team.athletes.length, 0);
  const totalStaffAssignments = teams.reduce((sum, team) => sum + team.staff.length, 0);
  const teamsWithDefaults = teams.filter((team) => team.defaults.length > 0).length;
  const teamsWithoutStaff = teams.filter((team) => team.staff.length === 0).length;
  const teamsWithoutAthletes = teams.filter((team) => team.athletes.length === 0).length;
  const setupItems = [
    { label: "Teams created", complete: teams.length > 0, detail: `${teams.length} team${teams.length === 1 ? "" : "s"}` },
    { label: "Roster started", complete: totalAthletes > 0, detail: `${totalAthletes} athlete${totalAthletes === 1 ? "" : "s"}` },
    { label: "Staff assigned", complete: totalStaffAssignments > 0, detail: `${totalStaffAssignments} assignment${totalStaffAssignments === 1 ? "" : "s"}` },
    { label: "Schedule defaults ready", complete: teams.length > 0 && teamsWithDefaults === teams.length, detail: `${teamsWithDefaults}/${teams.length || 0} teams` }
  ];

  return (
    <>
      <PageHeader title="Club admin" eyebrow="Organization operations" />
      <div className="mb-5">
        <AskEliteFuelCard
          title="Ask about setting up EliteFuel"
          description="Get a short admin-focused answer about team setup, roster imports, staff assignment, parent access, schedules, meal library setup, or club rollout."
          safetyNote="Platform guidance only. For athlete medical, allergy, supplement, injury, or eating concerns, involve the family and a qualified professional."
          emptyMessage="Ask a short setup, rollout, staff workflow, schedule, roster, parent access, or meal library question."
          examples={[
            "How should I set up a new team?",
            "What is the difference between staff and admin?",
            "How should our club use the meal library?"
          ]}
        />
      </div>
      <Panel className="mb-5 border-fuel-green/40 bg-gradient-to-br from-white via-fuel-mint/30 to-white">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Club-wide control center</p>
            <h2 className="mt-1 text-2xl font-semibold">Organization setup and readiness</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              Start here for broad club setup. Use Team roster for athletes, parent access, and staff assignment. Use Team schedule for team-level calendar defaults.
            </p>
          </div>
          <div className="grid gap-2">
            <Link href="/roster" className="rounded-md bg-fuel-blue px-3 py-2 text-center text-sm font-semibold text-white hover:bg-sky-800">Open Team roster</Link>
            <Link href="/schedule" className="rounded-md border border-stone-300 bg-white px-3 py-2 text-center text-sm font-semibold hover:bg-fuel-mint">Open Team schedule</Link>
          </div>
        </div>
      </Panel>
      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Panel>
          <h2 className="text-xl font-semibold">Club operations status</h2>
          <p className="mt-2 text-sm text-stone-600">A quick readiness view for setup, onboarding, and operational handoff.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {setupItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-stone-200 bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold">{item.detail}</p>
                <p className={`mt-1 text-xs font-semibold ${item.complete ? "text-fuel-green" : "text-amber-800"}`}>{item.complete ? "Ready" : "Needs setup"}</p>
              </div>
            ))}
          </div>
          {teamsWithoutStaff || teamsWithoutAthletes ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {teamsWithoutStaff ? `${teamsWithoutStaff} team${teamsWithoutStaff === 1 ? "" : "s"} still need staff assignment. ` : ""}
              {teamsWithoutAthletes ? `${teamsWithoutAthletes} team${teamsWithoutAthletes === 1 ? "" : "s"} still need roster setup.` : ""}
            </p>
          ) : null}
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">Admin quick actions</h2>
          <p className="mt-2 text-sm text-stone-600">Use admin for club setup and oversight. Staff handle day-to-day athlete tailoring.</p>
          <div className="mt-4 grid gap-2">
            {[
              ["Create teams", "#team-setup"],
              ["Manage roster and parent access", "/roster"],
              ["Assign staff to teams", "/roster"],
              ["Set team schedule defaults", "/schedule"],
              ["Manage club meal library", "/library"]
            ].map(([label, href]) => (
              <Link key={label} href={href} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-fuel-mint">
                {label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
      <div id="team-setup" className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <h2 className="text-xl font-semibold">Create a team</h2>
          <AsyncForm action="/api/admin/teams" resetOnSuccess className="mt-4 grid gap-3" successMessage="Team created">
            <Input name="name" placeholder="Team name" required />
            <Input name="sport" placeholder="Sport" required />
            <Button type="submit">Create team</Button>
          </AsyncForm>
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">Club setup context</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-stone-200 p-3"><p className="text-sm text-stone-500">Teams</p><p className="font-semibold">{teams.length}</p></div>
            <div className="rounded-md border border-stone-200 p-3"><p className="text-sm text-stone-500">Athletes</p><p className="font-semibold">{totalAthletes}</p></div>
            <div className="rounded-md border border-stone-200 p-3"><p className="text-sm text-stone-500">Staff assignments</p><p className="font-semibold">{totalStaffAssignments}</p></div>
          </div>
        </Panel>
      </div>
    </>
  );
}
