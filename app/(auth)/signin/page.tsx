import { Suspense } from "react";
import { FlameKindling } from "lucide-react";
import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-fuel-paper">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-6 py-8 lg:px-10">
          <div className="flex items-center gap-3 text-xl font-semibold">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-fuel-green text-white">
              <FlameKindling aria-hidden />
            </span>
            EliteFuel
          </div>
          <div className="max-w-xl py-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-fuel-green">Youth sports nutrition operations</p>
            <h1 className="text-5xl font-semibold leading-tight tracking-normal text-fuel-ink">Fuel plans that stay connected to the team week.</h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              EliteFuel helps clubs coordinate training context, athlete exceptions, meal logging, parent support and staff follow-up in one club-scoped workspace.
            </p>
          </div>
          <p className="text-sm text-stone-500">Local MVP environment. Seeded demo accounts are visible for testing.</p>
        </section>
        <section className="flex items-center px-6 py-10 lg:px-10">
          <Suspense fallback={<div className="w-full rounded-lg border border-stone-200 bg-white p-6 shadow-soft">Loading sign-in...</div>}>
            <SignInForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
