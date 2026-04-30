import type { DayType, MealType, MealWindow } from "@prisma/client";
import { dayTypeLabel } from "@/lib/schedule";

export function mealTypeLabel(mealType: MealType) {
  return mealType
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function mealWindowDisplayLabel(mealWindow: MealWindow) {
  if (mealWindow === "PRE_TRAINING") return "Pre-training";
  if (mealWindow === "POST_TRAINING") return "Post-training";
  if (mealWindow === "TRAVEL") return "Travel";
  return "Regular meal";
}

export function mealContextLine(mealType: MealType, mealWindow: MealWindow, dayType: DayType) {
  return `${mealTypeLabel(mealType)} · ${mealWindowDisplayLabel(mealWindow)} · ${dayTypeLabel(dayType)}`;
}

export function hasUserMealDetails(note: string, extractedDescription: string) {
  const normalizedNote = note.trim();
  if (!normalizedNote) return false;
  if (normalizedNote === extractedDescription.trim()) return false;
  if (normalizedNote === "Meal photo submitted") return false;
  return true;
}

type FeedbackInput = {
  mealType: MealType;
  mealWindow: MealWindow;
  dayType: DayType;
  score: number;
  components: string[];
  qualityConcern: string | null;
  interpretationConfidence: string | null;
  athleteGoal: string;
};

const proteinTerms = ["protein", "egg", "eggs", "chicken", "turkey", "fish", "beef", "tofu", "yogurt", "cheese", "beans", "milk"];
const carbTerms = ["carbohydrate", "carb", "toast", "rice", "pasta", "oats", "potato", "bagel", "bread", "fruit", "banana", "kiwi", "granola", "wrap", "pretzels"];
const produceTerms = ["fruit", "banana", "kiwi", "berries", "vegetables", "vegetable", "salad", "avocado", "apple", "orange"];
const lowQualityTerms = ["packaged snack", "sugary drink", "chips", "cookies", "cookie", "candy", "soda", "energy drink", "donut", "fried", "fries"];
const fluidTerms = ["water", "milk", "smoothie"];
const richerFatTerms = ["avocado", "cheese", "cheddar", "fried", "fries"];

function includesAny(items: string[], terms: string[]) {
  const text = items.join(" ").toLowerCase();
  return terms.some((term) => text.includes(term));
}

function matchedTerms(items: string[], terms: string[]) {
  const text = items.join(" ").toLowerCase();
  return terms.filter((term) => text.includes(term));
}

function readableList(items: string[]) {
  const unique = Array.from(new Set(items));
  if (!unique.length) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

function isLowConfidence(confidence: string | null) {
  return confidence === "low" || confidence === "unavailable";
}

export function mealFeedbackSummary(input: FeedbackInput) {
  const hasProtein = includesAny(input.components, proteinTerms);
  const hasCarb = includesAny(input.components, carbTerms);
  const hasProduce = includesAny(input.components, produceTerms);
  const hasLowQuality = includesAny(input.components, lowQualityTerms);
  const hasFluid = includesAny(input.components, fluidTerms);
  const hasRicherFat = includesAny(input.components, richerFatTerms);
  const lowQualityFoods = matchedTerms(input.components, lowQualityTerms);
  const recoveryGoal = /recover|recovery|return|rehab|repair/i.test(input.athleteGoal);
  const performanceDay = ["TRAINING", "MATCH", "RETURN_TO_PLAY"].includes(input.dayType);

  let mealRole = "Balanced meal";
  if (hasLowQuality) mealRole = "Low-quality snack pattern";
  else if (input.mealWindow === "PRE_TRAINING" && hasCarb && hasProtein && hasRicherFat) mealRole = "Solid base, adjust timing";
  else if (input.mealWindow === "PRE_TRAINING" && hasCarb) mealRole = "Decent pre-training fit";
  else if (input.mealWindow === "PRE_TRAINING") mealRole = "Fuel-up snack";
  else if (input.mealWindow === "POST_TRAINING") mealRole = "Recovery meal";
  else if (input.mealWindow === "TRAVEL") mealRole = "Travel support meal";
  else if (input.mealType === "SNACK") mealRole = "Snack bridge";

  let reasonForScore = "Solid score because the meal has a useful structure for this context.";
  if (input.score >= 8) {
    reasonForScore = "High score because it includes useful fuel structure and fits today’s timing demand.";
    if (hasProtein && hasCarb && hasProduce) reasonForScore = "High score because it includes protein, useful carbs, color, and fits today’s training demand.";
  } else if (input.score >= 6) {
    if (input.mealWindow === "PRE_TRAINING" && hasCarb && hasProtein && hasRicherFat) {
      reasonForScore = "Medium score because the meal has useful carbs and protein, but richer fats may sit heavier if training is soon.";
    } else {
      reasonForScore = "Medium score because part of the structure works, but one key piece is missing for this timing window.";
    }
  } else if (hasLowQuality && input.mealWindow === "PRE_TRAINING") {
    const foods = readableList(lowQualityFoods);
    reasonForScore = foods
      ? `Low score because ${foods} are a poor fit close to training and do not provide steady fuel.`
      : "Low score because the identified packaged snack foods are a poor fit close to training.";
  } else if (hasLowQuality) {
    reasonForScore = "Low score because this is mostly ultra-processed snack food and does not give much protein-plus-carb structure.";
  } else {
    reasonForScore = "Lower score because the meal is missing enough structure for the current timing window.";
  }
  if (isLowConfidence(input.interpretationConfidence)) {
    reasonForScore = "Score is tentative because the photo details were not clear enough. Add details to make the feedback more accurate.";
  }

  let whatToDoNext = "Use the next meal to add one missing piece: protein, useful carbs, color, or fluids.";
  let betterVersion: string | null = null;
  if (isLowConfidence(input.interpretationConfidence)) {
    whatToDoNext = "Add the main foods and drink in Meal details so the score can reflect what was actually eaten.";
  } else if (input.mealWindow === "PRE_TRAINING") {
    if (hasLowQuality) {
      const foods = readableList(lowQualityFoods);
      whatToDoNext = foods
        ? `Swap ${foods} for easier carbs like a banana, toast, pretzels, or a granola bar before training.`
        : "Choose easier carbs like a banana, toast, pretzels, or a granola bar before training.";
      betterVersion = "Better version: banana + granola bar + water, or toast with fruit.";
    } else if (hasCarb && hasProtein && hasRicherFat) {
      whatToDoNext = hasFluid
        ? "Keep the toast/fruit and protein; keep richer fats moderate if training is soon."
        : "Keep the toast/fruit and protein, add water, and keep richer fats moderate if training is soon.";
      betterVersion = "Better version close to training: toast plus fruit with water, keeping avocado or cheese portions moderate.";
    } else if (!hasCarb) {
      whatToDoNext = "Add an easy carb before training so energy is available without feeling heavy.";
      betterVersion = "Better version: keep the meal, but add toast, fruit, rice cakes, or a granola bar.";
    } else if (!hasFluid) {
      whatToDoNext = "Keep the carb source and add water so fuel and fluids are covered.";
    }
  } else if (input.mealWindow === "POST_TRAINING") {
    if (!hasProtein || !hasCarb) {
      whatToDoNext = "Add protein plus an easy carb so recovery covers both repair and refuel.";
      betterVersion = "Better version: yogurt + granola + fruit, chocolate milk + banana, or chicken/rice.";
    } else if (!hasFluid) {
      whatToDoNext = "Keep the protein-plus-carb base and add fluids after training.";
    }
  } else if (input.mealWindow === "TRAVEL") {
    whatToDoNext = "Pack a portable carb-plus-protein option and a drink for the next travel window.";
    betterVersion = "Better version: wrap + fruit + water, yogurt + granola, or sandwich + milk.";
  } else if (input.mealType === "BREAKFAST") {
    if (!hasProtein || !hasCarb || (performanceDay && !hasCarb)) {
      whatToDoNext = "Build breakfast around a protein anchor plus useful carbs for steadier energy.";
      betterVersion = "Better version: eggs with toast and fruit, or yogurt with granola and berries.";
    }
  } else if (input.mealType === "LUNCH" || input.mealType === "DINNER") {
    if (!hasProtein || !hasCarb || !hasProduce) {
      whatToDoNext = "Make the plate more complete with protein, a practical carb, and fruit or vegetables.";
      betterVersion = "Better version: chicken/rice/vegetables, pasta with protein, or beans/rice/salad.";
    }
  } else if (input.mealType === "SNACK") {
    whatToDoNext = recoveryGoal ? "Use snacks to bridge recovery: protein plus a carb works best." : "Make the snack purposeful for the next session window.";
    betterVersion = recoveryGoal ? "Better version: yogurt + fruit, milk + granola bar, or cheese + crackers." : "Better version: fruit + yogurt, pretzels + milk, or toast + peanut butter.";
  }

  const keepImproveAdd = {
    keep: hasCarb && hasProtein ? "Useful carb and protein base." : hasProtein ? "Useful protein source." : hasCarb ? "Useful carb source." : hasFluid ? "Fluids are included." : null,
    improve: hasLowQuality ? "Use steadier fuel for this timing window." : hasRicherFat && input.mealWindow === "PRE_TRAINING" ? "Keep richer fats moderate close to training." : !hasCarb && (input.mealWindow === "PRE_TRAINING" || performanceDay) ? "Add easier carbs for sport energy." : !hasProtein && (input.mealWindow === "POST_TRAINING" || recoveryGoal) ? "Add protein for repair." : null,
    add: !hasFluid ? "Water or milk." : !hasProduce && input.mealType !== "SNACK" ? "Fruit or vegetables." : null
  };

  return {
    mealRole,
    reasonForScore,
    whatToDoNext,
    betterVersion,
    keepImproveAdd
  };
}
