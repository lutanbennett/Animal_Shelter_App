"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copies the month section as plain text (built on the server by
 * monthReportText) for pasting into the monthly report or a LINE message.
 * Styled as PrintButton beside it. Where the clipboard is refused, the text
 * is offered in a prompt to copy by hand, as CopyTagLink does.
 */
export function CopyTextButton({
  text,
  label,
  copiedLabel,
  promptLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  promptLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(promptLabel, text);
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-hover md:min-h-0 print:hidden"
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
