import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/60 p-4 shadow-[0_12px_34px_rgba(23,32,27,0.05)] backdrop-blur md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-fuel-ink">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Panel({ children, className, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section {...props} className={clsx("rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[0_14px_38px_rgba(23,32,27,0.07)] ring-1 ring-stone-200/45 backdrop-blur", className)}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue" }) {
  const tones = {
    neutral: "border-stone-200 bg-stone-100/80 text-stone-700",
    green: "border-fuel-mint bg-fuel-mint text-fuel-green",
    amber: "border-amber-200 bg-amber-100 text-amber-800",
    red: "border-red-200 bg-red-100 text-red-800",
    blue: "border-sky-200 bg-sky-100 text-sky-800"
  };
  return <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm", tones[tone])}>{children}</span>;
}

export function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx("focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-fuel-green px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50", className)}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("focus-ring w-full rounded-lg border border-stone-200 bg-white/95 px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] placeholder:text-stone-400", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx("focus-ring w-full rounded-lg border border-stone-200 bg-white/95 px-3 py-2 text-sm shadow-sm", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("focus-ring w-full rounded-lg border border-stone-200 bg-white/95 px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] placeholder:text-stone-400", props.className)} />;
}
