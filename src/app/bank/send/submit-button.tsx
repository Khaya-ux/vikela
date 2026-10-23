"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-medium text-brand-ink disabled:opacity-60">
      {pending ? "Sending…" : "Pay now"}
    </button>
  );
}
