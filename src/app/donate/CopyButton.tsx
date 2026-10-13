"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Copies one detail (an account number, a PromptPay ID) to the clipboard.
 * If the browser refuses, it says so and the number is still on screen to
 * press and hold: a donor must never be left thinking it was copied.
 */
export function CopyButton({ value, what }: { value: string; what: string }) {
  const { t } = useI18n();
  const w = t.donateWays;
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 3000);
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={copy}
        aria-label={w.copyAria(what)}
        className="inline-flex min-h-11 items-center gap-2 rounded border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
      >
        {state === "copied" ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
        {state === "copied" ? w.copied : w.copy}
      </button>
      <span role="status" className="text-xs text-muted">
        {state === "failed" ? w.copyFailed : ""}
      </span>
    </span>
  );
}
