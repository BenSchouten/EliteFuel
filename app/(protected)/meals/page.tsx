import { Droplet } from "lucide-react";
import { redirect } from "next/navigation";
import { AsyncForm } from "@/components/async-form";
import { MealFeedbackCard } from "@/components/meal-feedback-card";
import { MealLogForm } from "@/components/meal-log-form";
import { Badge, Button, Input, Panel, PageHeader } from "@/components/ui";
import { UrineColorTrend } from "@/components/urine-color-trend";
import { UrineColorPicker } from "@/components/urine-color-picker";
import { getPrimaryAthlete } from "@/lib/data";
import { mealWindowLabel, softenCuratedCue } from "@/lib/nutrition-guidance";
import { prisma } from "@/lib/prisma";
import { effectiveDayType } from "@/lib/schedule";
import { requireSession } from "@/lib/session";

export default async function MealsPage() {
  const session = await requireSession();
  if (session.user.role === "CLUB_ADMIN") redirect("/admin");
  if (session.user.role === "STAFF") redirect("/staff");
  const athlete = await getPrimaryAthlete(session.user);
  if (!athlete) {
    return (
      <>
        <PageHeader title="Meals" eyebrow="No athlete context" />
        <Panel>
          <h2 className="text-xl font-semibold">No athlete profile is connected yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Meal logging needs an athlete roster profile. Ask a club admin or staff member to connect this account before logging meals.
          </p>
        </Panel>
      </>
    );
  }
  const meals = await prisma.mealLog.findMany({
    where: { athleteId: athlete.id },
    include: { loggedBy: true, clubMeal: true },
    orderBy: { createdAt: "desc" },
    take: 12
  });
  const library = await prisma.clubMeal.findMany({ where: { clubId: session.user.clubId }, orderBy: { score: "desc" }, take: 4 });
  const fluidEntries = await prisma.fluidCheckIn.findMany({
    where: { athleteId: athlete.id, urineColor: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  const dayType = effectiveDayType(athlete.team.defaults, athlete.overrides).dayType;
  const canSubmitFluidCheckIn = session.user.role === "ATHLETE" && athlete.userId === session.user.id;
  const fluidReadOnlyNote =
    session.user.role === "PARENT"
      ? "Athletes log their own fluid check-ins. Parents can view recent trends here."
      : "Athletes log their own fluid check-ins. This hydration area is read-only for this role.";

  return (
    <>
      <PageHeader title="Meals" eyebrow={`${athlete.firstName} ${athlete.lastName}`} />
      <div className="rounded-2xl bg-gradient-to-b from-white via-stone-50/80 to-white p-2 md:p-3">
        <div className="grid gap-3 lg:grid-cols-[1.35fr_0.85fr]">
          <Panel className="border-white/80 bg-white/90">
            <h2 className="text-xl font-semibold">Log a meal</h2>
            <MealLogForm athleteId={athlete.id} dayType={dayType} />
          </Panel>
          <Panel className="border-white/80 bg-white/90">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Droplet size={18} aria-hidden /> Quick fluid check-in</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">A lightweight check-in for fluids around training, travel, and recovery.</p>
            {canSubmitFluidCheckIn ? (
              <AsyncForm action="/api/fluid" resetOnSuccess className="mt-4 grid gap-3" successMessage="Fluid check-in saved">
                <input type="hidden" name="athleteId" value={athlete.id} />
                <Input name="volumeOz" type="number" min="0" placeholder="Estimated ounces" />
                <UrineColorPicker />
                <Input name="note" placeholder="Short note, optional" />
                <Button type="submit" className="bg-fuel-blue hover:bg-sky-800">Save fluid check-in</Button>
              </AsyncForm>
            ) : (
              <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2 text-sm leading-6 text-sky-900">{fluidReadOnlyNote}</p>
            )}
            <UrineColorTrend entries={fluidEntries} />
          </Panel>
        </div>
        <Panel className="mt-3 border-white/80 bg-white/90">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recent meal feedback</h2>
              <p className="mt-1 text-sm text-stone-600">Latest logs, interpretation, score, and practical next step.</p>
            </div>
            <Badge tone="blue">{meals.length} recent</Badge>
          </div>
          {meals.length ? (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {meals.map((meal) => <MealFeedbackCard key={meal.id} meal={meal} dayType={dayType} athleteGoal={athlete.primaryGoal} />)}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-4 text-sm leading-6 text-stone-700">
              No meals logged yet. Use the meal form above to save a first log, then EliteFuel will show interpreted components, score, feedback, and correction options here.
            </p>
          )}
        </Panel>
        <Panel className="mt-3 border-white/80 bg-gradient-to-b from-white/95 to-stone-50/80">
          <h2 className="text-xl font-semibold">Club library access</h2>
          {library.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {library.map((meal) => (
                <div key={meal.id} className="rounded-lg border border-stone-200/80 bg-white/80 p-3">
                  <p className="font-semibold">{meal.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{softenCuratedCue(meal.curatedCue) ?? mealWindowLabel(meal.mealWindow)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-4 text-sm leading-6 text-stone-700">
              No club meal examples yet. Staff and admins can add strong meal examples to build the club library.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
