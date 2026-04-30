import { DayType, OverrideReason } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canManageAthleteSchedule } from "@/lib/schedule-permissions";
import { requireSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session.user.role !== "STAFF") return NextResponse.json({ error: "Staff manage athlete-specific schedule overrides." }, { status: 403 });
  const form = await request.formData();
  const athleteId = String(form.get("athleteId") ?? "");
  const teamId = String(form.get("teamId") ?? "");
  const month = String(form.get("month") ?? "");
  const date = new Date(String(form.get("date") ?? ""));
  date.setHours(0, 0, 0, 0);
  const dayType = String(form.get("dayType") ?? "REST") as DayType;
  const reason = String(form.get("reason") ?? "OTHER") as OverrideReason;
  const note = String(form.get("note") ?? "");
  const canManage = await canManageAthleteSchedule(session.user, athleteId);
  if (canManage && !Number.isNaN(date.valueOf())) {
    await prisma.athleteScheduleOverride.upsert({
      where: { athleteId_date: { athleteId, date } },
      update: { dayType, reason, note, active: true },
      create: { athleteId, date, dayType, reason, note, active: true }
    });
  }
  revalidatePath("/schedule");
  revalidatePath("/staff");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  revalidatePath("/library");
  return redirectAfterPost(request, `/schedule${teamId ? `?team=${teamId}${month ? `&month=${month}` : ""}` : ""}`);
}
