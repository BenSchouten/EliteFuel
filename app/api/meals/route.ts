import { MealType, MealWindow } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { mergeMealInterpretation } from "@/lib/meal-merge";
import { interpretMeal } from "@/lib/meal-scoring";
import { interpretMealPhoto } from "@/lib/photo-interpretation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { effectiveDayType } from "@/lib/schedule";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session.user.role === "CLUB_ADMIN") return NextResponse.json({ error: "Club admins manage organization setup, not meal logging." }, { status: 403 });
  const form = await request.formData();
  const athleteId = String(form.get("athleteId") ?? "");
  const note = String(form.get("note") ?? "").trim();
  const mealType = String(form.get("mealType") ?? "SNACK") as MealType;
  const mealWindow = String(form.get("mealWindow") ?? "MORNING") as MealWindow;
  const photo = form.get("photo");
  const photoProvided = photo instanceof File && photo.size > 0;
  const photoInterpretation = photoProvided ? await interpretMealPhoto(photo) : null;
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, clubId: session.user.clubId },
    include: { team: { include: { defaults: true } }, overrides: true, parentLinks: true }
  });
  if (!athlete || (!note && !photoProvided)) return redirectAfterPost(request, "/meals");
  const allowed =
    session.user.role !== "PARENT" ||
    athlete.parentLinks.some((link) => link.parentId === session.user.id);
  if (!allowed) return NextResponse.json({ error: "Not linked to athlete" }, { status: 403 });
  const dayType = effectiveDayType(athlete.team.defaults, athlete.overrides).dayType;
  const visionText = photoInterpretation
    ? `${photoInterpretation.description} Components: ${photoInterpretation.components.join(", ")}. Categories: ${photoInterpretation.categories.join(", ")}.`
    : "";
  const initialResult = interpretMeal({ note: [note, visionText].filter(Boolean).join(" "), athleteGoal: athlete.primaryGoal, dayType, mealType, mealWindow, photoProvided });
  const merged = mergeMealInterpretation({
    photoDescription: photoInterpretation?.description,
    photoComponents: photoInterpretation?.components,
    userDetails: note,
    fallbackComponents: initialResult.components
  });
  const result = interpretMeal({ note: merged.scoringText, athleteGoal: athlete.primaryGoal, dayType, mealType, mealWindow, photoProvided });
  const extractedDescription = merged.description;
  const components = merged.components;
  const suggestedImprovements =
    photoInterpretation?.confidence === "unavailable" || photoInterpretation?.confidence === "low"
      ? ["Add or correct the meal note so the score can reflect the actual protein, carbohydrate, and produce in the meal."]
      : result.suggestedImprovements;
  await prisma.mealLog.create({
    data: {
      athleteId,
      loggedById: session.user.id,
      mealType,
      mealWindow,
      note: note || extractedDescription,
      displayTitle: merged.displayTitle,
      userDetails: note || null,
      photoDescription: photoInterpretation?.description ?? null,
      photoComponents: photoInterpretation?.components ?? [],
      ...result,
      extractedDescription,
      interpretationSource: photoInterpretation?.source ?? (note ? "meal_details" : "rules"),
      interpretationConfidence: photoInterpretation?.confidence ?? null,
      components,
      suggestedImprovements
    }
  });
  revalidatePath("/meals");
  revalidatePath("/athlete");
  revalidatePath("/library");
  revalidatePath("/parent");
  return redirectAfterPost(request, "/meals");
}
