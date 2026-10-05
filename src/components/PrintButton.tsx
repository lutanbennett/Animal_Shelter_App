"use client";

import { Printer } from "lucide-react";

/** Opens the browser's print dialog. Styled as CsvDownloadButton's. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-hover md:min-h-0 print:hidden"
    >
      <Printer aria-hidden className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
