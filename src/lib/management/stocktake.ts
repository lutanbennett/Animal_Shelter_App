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

import { defaultUnit, resolveEntered, type UnitConversion } from "@/lib/units";

export type StocktakeKind = "medication" | "diet";

export type StocktakeItem = {
  id: string;
  name: string;
  /** Already translated, e.g. "tablet", "g". */
  unit: string;
  /** Last count. Null = never counted, which is not 0. */
  lastCount: number | null;
  lastCountedAt: string | null;
  /** Drive id of the box/bottle label photo (medications only, 0129). */
  labelFileId?: string | null;
  /** Other units it is counted in (0118), as they are now. Absent = base unit only. */
  conversions?: UnitConversion[];
};

/** The unit a row counts in unless the person changed it: the count unit, else the base unit (""). */
export function entryUnit(item: StocktakeItem, entry: RowEntry | undefined): string {
  if (entry?.unit != null) return entry.unit;
  return defaultUnit(item.conversions ?? [], "count")?.unit ?? "";
}

/** What the person has done to one row. Both empty = left alone. */
export type RowEntry = {
  /** As typed. */
  value: string;
  /** "Same as last time": confirm lastCount without retyping it. */
  same: boolean;
  /** A conversion's unit name; "" = base. Unset = the item's default count unit. */
  unit?: string;
};

export type RowOutcome =
  | { kind: "untouched" }
  /** `count` is in BASE units; `typed` is what was entered when that was another unit. */
  | { kind: "counted"; count: number; typed?: { quantity: number; unit: string } }
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
  const unit = entryUnit(item, entry);
  if (!unit) return { kind: "counted", count: n };
  // The sheet's own preview. The server stamps the factor again from the
  // live conversion when it saves; this one is never stored.
  const resolved = resolveEntered(n, unit, item.conversions ?? []);
  if (!resolved.ok) return { kind: "invalid" };
  return { kind: "counted", count: resolved.base, typed: { quantity: n, unit } };
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
  medication: SheetCount[];
  diet: SheetCount[];
};

/** One row of the save: `count` in base units, plus the unit it was typed in when that was not the base. */
export type SheetCount = { id: string; count: number; quantity?: number; unit?: string };

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
        summary[kind].push(
          outcome.kind === "counted" && outcome.typed
            ? { id: item.id, count: outcome.count, quantity: outcome.typed.quantity, unit: outcome.typed.unit }
            : { id: item.id, count: outcome.count },
        );
      }
    }
  }
  return summary;
}

/**
 * The order the phone's cards come in: the ids of the items, first card first.
 * Name order today, because that is the order the page loads them in. It is a
 * function of its own so "Stocktake in cupboard order" (backlog, Management)
 * can change it in one place without touching the cards.
 */
export function cardSequence(items: StocktakeItem[]): string[] {
  return items.map((item) => item.id);
}

/**
 * Where the card-by-card count has got to. `queue` is the ids still being
 * walked this pass — null is the whole sequence, a list is a second pass over
 * the cards that were skipped. `pos === queue.length` is the end screen.
 * `skipped` is every card passed over and not counted since.
 */
export type CardsState = {
  queue: string[] | null;
  pos: number;
  skipped: string[];
};

export const CARDS_START: CardsState = { queue: null, pos: 0, skipped: [] };

function queueOf(state: CardsState, sequence: string[]): string[] {
  return state.queue ?? sequence;
}

/** The card shown now, or null at the end screen (or with nothing to count). */
export function currentCardId(state: CardsState, sequence: string[]): string | null {
  return queueOf(state, sequence)[state.pos] ?? null;
}

export function cardsTotal(state: CardsState, sequence: string[]): number {
  return queueOf(state, sequence).length;
}

/**
 * Moves on from the card shown. `skip` marks it skipped, anything else
 * counts it, which takes it off the skipped list if a second pass is
 * revisiting it. Never moves past the end screen.
 */
export function cardsAdvance(state: CardsState, sequence: string[], outcome: "counted" | "skip"): CardsState {
  const id = currentCardId(state, sequence);
  if (id == null) return state;
  const skipped =
    outcome === "skip"
      ? state.skipped.includes(id)
        ? state.skipped
        : [...state.skipped, id]
      : state.skipped.filter((s) => s !== id);
  return { ...state, skipped, pos: Math.min(state.pos + 1, queueOf(state, sequence).length) };
}

/** One card back, from the end screen too. Stays on the first card. */
export function cardsBack(state: CardsState): CardsState {
  return { ...state, pos: Math.max(state.pos - 1, 0) };
}

/** "5 skipped — count them now?": a pass over just the skipped cards. */
export function cardsRevisit(state: CardsState, sequence: string[]): CardsState {
  const ids = sequence.filter((id) => state.skipped.includes(id));
  return ids.length === 0 ? state : { ...state, queue: ids, pos: 0 };
}

/** Back to the first card, keeping what was skipped (a restart after saving clears it too). */
export function cardsFrom(state: CardsState, sequence: string[], id: string): CardsState {
  const pos = sequence.indexOf(id);
  return pos < 0 ? CARDS_START : { ...state, queue: null, pos };
}

/** A restored draft only keeps the ids that still exist: an item deleted since would fail the whole save. */
export function pruneCards(state: CardsState, sequence: string[]): CardsState {
  const live = new Set(sequence);
  const skipped = state.skipped.filter((id) => live.has(id));
  const queue = state.queue?.filter((id) => live.has(id)) ?? null;
  const total = queue?.length ?? sequence.length;
  return { queue: queue && queue.length > 0 ? queue : null, skipped, pos: Math.min(Math.max(state.pos, 0), total) };
}
