import { DayType, MealWindow, type ClubMeal } from "@prisma/client";

type RankContext = {
  dayType: DayType;
  mealWindow: MealWindow;
  goal: string;
};

export function rankMeals<T extends Pick<ClubMeal, "dayTypeFit" | "mealWindow" | "goalFit" | "curatedCue" | "score">>(
  meals: T[],
  context: RankContext
) {
  return [...meals].sort((a, b) => libraryScore(b, context) - libraryScore(a, context));
}

export function libraryScore(meal: Pick<ClubMeal, "dayTypeFit" | "mealWindow" | "goalFit" | "curatedCue" | "score">, context: RankContext) {
  let score = meal.score;
  if (meal.dayTypeFit.includes(context.dayType)) score += 4;
  if (meal.mealWindow === context.mealWindow) score += 3;
  if (meal.goalFit.some((goal) => context.goal.toLowerCase().includes(goal.toLowerCase()))) score += 2;
  if (meal.curatedCue) score += 1;
  return score;
}

export function recommendationLabel(context: RankContext) {
  if (context.mealWindow === "PRE_TRAINING") return "Great fit for this pre-training window";
  if (context.mealWindow === "POST_TRAINING") return "Great fit for this post-training window";
  if (context.dayType === "MATCH") return "Strong fit for match day";
  if (context.dayType === "TRAVEL") return "Good option for travel today";
  return "Strong fit for today";
}
