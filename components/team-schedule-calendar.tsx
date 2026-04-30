import type { AthleteScheduleOverride } from "@prisma/client";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { dateKey, dayLabel } from "@/lib/dates";
import { addMonths, monthDates, monthKey, monthLabel, type PlannedTeamScheduleEntry, type TeamScheduleRhythm } from "@/lib/schedule-calendar";
import { dayTypeLabel } from "@/lib/schedule";

function entryForDate(entries: PlannedTeamScheduleEntry[], date: Date) {
  const key = dateKey(date);
  return entries.find((entry) => dateKey(entry.date) === key);
}

function overrideForDate(overrides: AthleteScheduleOverride[], date: Date) {
  const key = dateKey(date);
  return overrides.find((override) => override.active && dateKey(override.date) === key);
}

function rhythmForDate(defaults: TeamScheduleRhythm[], date: Date) {
  return defaults.find((item) => item.dayOfWeek === date.getDay()) ?? null;
}

function formatClockTime(value: string | null | undefined) {
  if (!value) return "";
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${suffix}`;
}

function timeRange(startTime?: string | null, endTime?: string | null) {
  const start = formatClockTime(startTime);
  const end = formatClockTime(endTime);
  if (start && end) return `${start}–${end}`;
  return start;
}

export function TeamScheduleCalendar({
  basePath,
  defaults,
  month,
  plannedEntries,
  teamId,
  teamName,
  athleteOverrides = [],
  readOnly = false,
  queryParams = {},
}: {
  basePath: string;
  defaults: TeamScheduleRhythm[];
  month: Date;
  plannedEntries: PlannedTeamScheduleEntry[];
  teamId?: string;
  teamName: string;
  athleteOverrides?: AthleteScheduleOverride[];
  readOnly?: boolean;
  queryParams?: Record<string, string | undefined>;
}) {
  function hrefFor(targetMonth: Date) {
    const params = new URLSearchParams();
    if (teamId) params.set("team", teamId);
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) params.set(key, value);
    }
    params.set("month", monthKey(targetMonth));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{readOnly ? "Monthly schedule" : "Team calendar"}</h2>
          <p className="mt-2 text-sm text-stone-600">
            {readOnly
              ? `${teamName} schedule for the month, including planned team dates and athlete-specific changes.`
              : `Plan ${teamName} by month. One-off schedule items can sit on top of the repeating team rhythm.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={hrefFor(addMonths(month, -1))}
            className="focus-ring rounded-lg border border-stone-200 bg-white/90 px-3 py-2 font-semibold text-stone-700 shadow-sm hover:bg-fuel-mint/50 hover:text-fuel-green"
          >
            Previous month
          </Link>
          <span className="min-w-32 rounded-full bg-stone-100/90 px-3 py-2 text-center font-semibold text-fuel-ink shadow-inner">{monthLabel(month)}</span>
          <Link
            href={hrefFor(addMonths(month, 1))}
            className="focus-ring rounded-lg border border-stone-200 bg-white/90 px-3 py-2 font-semibold text-stone-700 shadow-sm hover:bg-fuel-mint/50 hover:text-fuel-green"
          >
            Next month
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200/70 bg-gradient-to-b from-white/80 to-stone-50/80 p-2 shadow-inner">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-7">
        {monthDates(month).map((date) => {
          const planned = entryForDate(plannedEntries, date);
          const override = overrideForDate(athleteOverrides, date);
          const teamDefault = rhythmForDate(defaults, date);
          const scheduleItem = planned ?? teamDefault;
          const item = override ?? scheduleItem;
          const sourceLabel = override ? "Athlete override" : planned ? "Planned date" : "Repeats weekly";
          const sourceTone = override ? "amber" : planned ? "blue" : "neutral";
          const itemTime = !override ? timeRange(scheduleItem?.startTime, scheduleItem?.endTime) : "";

          return (
            <div key={date.toISOString()} className="min-h-36 rounded-xl border border-stone-200/75 bg-white/95 p-3 shadow-sm transition hover:border-fuel-mint hover:shadow-[0_10px_26px_rgba(23,32,27,0.08)]">
              <p className="text-xs font-semibold text-stone-500">{dayLabel(date)}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{dayTypeLabel(item?.dayType ?? "REST")}</p>
                <Badge tone={sourceTone}>{sourceLabel}</Badge>
              </div>
              <p className="mt-1 text-xs leading-5 text-stone-600">{planned && !override ? planned.title : teamDefault?.title ?? "Rest"}</p>
              {itemTime ? <p className="mt-2 text-xs font-medium text-fuel-blue">{itemTime}</p> : null}
              {planned?.notes && !override ? <p className="mt-2 text-xs leading-5 text-stone-500">{planned.notes}</p> : null}
              {override ? <p className="mt-2 text-xs leading-5 text-amber-800">{override.note || "Athlete-specific schedule change"}</p> : null}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
