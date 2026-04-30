import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canManageAthleteSchedule } from "@/lib/schedule-permissions";
import { requireSession } from "@/lib/session";

export async function POST(request: Request, { params }: { params: { overrideId: string } }) {
  const session = await requireSession();
  if (session.user.role !== "STAFF") return NextResponse.json({ error: "Staff manage athlete-specific schedule overrides." }, { status: 403 });
  const override = await prisma.athleteScheduleOverride.findFirst({
    where: { id: params.overrideId, athlete: { clubId: session.user.clubId } },
    select: { athleteId: true }
  });
  if (!override || !(await canManageAthleteSchedule(session.user, override.athleteId))) {
    return NextResponse.json({ error: "You can only reset overrides for athletes on assigned teams." }, { status: 403 });
  }
  await prisma.athleteScheduleOverride.update({ where: { id: params.overrideId }, data: { active: false } });
  revalidatePath("/schedule");
  revalidatePath("/staff");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  revalidatePath("/library");
  const url = new URL(request.url);
  const team = url.searchParams.get("team");
  const month = url.searchParams.get("month");
  return redirectAfterPost(request, `/schedule${team ? `?team=${team}${month ? `&month=${month}` : ""}` : ""}`);
}
