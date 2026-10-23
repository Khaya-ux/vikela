"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-renders the server component every few seconds so new cases appear without a reload.
export function AutoRefresh({ seconds = 3 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
