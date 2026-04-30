import { prisma } from "@/lib/prisma";
import type { PlannedTeamScheduleEntry, TeamScheduleRhythm } from "@/lib/schedule-calendar";

export async function getPlannedTeamScheduleEntries(teamId: string, monthStart: Date) {
  const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  return prisma.$queryRaw<PlannedTeamScheduleEntry[]>`
    SELECT "id", "teamId", "date", "dayType", "title", "startTime", "endTime", "notes"
    FROM "TeamScheduleEntry"
    WHERE "teamId" = ${teamId}
      AND "date" >= ${monthStart}
      AND "date" < ${nextMonth}
    ORDER BY "date" ASC
  `;
}

export async function getTeamScheduleRhythm(teamId: string) {
  return prisma.$queryRaw<TeamScheduleRhythm[]>`
    SELECT "id", "teamId", "dayOfWeek", "dayType", "title", "startTime", "endTime", "notes"
    FROM "TeamScheduleDefault"
    WHERE "teamId" = ${teamId}
    ORDER BY "dayOfWeek" ASC
  `;
}
