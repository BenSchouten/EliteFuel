type UrineEntry = {
  urineColor: string | null;
  createdAt: Date;
  note?: string | null;
};

const colorScale: Record<string, { rank: number; className: string; label: string; color: string }> = {
  Clear: { rank: 1, className: "bg-sky-50 border-sky-100", label: "Clear", color: "#f0f9ff" },
  Light: { rank: 1, className: "bg-yellow-100 border-yellow-200", label: "Light", color: "#fef9c3" },
  "Pale yellow": { rank: 2, className: "bg-yellow-200 border-yellow-300", label: "Pale yellow", color: "#fef08a" },
  Yellow: { rank: 3, className: "bg-yellow-400 border-yellow-500", label: "Yellow", color: "#facc15" },
  "Dark yellow": { rank: 4, className: "bg-amber-600 border-amber-700", label: "Dark yellow", color: "#d97706" },
  Amber: { rank: 5, className: "bg-orange-800 border-orange-900", label: "Amber", color: "#9a3412" }
};

export function urineColorMeta(color: string | null) {
  return colorScale[color ?? ""] ?? { rank: 3, className: "bg-stone-200 border-stone-300", label: color || "Not logged", color: "#e7e5e4" };
}

export function hydrationTrend(entries: UrineEntry[]) {
  const logged = entries.filter((entry) => entry.urineColor);
  if (logged.length < 2) {
    return {
      label: "Limited data",
      interpretation: "Log a few fluid check-ins to see your urine color trend.",
      suggestion: "Log a few check-ins to see a clearer trend."
    };
  }

  const first = urineColorMeta(logged[0].urineColor).rank;
  const last = urineColorMeta(logged[logged.length - 1].urineColor).rank;
  const change = last - first;
  const ranks = logged.map((entry) => urineColorMeta(entry.urineColor).rank);
  const spread = Math.max(...ranks) - Math.min(...ranks);
  const average = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
  const mostlyLight = average <= 2.4;
  const mostlyDark = average >= 3.8;

  if (change <= -1) {
    return {
      label: "Trend is getting lighter",
      interpretation: "Lighter colors usually suggest better hydration.",
      suggestion: "Hydration looks better recently. Keep your routine consistent.",
      tone: "green" as const
    };
  }
  if (change >= 1) {
    return {
      label: "Trend is getting darker",
      interpretation: "Darker colors can suggest you may need more fluids.",
      suggestion: "Increase fluids today, especially around training.",
      tone: "amber" as const
    };
  }
  if (mostlyDark) {
    return {
      label: "Recent entries are consistently darker than ideal",
      interpretation: "Darker colors can suggest you may need more fluids.",
      suggestion: "Hydration needs attention. Add fluids earlier in the day.",
      tone: "amber" as const
    };
  }
  if (mostlyLight) {
    return {
      label: "Recent entries are generally lighter",
      interpretation: "Lighter colors usually suggest better hydration.",
      suggestion: "Hydration looks steady. Keep your routine consistent.",
      tone: "green" as const
    };
  }
  if (spread <= 1) {
    return {
      label: "Recent entries are fairly steady",
      interpretation: "Your recent colors look stable, so keep checking around training.",
      suggestion: "Keep your fluid routine steady and check again after harder sessions.",
      tone: "blue" as const
    };
  }
  return {
    label: "Color has been mixed recently",
    interpretation: "Keep checking around training and travel to spot patterns.",
    suggestion: "Trend is mixed. Check fluids around training and travel.",
    tone: "blue" as const
  };
}

export function parentHydrationSummary(entries: UrineEntry[]) {
  const logged = entries.filter((entry) => entry.urineColor);
  if (!logged.length) {
    return {
      label: "No recent checks yet",
      cue: "Ask your athlete to log a check-in after practice.",
      detail: "Once a few entries are logged, you’ll see whether colors look lighter, darker, or mixed.",
      tone: "blue" as const
    };
  }

  const latest = logged[logged.length - 1];
  const daysSinceLatest = Math.floor((Date.now() - latest.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLatest >= 7) {
    return {
      label: "No recent checks lately",
      cue: "Ask your athlete to log a fresh check-in around the next practice.",
      detail: `${logged.length} older ${logged.length === 1 ? "check" : "checks"} available, but the newest is over a week old.`,
      tone: "blue" as const
    };
  }

  if (logged.length < 2) {
    return {
      label: "Limited hydration trend",
      cue: "Ask your athlete to log a few check-ins after training.",
      detail: "One recent check is visible, but a trend needs a few entries.",
      tone: "blue" as const
    };
  }

  const trend = hydrationTrend(logged);
  if (trend.tone === "green") {
    return {
      label: trend.label.includes("lighter") ? "Trending lighter recently" : "Hydration looks steady",
      cue: "Keep the routine consistent.",
      detail: trend.interpretation,
      tone: trend.tone
    };
  }
  if (trend.tone === "amber") {
    return {
      label: trend.label.includes("darker") ? "Darker checks recently" : "Hydration may need attention",
      cue: trend.label.includes("darker") ? "Encourage fluids earlier in the day." : "Pack a water bottle before training.",
      detail: trend.interpretation,
      tone: trend.tone
    };
  }
  return {
    label: trend.label.includes("mixed") ? "Mixed recently" : "Hydration looks fairly steady",
    cue: "Check fluids around training and travel.",
    detail: trend.interpretation,
    tone: trend.tone
  };
}

export const urineColorOptions = Object.entries(colorScale).filter(([label]) => label !== "Light").map(([value, meta]) => ({
  value,
  label: meta.label,
  className: meta.className
}));
