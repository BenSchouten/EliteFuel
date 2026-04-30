type MergeInput = {
  photoDescription?: string | null;
  photoComponents?: string[] | null;
  userDetails?: string | null;
  fallbackComponents?: string[] | null;
};

const foodAliases: Array<[string, string[]]> = [
  ["ground beef", ["ground beef", "minced beef"]],
  ["beef", ["beef", "steak"]],
  ["eggs", ["eggs", "egg"]],
  ["rice", ["rice"]],
  ["avocado", ["avocado"]],
  ["vegetables", ["vegetables", "vegetable", "veggies", "greens"]],
  ["tacos", ["tacos", "taco"]],
  ["salsa", ["salsa"]],
  ["beans", ["beans", "bean"]],
  ["chicken", ["chicken"]],
  ["toast", ["toast"]],
  ["kiwi", ["kiwi"]],
  ["banana", ["banana"]],
  ["fruit", ["fruit", "berries", "apple", "orange"]],
  ["yogurt", ["yogurt"]],
  ["granola", ["granola"]],
  ["chips", ["chips"]],
  ["candy", ["candy"]],
  ["soda", ["soda", "sugary drink", "sugary drinks"]],
  ["water", ["water"]],
  ["milk", ["milk"]],
  ["wrap", ["wrap"]],
  ["pasta", ["pasta"]],
  ["oats", ["oats", "oatmeal"]]
];

function normalizeFood(value: string) {
  const lower = value.toLowerCase().trim();
  const match = foodAliases.find(([, aliases]) => aliases.some((alias) => lower === alias || lower.includes(alias)));
  return match?.[0] ?? lower;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique(items: string[]) {
  const values = Array.from(new Set(items.map(normalizeFood).filter(Boolean)));
  if (values.includes("ground beef")) return values.filter((item) => item !== "beef");
  return values;
}

export function extractMentionedFoods(text: string) {
  const lower = text.toLowerCase();
  return unique(
    foodAliases
      .filter(([, aliases]) => aliases.some((alias) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)))
      .map(([food]) => food)
  );
}

export function extractNegatedFoods(text: string) {
  const lower = text.toLowerCase();
  const negated: string[] = [];
  for (const [food, aliases] of foodAliases) {
    const found = aliases.some((alias) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b(no|without|hold|remove|removed|not)\\s+(the\\s+)?${escaped}\\b`).test(lower);
    });
    if (found) negated.push(food);
  }
  return unique(negated);
}

export function mealTitleFromComponents(components: string[]) {
  const visible = unique(components).slice(0, 5);
  if (!visible.length) return "Meal details needed";
  if (visible.length === 1) return titleCase(visible[0]);
  if (visible.length === 2) return `${titleCase(visible[0])} and ${visible[1]}`;
  return `${titleCase(visible[0])}, ${visible.slice(1, -1).join(", ")}, and ${visible[visible.length - 1]}`;
}

export function mergeMealInterpretation(input: MergeInput) {
  const userDetails = input.userDetails?.trim() ?? "";
  const baseComponents = unique(input.photoComponents?.length ? input.photoComponents : input.fallbackComponents ?? []);
  const additions = extractMentionedFoods(userDetails);
  const removals = extractNegatedFoods(userDetails);
  const merged = unique([...baseComponents.filter((item) => !removals.includes(normalizeFood(item))), ...additions.filter((item) => !removals.includes(item))]);
  const components = merged.length ? merged : additions.length ? additions : baseComponents;
  const displayTitle = mealTitleFromComponents(components);
  const refined = Boolean(input.photoDescription && userDetails);

  return {
    components,
    displayTitle,
    description: components.length
      ? `${refined ? "Photo interpretation refined with your details: " : "Identified meal components: "}${components.join(", ")}.`
      : "Meal details needed for accurate feedback.",
    scoringText: [input.photoDescription, `Components: ${components.join(", ")}.`, userDetails ? `User details: ${userDetails}.` : ""].filter(Boolean).join(" "),
    userDetails
  };
}
