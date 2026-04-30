type PhotoInterpretation = {
  source: "openai_vision" | "fallback";
  confidence: "high" | "medium" | "low" | "unavailable";
  description: string;
  components: string[];
  categories: string[];
};

const fallbackInterpretation: PhotoInterpretation = {
  source: "fallback",
  confidence: "unavailable",
  description:
    "The meal photo could not be analyzed automatically. Add meal details so the feedback can reflect the actual foods, protein, carbohydrates, and produce.",
  components: ["needs meal details"],
  categories: ["needs review"]
};

function safeJsonParse(value: string) {
  const trimmed = value.trim();
  const json = trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed;
  return JSON.parse(json) as Partial<PhotoInterpretation>;
}

function extractResponseText(data: unknown) {
  if (typeof data !== "object" || data === null) return "";
  const maybeOutputText = (data as { output_text?: unknown }).output_text;
  if (typeof maybeOutputText === "string") return maybeOutputText;

  const output = (data as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";
  const textParts: string[] = [];
  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") textParts.push(text);
    }
  }
  return textParts.join("\n");
}

function normalizeInterpretation(value: Partial<PhotoInterpretation>): PhotoInterpretation {
  const components = Array.isArray(value.components)
    ? value.components.map(String).map((item) => item.trim().toLowerCase()).filter(Boolean).slice(0, 12)
    : [];
  const categories = Array.isArray(value.categories)
    ? value.categories.map(String).map((item) => item.trim().toLowerCase()).filter(Boolean).slice(0, 8)
    : [];
  const confidence = value.confidence === "high" || value.confidence === "medium" || value.confidence === "low" ? value.confidence : "low";
  const description = typeof value.description === "string" && value.description.trim()
    ? value.description.trim()
    : components.length
      ? `Visible meal components: ${components.join(", ")}.`
      : fallbackInterpretation.description;

  return {
    source: "openai_vision",
    confidence,
    description,
    components: components.length ? components : ["needs meal details"],
    categories: categories.length ? categories : ["needs review"]
  };
}

export async function interpretMealPhoto(photo: File | null): Promise<PhotoInterpretation | null> {
  if (!photo || photo.size === 0) return null;
  if (!photo.type.startsWith("image/")) {
    console.warn("[EliteFuel vision] Uploaded meal file was not an image; using fallback interpretation.");
    return fallbackInterpretation;
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[EliteFuel vision] OPENAI_API_KEY is missing; using fallback interpretation.");
    return fallbackInterpretation;
  }

  const model = process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini";
  try {
    const bytes = Buffer.from(await photo.arrayBuffer());
    const imageUrl = `data:${photo.type};base64,${bytes.toString("base64")}`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Analyze this youth sports meal photo for broad visible food components only. Ground the answer strictly in what is visible; do not invent foods, brands, quantities, or criticisms. If uncertain, use low confidence and describe only broad categories. Return JSON only with keys: description (short sentence beginning with 'Based on what was identified' when confidence is medium or low), components (array of lowercase visible foods only), categories (array like protein, carbohydrate, fruit, vegetables, packaged snack, sugary drink only when visibly present), confidence (high, medium, or low)."
              },
              {
                type: "input_image",
                image_url: imageUrl,
                detail: "low"
              }
            ]
          }
        ],
        max_output_tokens: 350
      })
    });

    if (!response.ok) {
      console.warn(`[EliteFuel vision] OpenAI vision request failed with status ${response.status}.`);
      return fallbackInterpretation;
    }

    const data = await response.json();
    const outputText = extractResponseText(data);
    if (!outputText) {
      console.warn("[EliteFuel vision] OpenAI vision response did not include text output.");
      return fallbackInterpretation;
    }

    const parsed = safeJsonParse(outputText);
    const interpretation = normalizeInterpretation(parsed);
    console.info(`[EliteFuel vision] Meal photo analyzed with ${model}; confidence=${interpretation.confidence}.`);
    return interpretation;
  } catch (error) {
    console.warn("[EliteFuel vision] Meal photo analysis failed; using fallback interpretation.", error instanceof Error ? error.message : error);
    return fallbackInterpretation;
  }
}
