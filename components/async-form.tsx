"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type AsyncFormProps = {
  action: string;
  children: ReactNode;
  className?: string;
  encType?: string;
  method?: "post";
  resetOnSuccess?: boolean;
  successMessage?: string;
};

export function AsyncForm({
  action,
  children,
  className,
  encType,
  method = "post",
  resetOnSuccess = false,
  successMessage = "Saved",
}: AsyncFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch(action, {
        method: method.toUpperCase(),
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setMessage(String(data.error ?? "Could not save. Check the form and try again."));
        return;
      }

      if (resetOnSuccess) formRef.current?.reset();
      setStatus("saved");
      setMessage(String(data.message ?? successMessage));
      router.refresh();
      window.setTimeout(() => {
        setStatus((current) => (current === "saved" ? "idle" : current));
        setMessage("");
      }, 2200);
    } catch {
      setStatus("error");
      setMessage("Could not save. Try again in a moment.");
    }
  }

  return (
    <form ref={formRef} action={action} method={method} encType={encType} onSubmit={submit} className={className}>
      <fieldset disabled={status === "saving"} className="contents">
        {children}
      </fieldset>
      <div className="min-h-5" aria-live="polite">
        {status === "saving" ? <p className="text-xs font-semibold text-fuel-blue">Saving...</p> : null}
        {status === "saved" ? <p className="text-xs font-semibold text-fuel-green">{message || successMessage}</p> : null}
        {status === "error" ? <p className="text-xs font-semibold text-red-700">{message}</p> : null}
      </div>
    </form>
  );
}
