import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * Every string the scan-card button shows, as plain text. The dictionary holds functions, which a
 * server page cannot hand to a client component, so this is the whole of what crosses the boundary:
 * add a key here and a function-valued one will not typecheck
 * (docs/decisions/2026-10-17-scan-button-plain-strings.md). Kept out of ScanCardButton.tsx because
 * that file is "use client" and a server component cannot call a function exported from it.
 */
export type ScanCardStrings = {
  scanCard: string;
  waitHold: string;
  waitStop: string;
  waitRefused: string;
  scanHold: string;
  scanUnreadable: string;
  scanUnknown: string;
  scanDenied: string;
};

export function scanCardStrings(t: Dictionary): ScanCardStrings {
  const p = t.medicalJobs.picker;
  return {
    scanCard: p.scanCard,
    waitHold: p.waitHold,
    waitStop: p.waitStop,
    waitRefused: p.waitRefused,
    scanHold: p.scanHold,
    scanUnreadable: p.scanUnreadable,
    scanUnknown: p.scanUnknown,
    scanDenied: p.scanDenied,
  };
}
