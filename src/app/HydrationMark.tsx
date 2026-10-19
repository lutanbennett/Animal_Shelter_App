"use client";

import { useEffect } from "react";

/** Tells the early-submit guard (src/lib/early-submit-guard.ts) the page is ready. */
export function HydrationMark() {
  useEffect(() => {
    (window as unknown as { __releaseHeldForm?: () => void }).__releaseHeldForm?.();
  }, []);
  return null;
}
