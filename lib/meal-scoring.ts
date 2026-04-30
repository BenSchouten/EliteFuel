import { DayType, MealType, MealWindow } from "@prisma/client";

type ScoreInput = {
  note: string;
  athleteGoal: string;
  dayType: DayType;
  mealType: MealType;
  mealWindow: MealWindow;
  photoProvided?: boolean;
};

const protein = ["protein", "egg", "eggs", "chicken", "turkey", "fish", "beef", "tofu", "yogurt", "cheese", "beans", "milk"];
const carbs = ["carbohydrate", "carb", "toast", "rice", "pasta", "oats", "potato", "potatoes", "bagel", "bread", "fruit", "banana", "kiwi", "granola", "wrap"];
const produce = ["fruit", "banana", "kiwi", "berries", "vegetables", "vegetable", "salad", "avocado", "apple", "orange"];
const lowQuality = ["packaged snack", "sugary drink", "chips", "cookies", "cookie", "candy", "soda", "energy drink", "donut", "fried", "fries"];
const fluids = ["water", "milk", "smoothie"];
const heavierFats = ["avocado", "cheese", "cheddar", "fried", "fries"];

function hasAny(text: string, items: string[]) {
  return items.some((item) => text.includes(item));
}

function conciseFeedback(items: string[]) {
  return Array.from(new Set(items)).slice(0, 3);
}

function matchedItems(text: string, items: string[]) {
  return items.filter((item) => text.includes(item));
}

function readableList(items: string[]) {
  const unique = Array.from(new Set(items));
  if (!unique.length) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

export function interpretMeal(input: ScoreInput) {
  const text = input.note.toLowerCase();
  if (!text.trim() && input.photoProvided) {
    return {
      extractedDescription: "Image details were too limited to identify the meal confidently. Add or edit the meal note so the feedback can reflect what was actually eaten.",
      components: ["needs meal details"],
      qualityConcern: null,
      suggestedImprovements: [
        "Use the edit note if the photo interpretation misses the main foods.",
        "For training days, a useful check is whether the meal includes carbohydrate, protein, and fluids."
      ],
      score: 5,
      subScores: { mealQuality: 1, proteinAdequacy: 1, carbohydrateAdequacy: 1, completeness: 1, contextualFit: 1 }
    };
  }

  const components = [
    ...protein.filter((item) => text.includes(item)),
    ...carbs.filter((item) => text.includes(item)),
    ...produce.filter((item) => text.includes(item)),
    ...fluids.filter((item) => text.includes(item)),
    ...lowQuality.filter((item) => text.includes(item))
  ];
  const uniqueComponents = Array.from(new Set(components));
  const hasProtein = hasAny(text, protein);
  const hasCarb = hasAny(text, carbs);
  const hasProduce = hasAny(text, produce);
  const hasLowQuality = hasAny(text, lowQuality);
  const hasFluid = hasAny(text, fluids);
  const hasHeavierFat = hasAny(text, heavierFats);
  const identifiedLowQuality = matchedItems(text, lowQuality);
  const recoveryGoal = /recover|recovery|return|rehab|repair/i.test(input.athleteGoal);
  const energyGoal = /energy|fuel|speed|match|training/i.test(input.athleteGoal);
  const carbDays: DayType[] = [DayType.TRAINING, DayType.MATCH, DayType.TRAVEL, DayType.RETURN_TO_PLAY];
  const needsCarb = carbDays.includes(input.dayType);
  const recoveryWindow = input.mealWindow === MealWindow.POST_TRAINING || input.mealType === MealType.POST_TRAINING;
  const preTraining = input.mealWindow === MealWindow.PRE_TRAINING || input.mealType === MealType.PRE_TRAINING;

  const quality = hasLowQuality ? 0 : hasProduce ? 3 : 2;
  const proteinAdequacy = hasProtein ? 2 : recoveryWindow ? 0 : 1;
  const carbAdequacy = hasCarb ? 2 : needsCarb || preTraining ? 0 : 1;
  const balance = [hasProtein, hasCarb, hasProduce].filter(Boolean).length >= 3 ? 2 : [hasProtein, hasCarb, hasProduce].filter(Boolean).length === 2 ? 1 : 0;
  const contextualFit = hasLowQuality ? 0 : (preTraining && hasCarb) || (recoveryWindow && hasProtein && hasCarb) || (!preTraining && !recoveryWindow) ? 1 : 0;
  const raw = quality + proteinAdequacy + carbAdequacy + balance + contextualFit;
  let score = Math.max(1, Math.min(10, raw));
  if (preTraining && hasCarb && hasProtein && hasHeavierFat && !hasLowQuality) {
    score = Math.min(score, hasFluid ? 8 : 7);
  }

  const suggestedImprovements: string[] = [];
  let qualityConcern: string | null = null;
  if (preTraining) {
    if (hasLowQuality) {
      const lowQualityFoods = readableList(identifiedLowQuality);
      qualityConcern = lowQualityFoods
        ? `Poor fit for pre-training: ${lowQualityFoods} are not reliable fuel close to a session.`
        : "Poor fit for pre-training: the identified packaged snack foods are not reliable fuel close to a session.";
      suggestedImprovements.push("Swap toward easier carbs like a banana, toast, rice cakes, pretzels, or a granola bar.");
      suggestedImprovements.push("Use water or milk as the main drink and keep the next pre-training choice steadier.");
      if (!hasProtein) suggestedImprovements.push("If there is more than an hour before training, add moderate protein like yogurt, milk, eggs, or cheese.");
    } else if (hasCarb && hasProtein && hasHeavierFat) {
      suggestedImprovements.push("This has useful fuel structure; keep avocado, cheese, or other richer fats moderate if training is soon.");
      if (!hasFluid) suggestedImprovements.push("Add water so the meal supports both fuel and fluids.");
    } else if (!hasCarb) {
      suggestedImprovements.push("Before training, easier carbs help top off energy without feeling too heavy.");
    } else if (!hasProtein && !energyGoal) {
      suggestedImprovements.push("Add moderate protein if there is enough time before the session.");
    }
  } else if (recoveryWindow) {
    if (hasLowQuality) {
      qualityConcern = "Weak recovery fit: ultra-processed snacks alone do not give enough protein-plus-carb structure for refuel and repair.";
      suggestedImprovements.push("Build the next recovery option around protein plus carbs, such as yogurt with granola, chocolate milk with fruit, or chicken and rice.");
    }
    if (!hasProtein && !hasCarb) {
      suggestedImprovements.push("For recovery, pair protein with an easy carb so the meal supports repair and refuel.");
    } else if (!hasProtein) {
      suggestedImprovements.push("After training, add protein to support muscle repair.");
    } else if (!hasCarb) {
      suggestedImprovements.push("After training, add an easy carb to help refill energy stores.");
    }
  } else if (input.mealWindow === MealWindow.TRAVEL) {
    if (hasLowQuality) {
      const lowQualityFoods = readableList(identifiedLowQuality);
      qualityConcern = lowQualityFoods
        ? `Travel snack quality concern: ${lowQualityFoods} are portable, but they will not hold energy steady for long.`
        : "Travel snack quality concern: the identified packaged snacks will not hold energy steady for long.";
      suggestedImprovements.push("Pack portable carbs plus protein, like a wrap, yogurt, trail mix without candy overload, or fruit with milk.");
    }
    if (!hasProtein || !hasCarb) {
      suggestedImprovements.push("For travel, pack a simple protein-plus-carb option that holds up between stops.");
    }
  } else if (input.mealType === MealType.BREAKFAST) {
    if (hasLowQuality) {
      const lowQualityFoods = readableList(identifiedLowQuality);
      qualityConcern = lowQualityFoods
        ? `Breakfast quality concern: ${lowQualityFoods} will not set up steady energy for the day.`
        : "Breakfast quality concern: the identified packaged snack foods will not set up steady energy for the day.";
      suggestedImprovements.push("Anchor breakfast with protein plus useful carbs, like eggs with toast, yogurt with granola, or oatmeal with milk.");
    } else if (!hasProtein || !hasCarb) {
      suggestedImprovements.push("For breakfast, aim for a protein anchor plus useful carbs for steadier energy.");
    }
  } else if (input.mealType === MealType.LUNCH || input.mealType === MealType.DINNER) {
    if (hasLowQuality) {
      qualityConcern = "Meal quality concern: this is not a strong lunch or dinner structure for training readiness.";
      suggestedImprovements.push("Use a balanced plate: protein, a practical carb, fruit or vegetables, and fluids.");
    } else if (!hasProtein || !hasCarb || !hasProduce) {
      suggestedImprovements.push("For lunch or dinner, a balanced plate supports recovery and readiness for the next session.");
    }
  } else if (input.mealType === MealType.SNACK) {
    if (hasLowQuality) {
      qualityConcern = "Snack quality concern: this snack is mostly quick-hit foods without much lasting training value.";
      suggestedImprovements.push("Make the snack purposeful: carb-forward before training, protein-plus-carb after training, or balanced if it is just between meals.");
    } else if (!hasProtein && !hasCarb) {
      suggestedImprovements.push("For a general snack, include at least one useful fuel source, such as fruit, yogurt, toast, milk, or granola.");
    }
  } else if (needsCarb && !hasCarb) {
    suggestedImprovements.push("For this sport day, add a practical carb source so the meal supports usable energy.");
  } else if (!hasProtein && recoveryGoal) {
    suggestedImprovements.push("For recovery readiness, include a clear protein source in this meal or the next snack.");
  } else if (!hasProtein) {
    suggestedImprovements.push("Add a clear protein source so the meal holds longer.");
  }

  if (recoveryWindow && !hasFluid && suggestedImprovements.length < 3) {
    suggestedImprovements.push("Add fluids after training so refuel and rehydration happen together.");
  }
  if (!hasProduce && !hasLowQuality && suggestedImprovements.length < 3 && input.mealType !== MealType.SNACK) {
    suggestedImprovements.push("Add fruit or vegetables when you can for a more complete plate.");
  }
  if (hasLowQuality && suggestedImprovements.length < 3 && !qualityConcern) {
    qualityConcern = "Meal quality concern: this choice is mostly ultra-processed fuel for the current context.";
    suggestedImprovements.push("Aim for protein plus carbohydrate next time so the snack does more performance work.");
  }

  return {
    extractedDescription: uniqueComponents.length ? `Detected: ${uniqueComponents.join(", ")}` : input.note,
    components: uniqueComponents.length ? uniqueComponents : ["meal details from note"],
    qualityConcern,
    suggestedImprovements: conciseFeedback(suggestedImprovements),
    score,
    subScores: { mealQuality: quality, proteinAdequacy, carbohydrateAdequacy: carbAdequacy, completeness: balance, contextualFit }
  };
}
