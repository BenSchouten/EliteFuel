import { randomUUID } from "crypto";
import { DayType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canManageTeamSchedule } from "@/lib/schedule-permissions";
import { requireSession } from "@/lib/session";

const dayTypes = new Set(Object.values(DayType));

function dateFromInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function validTime(value: string | null) {
  return Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

function scheduleError(message: string, teamId: string, request: Request, entryDate?: Date | null) {
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return redirectAfterPost(request, `/schedule?team=${teamId}${entryDate ? `&month=${monthKey(entryDate)}` : ""}`);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!["CLUB_ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only admins and assigned staff can edit team-level planned schedule dates." }, { status: 403 });
  }

  const form = await request.formData();
  const teamId = String(form.get("teamId") ?? "");
  const canManage = await canManageTeamSchedule(session.user, teamId);
  if (!canManage) return NextResponse.json({ error: "You can only edit schedules for teams you manage." }, { status: 403 });

  const entryDate = dateFromInput(String(form.get("date") ?? ""));
  if (!entryDate) return redirectAfterPost(request, `/schedule?team=${teamId}`);

  const dayTypeValue = String(form.get("dayType") ?? "REST") as DayType;
  const dayType = dayTypes.has(dayTypeValue) ? dayTypeValue : DayType.REST;
  const fallbackTitle = dayType.toLowerCase().replaceAll("_", " ");
  const title = String(form.get("title") ?? "").trim() || fallbackTitle;
  const startTime = String(form.get("startTime") ?? "").trim() || null;
  const endTime = String(form.get("endTime") ?? "").trim() || null;
  const notes = String(form.get("notes") ?? "").trim() || null;
  const repeat = String(form.get("repeat") ?? "none");

  if (!validTime(startTime)) {
    return scheduleError("Start time is required.", teamId, request, entryDate);
  }
  if (endTime && !validTime(endTime)) {
    return scheduleError("End time is not in a valid schedule time format.", teamId, request, entryDate);
  }
  if (startTime && endTime && endTime <= startTime) {
    return scheduleError("End time should be later than start time.", teamId, request, entryDate);
  }

  if (repeat === "weekly") {
    await prisma.$executeRaw`
      INSERT INTO "TeamScheduleDefault" ("id", "teamId", "dayOfWeek", "dayType", "title", "startTime", "endTime", "notes")
      VALUES (${randomUUID()}, ${teamId}, ${entryDate.getDay()}, CAST(${dayType} AS "DayType"), ${title}, ${startTime}, ${endTime}, ${notes})
      ON CONFLICT ("teamId", "dayOfWeek") DO UPDATE SET
        "dayType" = EXCLUDED."dayType",
        "title" = EXCLUDED."title",
        "startTime" = EXCLUDED."startTime",
        "endTime" = EXCLUDED."endTime",
        "notes" = EXCLUDED."notes"
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "TeamScheduleEntry" ("id", "teamId", "date", "dayType", "title", "startTime", "endTime", "notes", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${teamId}, ${entryDate}, CAST(${dayType} AS "DayType"), ${title}, ${startTime}, ${endTime}, ${notes}, NOW(), NOW())
      ON CONFLICT ("teamId", "date") DO UPDATE SET
        "dayType" = EXCLUDED."dayType",
        "title" = EXCLUDED."title",
        "startTime" = EXCLUDED."startTime",
        "endTime" = EXCLUDED."endTime",
        "notes" = EXCLUDED."notes",
        "updatedAt" = NOW()
    `;
  }

  revalidatePath("/schedule");
  revalidatePath("/admin");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  revalidatePath("/library");
  return redirectAfterPost(request, `/schedule?team=${teamId}&month=${monthKey(entryDate)}`);
}
