import type { ClubMeal, DayType, MealLog, User } from "@prisma/client";
import { Share2 } from "lucide-react";
import { AsyncForm } from "@/components/async-form";
import { Badge, Button, Textarea } from "@/components/ui";
import { hasUserMealDetails, mealContextLine, mealFeedbackSummary } from "@/lib/meal-feedback";

type MealWithRelations = MealLog & {
  loggedBy: Pick<User, "name">;
  clubMeal: ClubMeal | null;
};

export function MealFeedbackCard({ meal, dayType, athleteGoal }: { meal: MealWithRelations; dayType: DayType; athleteGoal: string }) {
  const hasDetails = Boolean(meal.userDetails?.trim()) || hasUserMealDetails(meal.note, meal.extractedDescription);
  const suggestions = meal.suggestedImprovements.slice(0, 3);
  const summary = mealFeedbackSummary({
    mealType: meal.mealType,
    mealWindow: meal.mealWindow,
    dayType,
    score: meal.score,
    components: meal.components,
    qualityConcern: meal.qualityConcern,
    interpretationConfidence: meal.interpretationConfidence,
    athleteGoal
  });
  const keepImproveAdd = Object.entries(summary.keepImproveAdd).filter(([, value]) => value);

  return (
    <div className="rounded-2xl border border-white/80 bg-gradient-to-b from-white to-stone-50/80 p-4 shadow-[0_14px_34px_rgba(23,32,27,0.07)] ring-1 ring-stone-200/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{meal.displayTitle ?? (hasDetails ? meal.note : "Photo-based meal log")}</p>
          {hasDetails ? <p className="mt-1 text-sm text-stone-700">{meal.userDetails ?? meal.note}</p> : null}
          <p className="mt-1 text-sm text-stone-600">Logged by {meal.loggedBy.name}</p>
        </div>
        <Badge tone={meal.score >= 8 ? "green" : meal.score >= 6 ? "amber" : "red"}>{meal.score}/10</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="blue">Meal context: {mealContextLine(meal.mealType, meal.mealWindow, dayType)}</Badge>
        <Badge tone={summary.mealRole === "Low-quality snack pattern" ? "red" : "green"}>Meal role: {summary.mealRole}</Badge>
        {meal.interpretationConfidence ? (
          <Badge tone={meal.interpretationConfidence === "high" ? "green" : meal.interpretationConfidence === "medium" ? "blue" : "amber"}>
            {meal.interpretationSource === "openai_vision" ? "AI vision" : "Fallback"} · {meal.interpretationConfidence}
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 rounded-lg border border-stone-100 bg-white/75 p-3 text-sm text-stone-700">
        <p className="font-semibold text-stone-800">Identified meal components</p>
        <p className="mt-1">{meal.extractedDescription}</p>
      </div>

      {meal.qualityConcern ? (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium leading-6 text-red-800">
          {meal.qualityConcern}
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 text-sm lg:grid-cols-2">
        <div className="rounded-lg border border-stone-200/80 bg-white/70 p-3">
          <p className="font-semibold text-stone-800">Reason for score</p>
          <p className="mt-1 leading-6 text-stone-700">{summary.reasonForScore}</p>
        </div>
        <div className="rounded-lg border border-fuel-mint bg-fuel-mint/60 p-3">
          <p className="font-semibold text-fuel-green">What to do next</p>
          <p className="mt-1 leading-6 text-fuel-green">{summary.whatToDoNext}</p>
        </div>
      </div>

      {suggestions.length ? (
        <div className="mt-3 rounded-lg bg-fuel-mint/90 p-3 text-sm leading-6 text-fuel-green">
          <p className="font-semibold">Coach note</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
          </ul>
        </div>
      ) : null}

      {summary.betterVersion ? (
        <p className="mt-3 rounded-lg border border-stone-100 bg-white/70 p-3 text-sm font-medium leading-6 text-stone-700">{summary.betterVersion}</p>
      ) : null}

      {keepImproveAdd.length ? (
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
          {keepImproveAdd.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-stone-200/80 bg-white/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
              <p className="mt-1 text-stone-700">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <AsyncForm action={`/api/meals/${meal.id}/correct`} className="mt-3 grid gap-2" successMessage="Feedback updated">
        <p className="text-sm font-semibold text-stone-800">{hasDetails ? "Not accurate? Edit details" : "Not accurate? Add details"}</p>
        <label className="text-sm font-medium">
          Meal details
          <Textarea name="note" rows={2} defaultValue={hasDetails ? meal.userDetails ?? meal.note : ""} aria-label="Meal details" className="mt-1" />
        </label>
        <Button type="submit" className="bg-fuel-green hover:bg-green-800">Update feedback</Button>
      </AsyncForm>

      {meal.score >= 8 && !meal.clubMeal ? (
        <AsyncForm action={`/api/meals/${meal.id}/share`} className="mt-3" successMessage="Shared to library">
          <Button type="submit" className="bg-fuel-blue hover:bg-sky-800"><Share2 size={16} aria-hidden /> Share into club library</Button>
        </AsyncForm>
      ) : null}
    </div>
  );
}
