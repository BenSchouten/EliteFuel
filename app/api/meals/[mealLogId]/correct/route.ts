import { revalidatePath } from "next/cache";
import { redirectAfterPost } from "@/lib/http";
import { mergeMealInterpretation } from "@/lib/meal-merge";
import { interpretMeal } from "@/lib/meal-scoring";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { effectiveDayType } from "@/lib/schedule";

export async function POST(request: Request, { params }: { params: { mealLogId: string } }) {
  const session = await requireSession();
  const form = await request.formData();
  const note = String(form.get("note") ?? "");
  const existing = await prisma.mealLog.findFirst({
    where: { id: params.mealLogId, athlete: { clubId: session.user.clubId } },
    include: { athlete: { include: { team: { include: { defaults: true } }, overrides: true } } }
  });
  if (!existing || !note.trim()) return redirectAfterPost(request, "/meals");
  const dayType = effectiveDayType(existing.athlete.team.defaults, existing.athlete.overrides).dayType;
  const merged = mergeMealInterpretation({
    photoDescription: existing.photoDescription,
    photoComponents: existing.photoComponents,
    userDetails: note,
    fallbackComponents: existing.components
  });
  const result = interpretMeal({ note: merged.scoringText, athleteGoal: existing.athlete.primaryGoal, dayType, mealType: existing.mealType, mealWindow: existing.mealWindow });
  await prisma.mealLog.update({
    where: { id: existing.id },
    data: {
      note,
      userDetails: note,
      displayTitle: merged.displayTitle,
      ...result,
      extractedDescription: merged.description,
      components: merged.components
    }
  });
  revalidatePath("/meals");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  revalidatePath("/library");
  return redirectAfterPost(request, "/meals");
}
