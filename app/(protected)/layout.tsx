import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppNavLink } from "@/components/app-nav-link";
import { BrandMark } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { requireSession } from "@/lib/session";

const nav: Array<[string, string, Role[]]> = [
  ["Club admin", "/admin", ["CLUB_ADMIN"]],
  ["Staff operations", "/staff", ["STAFF"]],
  ["Team roster", "/roster", ["CLUB_ADMIN", "STAFF"]],
  ["Team schedule", "/schedule", ["STAFF", "CLUB_ADMIN"]],
  ["Athlete overview", "/athlete", ["ATHLETE"]],
  ["Schedule", "/athlete/schedule", ["ATHLETE"]],
  ["Parent overview", "/parent", ["PARENT"]],
  ["Schedule", "/parent/schedule", ["PARENT"]],
  ["Meals", "/meals", ["ATHLETE", "PARENT"]],
  ["Club meal library", "/library", ["ATHLETE", "PARENT", "STAFF", "CLUB_ADMIN"]],
  ["My fueling profile", "/profile", ["ATHLETE", "PARENT"]],
  ["Safety", "/safety", ["ATHLETE", "PARENT", "STAFF", "CLUB_ADMIN"]]
] as const;

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!session.user.role) redirect("/signin");
  const parentOrder = new Map([
    ["Parent overview", 0],
    ["Schedule", 1],
    ["Meals", 2],
    ["Club meal library", 3],
    ["My fueling profile", 4],
    ["Safety", 5]
  ]);
  const allowed = nav
    .filter(([, , roles]) => roles.includes(session.user.role))
    .sort(([labelA], [labelB]) => {
      if (session.user.role !== "PARENT") return 0;
      return (parentOrder.get(labelA) ?? 99) - (parentOrder.get(labelB) ?? 99);
    });

  return (
    <div className="relative min-h-screen overflow-hidden bg-fuel-paper">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_12%_10%,rgba(199,232,107,0.32),transparent_30%),radial-gradient(circle_at_88%_4%,rgba(39,125,161,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,247,242,0))]" />
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/82 shadow-[0_8px_30px_rgba(23,32,27,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <BrandMark />
            <span className="hidden rounded-full border border-fuel-mint bg-fuel-mint/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-fuel-green sm:inline-flex">
              {session.user.role.replace("_", " ").toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-full border border-stone-200/80 bg-white/80 px-3 py-1.5 text-stone-700 shadow-sm">
              <span className="font-semibold text-fuel-ink">{session.user.name}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3" aria-label="Main navigation">
          {allowed.map(([label, href]) => (
            <AppNavLink key={href} href={href} label={label} exact={href === "/athlete" || href === "/parent"} />
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 md:py-8">{children}</main>
    </div>
  );
}
