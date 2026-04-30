import { DayType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canManageTeamSchedule } from "@/lib/schedule-permissions";
import { requireSession } from "@/lib/session";

const days = [0, 1, 2, 3, 4, 5, 6];
const dayTypes = new Set(Object.values(DayType));

export async function POST(request: Request) {
  const session = await requireSession();
  if (!["STAFF", "CLUB_ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await request.formData();
  const teamId = String(form.get("teamId") ?? "");
  const month = String(form.get("month") ?? "");
  const canManage = await canManageTeamSchedule(session.user, teamId);
  if (!canManage) return NextResponse.json({ error: "You can only edit schedules for teams you manage." }, { status: 403 });

  for (const day of days) {
    const dayTypeValue = String(form.get(`dayType-${day}`) ?? "REST") as DayType;
    const dayType = dayTypes.has(dayTypeValue) ? dayTypeValue : DayType.REST;
    const title = String(form.get(`title-${day}`) ?? "").trim() || dayType.toLowerCase().replaceAll("_", " ");
    const startTime = String(form.get(`startTime-${day}`) ?? "").trim() || null;
    const notes = String(form.get(`notes-${day}`) ?? "").trim() || null;
    await prisma.teamScheduleDefault.upsert({
      where: { teamId_dayOfWeek: { teamId, dayOfWeek: day } },
      update: { dayType, title, startTime, notes },
      create: { teamId, dayOfWeek: day, dayType, title, startTime, notes }
    });
  }

  revalidatePath("/schedule");
  revalidatePath("/admin");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  revalidatePath("/library");
  return redirectAfterPost(request, `/schedule?team=${teamId}${month ? `&month=${month}` : ""}`);
}
