import type { DayType, MealType, MealWindow } from "@prisma/client";

export function timingGuidance(dayType: DayType, mealWindow: MealWindow) {
  if (mealWindow === "PRE_TRAINING") {
    return "Before training, prioritize easy carbohydrates for usable energy, keep protein moderate, and avoid a very heavy fat-heavy plate right before warmup.";
  }
  if (mealWindow === "POST_TRAINING") {
    return "After training, pair protein with carbohydrate so muscles get repair support and glycogen starts refilling.";
  }
  if (mealWindow === "TRAVEL") {
    return "For travel, choose packable carbohydrate plus protein and fluids so timing stays steady even when the schedule slips.";
  }
  if (dayType === "MATCH") {
    return "On match day, familiar carbohydrate-forward meals help keep energy steady without testing new foods.";
  }
  if (dayType === "REHAB" || dayType === "RETURN_TO_PLAY") {
    return "During rehab or return to play, consistent protein plus enough carbohydrate supports tissue repair without under-fueling the session.";
  }
  return "Aim for a simple plate with protein, carbohydrate, color, and fluids that fits the next session window.";
}

export function mealLoggingCue(dayType: DayType, mealWindow: MealWindow, mealType: MealType) {
  if (mealWindow === "PRE_TRAINING") {
    return dayType === "MATCH"
      ? "Match or hard-session fuel works best when it is familiar, carb-forward, and not too fatty close to warmup."
      : "Pre-training: choose easier carbs like toast, rice, oats, fruit, or a wrap, with moderate protein and fluids.";
  }
  if (mealWindow === "POST_TRAINING") {
    return "Post-training: pair protein with carbs so repair and energy refill happen together.";
  }
  if (mealWindow === "TRAVEL") {
    return "Travel: pack a balanced option that can survive the bag: carbs, protein, and a drink.";
  }
  if (mealType === "BREAKFAST" && (dayType === "MATCH" || dayType === "TRAINING")) {
    return "Breakfast before a busy sport day should include useful carbs plus some protein without feeling heavy.";
  }
  return timingGuidance(dayType, mealWindow);
}

export function mealWindowLabel(window: MealWindow) {
  return window
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function suggestedWindowForDay(dayType: DayType): MealWindow {
  if (dayType === "TRAVEL") return "TRAVEL";
  if (dayType === "REHAB" || dayType === "MODIFIED_LOAD") return "POST_TRAINING";
  if (dayType === "MATCH" || dayType === "TRAINING" || dayType === "RETURN_TO_PLAY") return "PRE_TRAINING";
  return "MORNING";
}

export function softenCuratedCue(cue: string | null) {
  if (!cue) return null;
  return cue
    .replace(/^Best match day/i, "Strong match day")
    .replace(/^Best recovery/i, "Helpful recovery")
    .replace(/^Best post-training/i, "Strong post-training")
    .replace(/^Best travel-friendly/i, "Good travel-friendly")
    .replace(/^Best /i, "Strong ");
}
