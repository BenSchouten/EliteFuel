import { Save } from "lucide-react";
import { redirect } from "next/navigation";
import { AsyncForm } from "@/components/async-form";
import { Button, Input, Panel, PageHeader, Textarea } from "@/components/ui";
import { getPrimaryAthlete } from "@/lib/data";
import { requireSession } from "@/lib/session";

export default async function FuelingProfilePage() {
  const session = await requireSession();
  if (session.user.role === "CLUB_ADMIN") redirect("/admin");
  if (session.user.role === "STAFF") redirect("/staff");
  const athlete = await getPrimaryAthlete(session.user);
  if (!athlete) {
    return (
      <>
        <PageHeader title="My fueling profile" eyebrow="No athlete connected" />
        <Panel>
          <h2 className="text-xl font-semibold">No athlete profile is connected yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Ask a club admin or staff member to connect this login to an athlete roster profile before editing fueling details and food safety information.
          </p>
        </Panel>
      </>
    );
  }

  const isParent = session.user.role === "PARENT";
  const canEditCore = session.user.role === "ATHLETE" || isParent;
  const canEditFoodSafety = canEditCore;
  const canEditParent = session.user.role === "PARENT";
  const canEditRehab = false;
  const pageTitle = isParent ? `Update ${athlete.firstName}’s fueling profile` : "My fueling profile";

  return (
    <>
      <PageHeader title={pageTitle} eyebrow={`${athlete.firstName} ${athlete.lastName}`} />
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Panel>
          <h2 className="text-xl font-semibold">Athlete details</h2>
          <p className="mt-2 text-sm text-stone-600">
            {isParent
              ? `Update ${athlete.firstName}’s basic fueling profile so guidance matches what your family and staff know.`
              : "These fields help EliteFuel match guidance to the athlete, sport, and goals."}
          </p>
          <AsyncForm action="/api/profile" className="mt-4 grid gap-3 md:grid-cols-2" successMessage="Athlete details saved">
            <input type="hidden" name="athleteId" value={athlete.id} />
            <label className="text-sm font-medium">First name<Input className="mt-1" name="firstName" defaultValue={athlete.firstName} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium">Last name<Input className="mt-1" name="lastName" defaultValue={athlete.lastName} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium">Age<Input className="mt-1" name="age" type="number" min="1" defaultValue={athlete.age} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium">Sport<Input className="mt-1" name="sport" defaultValue={athlete.sport} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium">Position<Input className="mt-1" name="position" defaultValue={athlete.position ?? ""} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium">Gender / sex<Input className="mt-1" name="sex" defaultValue={athlete.sex ?? ""} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium">Height<Input className="mt-1" name="height" defaultValue={athlete.height ?? ""} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium">Weight<Input className="mt-1" name="weight" defaultValue={athlete.weight ?? ""} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium md:col-span-2">Primary goal<Textarea className="mt-1" name="primaryGoal" rows={2} defaultValue={athlete.primaryGoal} disabled={!canEditCore} /></label>
            <label className="text-sm font-medium md:col-span-2">Food preferences<Textarea className="mt-1" name="foodPreferences" rows={2} defaultValue={athlete.foodPreferences ?? ""} disabled={!canEditCore} /></label>
            {canEditCore ? <Button type="submit" className="md:col-span-2"><Save size={16} aria-hidden /> Save athlete details</Button> : null}
          </AsyncForm>
        </Panel>
        <div className="grid gap-5">
          <Panel>
            <h2 className="text-xl font-semibold">Food safety and allergies</h2>
            <p className="mt-2 text-sm text-stone-600">Shared with staff so support stays consistent around meals, travel, and training days.</p>
            <AsyncForm action="/api/profile" className="mt-4 grid gap-3" successMessage="Food safety details saved">
              <input type="hidden" name="athleteId" value={athlete.id} />
              <label className="text-sm font-medium">
                Allergies / foods to avoid
                <Textarea className="mt-1" name="allergies" rows={3} defaultValue={athlete.allergies} disabled={!canEditFoodSafety} />
              </label>
              <label className="text-sm font-medium">
                Dietary restrictions
                <Textarea className="mt-1" name="dietaryRestrictions" rows={3} defaultValue={athlete.dietaryRestrictions} disabled={!canEditFoodSafety} />
              </label>
              {canEditFoodSafety ? <Button type="submit"><Save size={16} aria-hidden /> Save food safety details</Button> : null}
            </AsyncForm>
          </Panel>
          <Panel>
            <h2 className="text-xl font-semibold">Parent contact</h2>
            <AsyncForm action="/api/profile" className="mt-4 grid gap-3" successMessage="Parent contact saved">
              <input type="hidden" name="athleteId" value={athlete.id} />
              <label className="text-sm font-medium">Parent contact name<Input className="mt-1" name="parentContactName" defaultValue={athlete.parentContactName ?? ""} disabled={!canEditParent} /></label>
              <label className="text-sm font-medium">Parent contact email<Input className="mt-1" name="parentContactEmail" type="email" defaultValue={athlete.parentContactEmail ?? ""} disabled={!canEditParent} /></label>
              {canEditParent ? <Button type="submit"><Save size={16} aria-hidden /> Save parent contact</Button> : null}
            </AsyncForm>
          </Panel>
          <Panel>
            <h2 className="text-xl font-semibold">Rehab / return-to-play notes</h2>
            {canEditRehab ? (
              <AsyncForm action="/api/profile" className="mt-4 grid gap-3" successMessage="Staff notes saved">
                <input type="hidden" name="athleteId" value={athlete.id} />
                <label className="text-sm font-medium">Injury / return-to-play status<Input className="mt-1" name="injuryStatus" defaultValue={athlete.injuryStatus ?? ""} /></label>
                <label className="text-sm font-medium">Staff rehab notes<Textarea className="mt-1" name="rehabNotes" rows={3} defaultValue={athlete.rehabNotes ?? ""} /></label>
                <Button type="submit"><Save size={16} aria-hidden /> Save staff notes</Button>
              </AsyncForm>
            ) : (
              <p className="mt-3 text-sm text-stone-600">Staff manages rehab and return-to-play notes so internal support stays aligned with the team plan.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
