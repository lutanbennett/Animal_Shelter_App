"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * "Scan a chip": USB and Bluetooth readers type the 15 digits and press
 * Enter, so this is a plain GET form to /residents?q=. The page does the
 * exact match and the jump (or offers a new resident). Typing into it works
 * just as well as a reader, and a phone cannot scan 134.2 kHz chips.
 *
 * Not autofocused since 2026-10-08: the cursor starts in Search (FocusSearch),
 * which sends the same `q`, so a reader fired straight in still jumps.
 */
export function ScanChipBox() {
  const { t } = useI18n();
  const l = t.residents.list;
  return (
    <form method="get" action="/residents" className="flex flex-col gap-1">
      <label htmlFor="scan-chip" className="text-sm font-medium text-muted">
        {l.scanChip}
      </label>
      <input
        id="scan-chip"
        name="q"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={l.scanChipPlaceholder}
        className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:w-64"
      />
    </form>
  );
}
