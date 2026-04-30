import type { FluidCheckIn } from "@prisma/client";
import Link from "next/link";
import { hydrationTrend, urineColorMeta } from "@/lib/hydration-trend";

type UrineTrendEntry = Pick<FluidCheckIn, "id" | "urineColor" | "createdAt" | "note">;

function trendGradient(entries: UrineTrendEntry[]) {
  if (!entries.length) return undefined;
  const stops = entries.map((entry, index) => {
    const position = entries.length === 1 ? 0 : (index / (entries.length - 1)) * 100;
    return `${urineColorMeta(entry.urineColor).color} ${position}%`;
  });
  return entries.length === 1 ? urineColorMeta(entries[0].urineColor).color : `linear-gradient(90deg, ${stops.join(", ")})`;
}

function latestEntryLabel(entry: UrineTrendEntry) {
  const meta = urineColorMeta(entry.urineColor);
  return `${meta.label} - ${entry.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${entry.createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}${entry.note ? ` - Note: ${entry.note}` : ""}`;
}

export function UrineColorTrend({ entries }: { entries: UrineTrendEntry[] }) {
  const chronological = [...entries].reverse();
  const trend = hydrationTrend(chronological);
  const toneClass = trend.tone === "green" ? "text-fuel-green" : trend.tone === "amber" ? "text-amber-800" : "text-fuel-blue";
  const gradientBackground = trendGradient(chronological);
  const latestEntry = chronological[chronological.length - 1];

  return (
    <div className="mt-5 rounded-2xl border border-stone-100 bg-gradient-to-b from-stone-50/75 to-white/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Recent urine color trend</h3>
          <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${toneClass}`}>{trend.label}</p>
        </div>
        {latestEntry ? <p className="text-xs text-stone-500">Latest: {urineColorMeta(latestEntry.urineColor).label}</p> : null}
      </div>

      {!chronological.length ? (
        <p className="mt-3 text-sm text-stone-600">Log a few fluid check-ins to see your urine color trend.</p>
      ) : (
        <div className="mt-3">
          <div
            className="h-8 rounded-full border border-white shadow-inner ring-1 ring-stone-200/70"
            style={{ background: gradientBackground }}
            title={latestEntry ? latestEntryLabel(latestEntry) : undefined}
            aria-label={`Recent urine color trend: ${chronological.map((entry) => urineColorMeta(entry.urineColor).label).join(" to ")}`}
          />
          {latestEntry ? <p className="mt-1 text-right text-[10px] font-semibold text-fuel-green">Latest</p> : null}
        </div>
      )}

      <p className="mt-3 text-sm leading-6 text-stone-700">{trend.interpretation}</p>
      <p className="mt-2 rounded-xl border border-fuel-mint/80 bg-gradient-to-r from-fuel-mint/70 to-white px-3 py-2 text-sm font-medium leading-6 text-stone-800">
        <span className="font-semibold">Fluid cue:</span> {trend.suggestion}
      </p>
    </div>
  );
}

export function UrineColorTrendSummary({ entries, readOnly = false }: { entries: UrineTrendEntry[]; readOnly?: boolean }) {
  const chronological = [...entries].reverse();
  const trend = hydrationTrend(chronological);
  const toneClass = trend.tone === "green" ? "text-fuel-green" : trend.tone === "amber" ? "text-amber-800" : "text-fuel-blue";
  const gradientBackground = trendGradient(chronological);
  const latestEntry = chronological[chronological.length - 1];

  return (
    <div className="mt-4 rounded-2xl border border-stone-200/70 bg-gradient-to-b from-stone-50 to-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">Urine color trend</p>
          <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${toneClass}`}>{trend.label}</p>
        </div>
        <Link href="/meals" className="shrink-0 text-xs font-semibold text-fuel-blue hover:text-sky-800">
          {readOnly ? "View trend" : chronological.length < 2 ? "Log fluid check-in" : "View fluid trend"}
        </Link>
      </div>

      {!chronological.length ? (
        <p className="mt-2 text-sm text-stone-600">Log a few check-ins to see a trend.</p>
      ) : (
        <div
          className="mt-3 h-3 rounded-full border border-white shadow-inner ring-1 ring-stone-200/70"
          style={{ background: gradientBackground }}
          title={latestEntry ? latestEntryLabel(latestEntry) : undefined}
          aria-label={`Recent urine color summary: ${chronological.map((entry) => urineColorMeta(entry.urineColor).label).join(" to ")}`}
        />
      )}

      <p className="mt-2 text-xs leading-5 text-stone-600">{trend.interpretation}</p>
      <p className="mt-2 text-xs font-medium leading-5 text-stone-800">
        <span className="font-semibold">Quick suggestion:</span> {trend.suggestion}
      </p>
    </div>
  );
}
