import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

const boundaryResponse =
  "I can help with general fueling, hydration, meal timing, and recovery ideas. For allergies, eating concerns, weight loss, supplements, dehydration symptoms, injury, illness, or medical questions, check with a parent or guardian and a qualified professional such as a doctor, athletic trainer, or registered dietitian.";
const adminBoundaryResponse =
  "I can help with EliteFuel setup, staff workflows, parent access, schedules, overrides, meal library setup, and rollout planning. For athlete medical, allergy, supplement, injury, or eating concerns, involve the family and a qualified professional.";

const safetyPattern =
  /\b(weight\s*loss|lose\s*weight|cut\s*weight|calorie|calories|restrict|restriction|diet\s*pill|eating\s*disorder|anorexia|bulimia|binge|purge|supplement|creatine|pre[-\s]*workout|dehydration\s*symptoms?|heat\s*illness|dizzy|faint|vomit|diagnos|treatment|medical|injur|illness|allerg|anaphylaxis)\b/i;

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

function roleContext(role: string) {
  if (role === "PARENT") return "Answer for a parent supporting a youth athlete.";
  if (role === "STAFF") return "Answer for youth sports staff supporting a team. You may also help with staff workflow inside EliteFuel.";
  if (role === "CLUB_ADMIN") return "Answer for a club admin using EliteFuel. Focus on platform setup, rollout, team setup, roster import, staff assignment, parent access, schedule defaults, athlete overrides, meal library setup, and staff follow-up workflows. Do not provide athlete-specific medical or diagnosis advice.";
  return "Answer for a youth athlete.";
}

function systemPrompt(role: string) {
  if (role === "CLUB_ADMIN") {
    return "You are Ask EliteFuel, a lightweight platform helper for club admins. Give concise, practical guidance about using EliteFuel: setting up teams, adding athletes, parent access, assigning staff, schedule defaults, athlete overrides, meal library setup, staff follow-ups, demo flow, and club rollout. Do not invent features that are not typical for this app. Do not give athlete-specific medical advice, diagnosis, treatment, eating disorder advice, weight-loss advice, or supplement recommendations. For athlete medical, allergy, supplement, injury, or eating concerns, advise involving the family and a qualified professional. Format answers as short paragraphs or simple bullet/numbered lists. Avoid markdown headings and avoid using bold unless truly helpful.";
  }
  return "You are Ask EliteFuel, a lightweight youth sports fueling helper. Give general sports nutrition education only. Be youth-athlete safe. Avoid weight-loss advice, body-shaming, calorie restriction, diagnosis, medical treatment, eating disorder discussion, and supplement recommendations. For allergies, eating disorders, injury/illness, dehydration symptoms, supplements, or medical/safety concerns, advise checking with a parent/guardian and a qualified professional. Do not pretend to be a doctor or registered dietitian. Keep answers concise, practical, and action-oriented. Focus on food/hydration choices, timing, recovery, packing, prep, and staff workflow when relevant. Format answers as short paragraphs or simple bullet/numbered lists. Avoid markdown headings and avoid using bold unless truly helpful.";
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = await request.json().catch(() => ({}));
  const question = String((body as { question?: unknown }).question ?? "").trim().slice(0, 500);

  if (!question) {
    return NextResponse.json({
      answer:
        session.user.role === "CLUB_ADMIN"
          ? "Ask a short setup, rollout, staff workflow, schedule, roster, parent access, or meal library question."
          : "Ask a short fueling, hydration, meal timing, snack, or recovery question."
    }, { status: 400 });
  }

  if (safetyPattern.test(question)) {
    return NextResponse.json({ answer: session.user.role === "CLUB_ADMIN" ? adminBoundaryResponse : boundaryResponse });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn("[EliteFuel ask] OPENAI_API_KEY is missing; returning safe fallback answer.");
    return NextResponse.json({
      answer:
        session.user.role === "CLUB_ADMIN"
          ? "OPENAI_API_KEY is not set locally, so AI answers are unavailable. For setup, start with a team, import athletes and linked parents, assign staff, then review schedule defaults, athlete overrides, and the club meal library."
          : "OPENAI_API_KEY is not set locally, so AI answers are unavailable. In general, keep fueling simple: include useful carbs before training, pair protein with carbs after training, and keep fluids steady through the day."
    });
  }

  const model = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
  try {
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
            role: "system",
            content: [
              {
                type: "input_text",
                text: systemPrompt(session.user.role)
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${roleContext(session.user.role)} Question: ${question}`
              }
            ]
          }
        ],
        max_output_tokens: 220
      })
    });

    if (!response.ok) {
      console.warn(`[EliteFuel ask] OpenAI request failed with status ${response.status}.`);
      return NextResponse.json({ answer: "I could not answer that right now. Try a simple meal timing, snack, hydration, or recovery question." }, { status: 502 });
    }

    const data = await response.json();
    const answer = extractResponseText(data).trim();
    if (!answer) {
      console.warn("[EliteFuel ask] OpenAI response did not include text output.");
      return NextResponse.json({ answer: "I could not answer that right now. Try asking the question in a simpler way." }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.warn("[EliteFuel ask] OpenAI request failed.", error instanceof Error ? error.message : error);
    return NextResponse.json({ answer: "I could not answer that right now. Try again with a short fueling or recovery question." }, { status: 502 });
  }
}
