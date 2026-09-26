/**
 * The stocktake sheet (/stocktake): what one row of the sheet means, and
 * the list it sends to record_stocktake() (0088, 0091).
 *
 * Blank vs unchanged is the rule everything here serves. On Management →
 * Medications / → Diets a single stock cell left blank clears the count to
 * "not counted" (0083). On the sheet a blank means the opposite — "not
 * counted this time, leave it alone" — so a blank row is left out of the
 * list entirely, and record_stocktake() never sees it. Confirming an
 * unchanged figure is a separate, explicit tick ("same as last time") that
 * sends the old figure, which the 0083 trigger restamps as counted now.
 * Typing clears the tick and ticking clears the typing, so a row is always
 * exactly one of: left alone, counted, confirmed.
 */

/** Admin and management as for the single stock cell, plus the people who walk the shelves (0091). */
export const STOCKTAKE_ROLES = ["admin", "management", "staff", "volunteer"] as const;

export function canStocktake(role: string | null | undefined): boolean {
  return role != null && (STOCKTAKE_ROLES as readonly string[]).includes(role);
}

export type StocktakeKind = "medication" | "diet";

export type StocktakeItem = {
  id: string;
  name: string;
  /** Already translated, e.g. "tablet", "g". */
  unit: string;
  /** Last count. Null = never counted, which is not 0. */
  lastCount: number | null;
  lastCountedAt: string | null;
};

/** What the person has done to one row. Both empty = left alone. */
export type RowEntry = {
  /** As typed. */
  value: string;
  /** "Same as last time": confirm lastCount without retyping it. */
  same: boolean;
};

export type RowOutcome =
  | { kind: "untouched" }
  | { kind: "counted"; count: number }
  | { kind: "confirmed"; count: number }
  | { kind: "invalid" };

/**
 * One row's outcome. A blank row is untouched — never "clear the count".
 * "Same" on an item that was never counted has nothing to confirm, so it
 * is untouched too (the sheet does not offer the tick there).
 */
export function rowOutcome(item: StocktakeItem, entry: RowEntry | undefined): RowOutcome {
  if (!entry) return { kind: "untouched" };
  if (entry.same) {
    return item.lastCount == null
      ? { kind: "untouched" }
      : { kind: "confirmed", count: item.lastCount };
  }
  const trimmed = entry.value.trim();
  if (!trimmed) return { kind: "untouched" };
  // No comma handling: "1,5" and "1,000" would each be a plausible guess,
  // so both are refused and the row is flagged, rather than saved wrong.
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return { kind: "invalid" };
  return { kind: "counted", count: n };
}

/**
 * A change worth a second look before saving: at least half the last count
 * up or down, or stock appearing from a count of 0. Kept loose on purpose —
 * it only highlights a row in the summary, it never blocks.
 */
export const BIG_CHANGE_RATIO = 0.5;

export function isBigChange(lastCount: number | null, count: number): boolean {
  if (lastCount == null || lastCount === count) return false;
  if (lastCount === 0) return true;
  return Math.abs(count - lastCount) / lastCount >= BIG_CHANGE_RATIO;
}

export type SummaryLine = {
  kind: StocktakeKind;
  item: StocktakeItem;
  outcome: Extract<RowOutcome, { kind: "counted" | "confirmed" }>;
  big: boolean;
};

export type SheetSummary = {
  lines: SummaryLine[];
  /** Rows with something typed that is not a count of 0 or more. */
  invalid: { kind: StocktakeKind; item: StocktakeItem }[];
  /** Rows left blank — left alone by the save. */
  untouched: number;
  medication: { id: string; count: number }[];
  diet: { id: string; count: number }[];
};

export function summarise(
  items: Record<StocktakeKind, StocktakeItem[]>,
  entries: Record<StocktakeKind, Record<string, RowEntry>>,
): SheetSummary {
  const summary: SheetSummary = { lines: [], invalid: [], untouched: 0, medication: [], diet: [] };
  for (const kind of ["medication", "diet"] as const) {
    for (const item of items[kind]) {
      const outcome = rowOutcome(item, entries[kind][item.id]);
      if (outcome.kind === "untouched") {
        summary.untouched += 1;
      } else if (outcome.kind === "invalid") {
        summary.invalid.push({ kind, item });
      } else {
        summary.lines.push({ kind, item, outcome, big: isBigChange(item.lastCount, outcome.count) });
        summary[kind].push({ id: item.id, count: outcome.count });
      }
    }
  }
  return summary;
}
