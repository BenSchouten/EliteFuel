import { addDays, startOfDay } from "@/lib/tiny-date";

export function today() {
  return startOfDay(new Date());
}

export function weekDates(anchor = today()) {
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(anchor, mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function upcomingDates(days = 30, anchor = today()) {
  return Array.from({ length: days }, (_, index) => addDays(anchor, index));
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
