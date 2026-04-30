import type { DayType } from "@prisma/client";

export type PlannedTeamScheduleEntry = {
  id: string;
  teamId: string;
  date: Date;
  dayType: DayType;
  title: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
};

export type TeamScheduleRhythm = {
  id: string;
  teamId: string;
  dayOfWeek: number;
  dayType: DayType;
  title: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
};

export function monthStartFromParam(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(year, monthIndex, 1);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function monthDates(monthStart: Date) {
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1));
}
