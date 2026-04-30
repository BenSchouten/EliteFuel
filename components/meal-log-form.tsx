"use client";

import { Camera } from "lucide-react";
import { useState } from "react";
import type { DayType, MealType, MealWindow } from "@prisma/client";
import { AsyncForm } from "@/components/async-form";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { mealLoggingCue } from "@/lib/nutrition-guidance";

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
const mealWindows: MealWindow[] = ["MORNING", "PRE_TRAINING", "POST_TRAINING", "EVENING", "TRAVEL"];

export function MealLogForm({ athleteId, dayType }: { athleteId: string; dayType: DayType }) {
  const [mealType, setMealType] = useState<MealType>("SNACK");
  const [mealWindow, setMealWindow] = useState<MealWindow>("PRE_TRAINING");

  return (
    <AsyncForm action="/api/meals" encType="multipart/form-data" resetOnSuccess className="mt-4 grid gap-4" successMessage="Meal feedback saved">
      <input type="hidden" name="athleteId" value={athleteId} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Meal type
          <Select name="mealType" value={mealType} onChange={(event) => setMealType(event.target.value as MealType)} className="mt-1">
            {mealTypes.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </label>
        <label className="text-sm font-medium">
          Timing window
          <Select name="mealWindow" value={mealWindow} onChange={(event) => setMealWindow(event.target.value as MealWindow)} className="mt-1">
            {mealWindows.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </label>
      </div>
      <Textarea name="note" rows={4} placeholder="Optional note, example: eggs, toast, kiwi, avocado and water" />
      <label className="rounded-lg border border-dashed border-stone-300/90 bg-stone-50/70 p-3 text-sm leading-6 text-stone-600">
        <span className="flex items-center gap-2 font-medium text-stone-800"><Camera size={16} aria-hidden /> Optional transient meal photo</span>
        <Input className="mt-2" name="photo" type="file" accept="image/*" />
        <span className="mt-2 block">A note is optional when you add a photo. The app saves the interpretation, not the image.</span>
      </label>
      <p className="rounded-lg bg-gradient-to-r from-fuel-mint to-white p-3 text-sm font-medium leading-6 text-fuel-green" aria-live="polite">
        {mealLoggingCue(dayType, mealWindow, mealType)}
      </p>
      <Button type="submit">Save meal log</Button>
    </AsyncForm>
  );
}
