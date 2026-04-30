"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNavLink({ href, label, exact = false }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || (!exact && href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={clsx(
        "focus-ring whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-fuel-green text-white shadow-[0_8px_18px_rgba(31,122,77,0.22)]"
          : "text-stone-700 hover:bg-white hover:text-fuel-green hover:shadow-sm"
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
