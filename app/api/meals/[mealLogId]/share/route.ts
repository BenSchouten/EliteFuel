import { revalidatePath } from "next/cache";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { effectiveDayType } from "@/lib/schedule";

export async function POST(request: Request, { params }: { params: { mealLogId: string } }) {
  const session = await requireSession();
  const meal = await prisma.mealLog.findFirst({
    where: { id: params.mealLogId, athlete: { clubId: session.user.clubId }, score: { gte: 8 } },
    include: { athlete: { include: { team: { include: { defaults: true } }, overrides: true } } }
  });
  if (!meal) return redirectAfterPost(request, "/meals");
  const dayType = effectiveDayType(meal.athlete.team.defaults, meal.athlete.overrides).dayType;
  await prisma.clubMeal.upsert({
    where: { sourceMealId: meal.id },
    update: {},
    create: {
      clubId: session.user.clubId,
      sourceMealId: meal.id,
      sharedById: session.user.id,
      title: (meal.displayTitle ?? meal.extractedDescription).slice(0, 64),
      description: meal.extractedDescription,
      mealType: meal.mealType,
      mealWindow: meal.mealWindow,
      dayTypeFit: [dayType],
      goalFit: [meal.athlete.primaryGoal],
      tags: meal.components,
      score: meal.score
    }
  });
  revalidatePath("/library");
  revalidatePath("/meals");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  return redirectAfterPost(request, "/meals");
}
