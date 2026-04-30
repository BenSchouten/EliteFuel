"use client";

import { useState } from "react";
import { urineColorOptions } from "@/lib/hydration-trend";

export function UrineColorPicker() {
  const [selected, setSelected] = useState("Pale yellow");

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-stone-800">Urine color</legend>
      <input type="hidden" name="urineColor" value={selected} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
        {urineColorOptions.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              aria-pressed={isSelected}
              className={`focus-ring rounded-md border p-2 text-left transition ${isSelected ? "border-fuel-green bg-fuel-mint ring-2 ring-fuel-green ring-offset-1" : "border-stone-200 bg-white hover:border-fuel-green"}`}
            >
              <span className={`block h-6 rounded border ${option.className}`} aria-hidden />
              <span className="mt-2 block text-xs font-semibold text-stone-700">{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
