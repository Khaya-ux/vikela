"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="w-full rounded-2xl bg-bank px-4 py-3.5 text-sm font-semibold text-bank-ink disabled:opacity-60">
      {pending ? "Sending…" : "Pay now"}
    </button>
  );
}
