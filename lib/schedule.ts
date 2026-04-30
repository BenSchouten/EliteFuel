import { DayType, type Athlete, type AthleteScheduleOverride, type TeamScheduleDefault } from "@prisma/client";
import { dateKey, today, weekDates } from "@/lib/dates";

export function defaultForDate(defaults: TeamScheduleDefault[], date: Date) {
  return defaults.find((item) => item.dayOfWeek === date.getDay()) ?? null;
}

export function effectiveDayType(
  defaults: TeamScheduleDefault[],
  overrides: AthleteScheduleOverride[],
  date = today()
) {
  const override = overrides.find((item) => item.active && dateKey(item.date) === dateKey(date));
  if (override) return { dayType: override.dayType, override };
  const teamDefault = defaultForDate(defaults, date);
  return { dayType: teamDefault?.dayType ?? DayType.REST, override: null, teamDefault };
}

export function weeklyPlan(defaults: TeamScheduleDefault[], overrides: AthleteScheduleOverride[]) {
  return weekDates().map((date) => {
    const effective = effectiveDayType(defaults, overrides, date);
    return { date, ...effective, teamDefault: defaultForDate(defaults, date) };
  });
}

export function athleteName(athlete: Pick<Athlete, "firstName" | "lastName">) {
  return `${athlete.firstName} ${athlete.lastName}`;
}

export function dayTypeLabel(dayType: DayType | string) {
  return dayType
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
