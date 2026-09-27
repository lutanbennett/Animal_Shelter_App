"use client";

import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

/**
 * A "Download CSV" button for a table a server page has already turned
 * into CSV text (see src/lib/csv.ts). Styled as Cashflow's.
 */
export function CsvDownloadButton({
  csv,
  filename,
  label,
  disabled = false,
}: {
  csv: string;
  filename: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, csv)}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-hover disabled:opacity-50"
    >
      <Download aria-hidden className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
