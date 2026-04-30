"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/signin" });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="focus-ring inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2 font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:cursor-wait disabled:opacity-70"
      aria-live="polite"
    >
      <LogOut size={16} aria-hidden />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
