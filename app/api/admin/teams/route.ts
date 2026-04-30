import { DayType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session.user.role !== "CLUB_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await request.formData();
  const name = String(form.get("name") ?? "");
  const sport = String(form.get("sport") ?? "");
  if (!name.trim() || !sport.trim()) return redirectAfterPost(request, "/admin");
  const team = await prisma.team.create({ data: { clubId: session.user.clubId, name, sport } });
  const defaults = [
    [1, DayType.TRAINING, "Training"],
    [2, DayType.REST, "Rest"],
    [3, DayType.TRAINING, "Training"],
    [4, DayType.REST, "Rest"],
    [5, DayType.TRAVEL, "Travel prep"],
    [6, DayType.MATCH, "Match"],
    [0, DayType.REST, "Recovery"]
  ] as const;
  await prisma.teamScheduleDefault.createMany({ data: defaults.map(([dayOfWeek, dayType, title]) => ({ teamId: team.id, dayOfWeek, dayType, title })) });
  revalidatePath("/admin");
  revalidatePath("/schedule");
  revalidatePath("/staff");
  return redirectAfterPost(request, `/roster?team=${team.id}`);
}
