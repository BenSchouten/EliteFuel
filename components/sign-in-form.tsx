"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button, Input } from "@/components/ui";

const demoAccounts = [
  ["Club admin", "admin@elitefuel.demo"],
  ["Staff", "jordan.staff@elitefuel.demo"],
  ["Athlete", "maya.torres@elitefuel.demo"],
  ["Parent", "morgan.parent@elitefuel.demo"]
] as const;

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("That email and password did not match a seeded EliteFuel account.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <div className="w-full rounded-lg border border-stone-200 bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-semibold">Sign in</h2>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Email
          <Input className="mt-1" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Password
          <Input className="mt-1" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          <LogIn size={16} aria-hidden />
          {loading ? "Signing in..." : "Sign in to EliteFuel"}
        </Button>
      </form>
      <div className="mt-6 border-t border-stone-200 pt-5">
        <p className="text-sm font-semibold">Demo accounts</p>
        <p className="mt-1 text-sm text-stone-600">Choose a demo account below or enter credentials manually.</p>
        <div className="mt-3 grid gap-2">
          {demoAccounts.map(([label, account]) => (
            <button
              key={account}
              type="button"
              onClick={() => {
                setEmail(account);
                setPassword("Demo123!");
              }}
              className="focus-ring flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-left text-sm hover:bg-fuel-paper"
            >
              <span className="font-medium">{label}</span>
              <span className="text-stone-600">{account}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-stone-600">Password for all demo accounts: <strong>Demo123!</strong></p>
      </div>
    </div>
  );
}
