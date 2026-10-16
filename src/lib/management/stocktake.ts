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

import { defaultUnit, resolveEntered, roundBase, type EnteredLine, type UnitConversion } from "@/lib/units";

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
  /** The base unit as stored (English), to tell a loose line from a size when a last count is read back. */
  baseUnit?: string;
  /** Other units it is counted in (0118), as they are now. Absent = base unit only. */
  conversions?: UnitConversion[];
  /**
   * The sizes the last count was made in, when it was made in several, so
   * "Same as last time" can repeat the lines and not only the total. Null =
   * counted in one figure, or not counted.
   */
  lastEntered?: EnteredLine[] | null;
};

/**
 * Counting in sizes (backlog, "Pack sizes, the rest", part b). An item with
 * other sizes set up is counted one whole-number row per size, plus a row for
 * loose stock in the base unit, and the system adds them up. Nobody types a
 * decimal or a conversion.
 *
 * An OPEN bag cannot be a whole number of bags, so it is a rough choice of how
 * full it is. The fractions sit at or below the middle of each wording
 * ("about full" is 0.9, not 1) so a half-used bag is never counted as a whole
 * one, which is the way a stocktake goes wrong: it overstates stock and the
 * forecast says the shelter has longer than it has.
 */
export type OpenLevel = "full" | "half" | "quarter" | "nearly";
export const OPEN_LEVELS: OpenLevel[] = ["full", "half", "quarter", "nearly"];
export const OPEN_FRACTION: Record<OpenLevel, number> = { full: 0.9, half: 0.5, quarter: 0.25, nearly: 0.1 };

/** One open bag, box or sleeve: which size it is (a unit name) and roughly how full. */
export type OpenBag = { unit: string; level: OpenLevel };

/** The biggest whole number a size row takes: far above any real shelf, low enough to catch a slipped finger. */
export const MAX_PER_SIZE = 9999;

/** One line of a count in sizes, as typed: a unit name ("" = loose, in the base unit) and how many. */
export type CountLine = { quantity: number; unit: string };

export type SizeRow = { key: string; factor: number; conversion?: UnitConversion };

/** Counted in sizes: the item has any other size set up. Anything else keeps the single figure box. */
export function usesSizes(item: StocktakeItem): boolean {
  return (item.conversions?.length ?? 0) > 0;
}

/**
 * The rows, in the order the person meets them: the size it is usually counted
 * in, then the one usually bought, then the rest biggest first, and loose
 * stock (the base unit) last.
 */
export function sizeRows(item: StocktakeItem): SizeRow[] {
  const conversions = item.conversions ?? [];
  if (conversions.length === 0) return [];
  const rank = (c: UnitConversion) => (c.isCount ? 0 : c.isDefaultPurchase ? 1 : c.isPurchase ? 2 : 3);
  const ordered = [...conversions].sort((a, b) => rank(a) - rank(b) || b.basePer - a.basePer);
  return [
    ...ordered.map((c) => ({ key: c.unit, factor: c.basePer, conversion: c })),
    { key: "", factor: 1 },
  ];
}

/** The sizes a person can call an open one: the packs, never the loose row. */
export function openChoices(item: StocktakeItem): SizeRow[] {
  return sizeRows(item).filter((r) => r.key !== "");
}

/** What the person has counted in sizes, as lines: whole ones first, then the open ones as a fraction of their size. */
export function countLines(entry: RowEntry | undefined): CountLine[] {
  const lines: CountLine[] = [];
  for (const [unit, n] of Object.entries(entry?.sizes ?? {})) if (n > 0) lines.push({ quantity: n, unit });
  for (const bag of entry?.open ?? []) lines.push({ quantity: OPEN_FRACTION[bag.level], unit: bag.unit });
  return lines;
}

/** Base units in a set of lines, each against its OWN size factor. Null if a unit is not one of the item sizes. */
export function linesBase(item: StocktakeItem, lines: CountLine[]): number | null {
  const rows = sizeRows(item);
  let total = 0;
  for (const line of lines) {
    const row = rows.find((r) => r.key === line.unit);
    if (!row) return null;
    total += line.quantity * row.factor;
  }
  return roundBase(total);
}

/** True once the person has touched the size rows (a 0 they chose counts: none left). */
export function touchedSizes(entry: RowEntry | undefined): boolean {
  return Object.keys(entry?.sizes ?? {}).length > 0 || (entry?.open?.length ?? 0) > 0;
}

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
  /** Counted in sizes: how many whole ones of each (unit name, "" = loose). A key at 0 is a count of none. */
  sizes?: Record<string, number>;
  /** Counted in sizes: open bags, boxes or sleeves, each a rough fullness. */
  open?: OpenBag[];
};

export type RowOutcome =
  | { kind: "untouched" }
  /** `count` is in BASE units; `typed` is what was entered when that was another unit. */
  | { kind: "counted"; count: number; typed?: { quantity: number; unit: string }; lines?: CountLine[] }
  | { kind: "confirmed"; count: number; kept?: EnteredLine[] }
  | { kind: "invalid" };

/**
 * One row's outcome. A blank row is untouched — never "clear the count".
 * "Same" on an item that was never counted has nothing to confirm, so it
 * is untouched too (the sheet does not offer the tick there).
 */
export function rowOutcome(item: StocktakeItem, entry: RowEntry | undefined): RowOutcome {
  if (!entry) return { kind: "untouched" };
  if (entry.same) {
    if (item.lastCount == null) return { kind: "untouched" };
    // The sizes the last count was made in come along, when they still add up to it.
    const kept = item.lastEntered;
    const keptOk =
      !!kept &&
      kept.length > 0 &&
      Math.abs(kept.reduce((sum, l) => sum + l.quantity * l.factor, 0) - item.lastCount) <=
        0.000001 * Math.max(1, item.lastCount);
    return keptOk ? { kind: "confirmed", count: item.lastCount, kept } : { kind: "confirmed", count: item.lastCount };
  }
  if (usesSizes(item) && touchedSizes(entry)) {
    const sizes = entry.sizes ?? {};
    if (Object.values(sizes).some((n) => !Number.isInteger(n) || n < 0 || n > MAX_PER_SIZE)) return { kind: "invalid" };
    const lines = countLines(entry);
    const count = linesBase(item, lines);
    return count == null ? { kind: "invalid" } : { kind: "counted", count, lines };
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
export type SheetCount = {
  id: string;
  count: number;
  quantity?: number;
  unit?: string;
  /** Counted in sizes: the server restamps each against the live conversion. */
  lines?: CountLine[];
  /** Confirmed same as last time with its sizes: kept as they were, their own factors included. */
  kept?: EnteredLine[];
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
        summary[kind].push(
          outcome.kind === "counted" && outcome.lines
            ? { id: item.id, count: outcome.count, lines: outcome.lines }
            : outcome.kind === "counted" && outcome.typed
              ? { id: item.id, count: outcome.count, quantity: outcome.typed.quantity, unit: outcome.typed.unit }
              : outcome.kind === "confirmed" && outcome.kept
                ? { id: item.id, count: outcome.count, kept: outcome.kept }
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
