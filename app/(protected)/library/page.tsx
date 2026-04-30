import { MealType } from "@prisma/client";
import { Badge, Panel, PageHeader } from "@/components/ui";
import { getPrimaryAthlete } from "@/lib/data";
import { recommendationLabel, rankMeals } from "@/lib/library-ranking";
import { softenCuratedCue, suggestedWindowForDay } from "@/lib/nutrition-guidance";
import { prisma } from "@/lib/prisma";
import { effectiveDayType } from "@/lib/schedule";
import { requireSession } from "@/lib/session";

export default async function ClubMealLibraryPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  const athlete = await getPrimaryAthlete(session.user);
  const meals = await prisma.clubMeal.findMany({
    where: {
      clubId: session.user.clubId,
      ...(searchParams.tag ? { tags: { has: searchParams.tag } } : {}),
      ...(searchParams.mealType ? { mealType: searchParams.mealType as MealType } : {})
    },
    include: { sharedBy: true },
    orderBy: { createdAt: "desc" }
  });
  const isRecommendationRole = ["ATHLETE", "PARENT"].includes(session.user.role) && athlete;
  const dayType = athlete ? effectiveDayType(athlete.team.defaults, athlete.overrides).dayType : null;
  const context = athlete && dayType ? { dayType, mealWindow: suggestedWindowForDay(dayType), goal: athlete.primaryGoal } : null;
  const visibleMeals = context && isRecommendationRole ? rankMeals(meals, context) : meals;
  const best = visibleMeals[0];

  return (
    <>
      <PageHeader title="Club meal library" eyebrow="One club-level library" />
      {context && isRecommendationRole && best ? (
        <Panel className="mb-5 border-fuel-green">
          <Badge tone="green">{recommendationLabel(context)}</Badge>
          <h2 className="mt-3 text-2xl font-semibold">{best.title}</h2>
          <p className="mt-2 text-stone-700">{best.description}</p>
          <p className="mt-3 text-sm font-semibold">{best.score}/10 · {softenCuratedCue(best.curatedCue) ?? "Club example"}</p>
        </Panel>
      ) : null}
      <Panel>
        <form className="mb-5 grid gap-3 md:grid-cols-4">
          <select name="mealType" defaultValue={searchParams.mealType ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="">All meal types</option>
            {["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_TRAINING", "POST_TRAINING"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input name="tag" defaultValue={searchParams.tag ?? ""} placeholder="Filter by tag" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button className="rounded-md bg-fuel-green px-3 py-2 text-sm font-semibold text-white">Filter library</button>
        </form>
        {visibleMeals.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleMeals.map((meal) => (
              <article key={meal.id} className="rounded-lg border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold">{meal.title}</h2>
                  <Badge tone={meal.score >= 8 ? "green" : "amber"}>{meal.score}/10</Badge>
                </div>
                <p className="mt-2 text-sm text-stone-700">{meal.description}</p>
                {meal.curatedCue ? <p className="mt-3 text-sm font-semibold text-fuel-green">{softenCuratedCue(meal.curatedCue)}</p> : null}
                <p className="mt-3 text-xs text-stone-500">Shared by {meal.sharedBy.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">{meal.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 text-sm leading-6 text-stone-700">
            No meals match these filters yet. Clear the filters or add strong examples from meal logs to grow the club library.
          </p>
        )}
      </Panel>
    </>
  );
}
