/**
 * Management → Stock between counts: what each item used between two
 * stocktakes, beside what the prescriptions and diets planned for the same
 * dates (backlog "Actual usage from stocktakes", Lutan 2026-09-26; usage
 * since "Record stock deliveries", 0096).
 *
 *     used = previous count + received − new count
 *
 * 0093 knew the two counts; 0096 added stock_receipts, the "received", and
 * the stock_count_intervals view that does this sum for every pair of
 * consecutive counts. This file never re-derives the sum: for a pair of
 * counts it walks the view's consecutive intervals from one to the other
 * and adds up the view's own figures (receivedBetween).
 *
 * What the figure assumes is that every delivery was recorded. So:
 *   - A delivery nobody recorded makes usage look LOWER than it was: a
 *     "less than planned" may be one, and the page says so beside it.
 *   - A delivery recorded twice, or too large, makes usage look higher: a
 *     "more than planned" says to check that too.
 *   - Used below zero — the later count is more than the earlier count plus
 *     what was recorded — can only be an unrecorded delivery or a miscount.
 *     The view leaves it negative on purpose; here it is "unlogged", with
 *     the least that must have arrived.
 * And the plan itself can read low for a past interval: medication_forecast
 * and diet_forecast only count residents by their status *today*, so an
 * animal adopted, fostered or died since was eating and taking medicine
 * over those dates but is not in the plan. Such rows carry `departed`, so
 * the page can say so beside a "more than planned" rather than let it read
 * as loss.
 *
 * A row is marked when usage is more than GAP_RATIO from the plan AND
 * further from it than the two counts can get wrong (countMargin: one of a
 * counted unit, a share of the stock for one read by eye). The second part
 * is the floor that stops an item planned at two tablets shouting over a
 * third; it is per item, from its own counts, never one number for all.
 *
 * Pure: no database, no i18n. `now` is never needed — dates come from the
 * counts. scripts/check-stock-usage.mjs runs the real exports.
 */

import { addDaysIso, todayIso } from "@/lib/format";

/** One stock_counts row (0093), normalised. */
export type CountRow = {
  /** stock_counts.id: how the pair is found in stock_count_intervals. */
  id: string;
  stocktake_id: string;
  item_id: string;
  counted_quantity: number;
  /** The item's unit at the moment of counting. */
  unit: string;
  counted_at: string;
};

/** The pair of counts one item is compared across. */
export type CountPair = { from: CountRow; to: CountRow };

const MS_PER_DAY = 86_400_000;

/** The count's calendar day at the shelter. */
export function shelterDate(countedAt: string): string {
  return todayIso(Date.parse(countedAt));
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / MS_PER_DAY);
}

const byTime = (a: CountRow, b: CountRow) => Date.parse(a.counted_at) - Date.parse(b.counted_at);

/**
 * Each item's latest count, and the last count on an EARLIER shelter day.
 * Not simply the last two rows: a sheet saved twice in one afternoon (a
 * recount, a correction) would give a zero-day interval with nothing to
 * compare, and the recount is the figure to trust anyway.
 * Items with no earlier-day count are left out of the map.
 */
export function latestPairs(rows: CountRow[]): Map<string, CountPair> {
  const byItem = new Map<string, CountRow[]>();
  for (const row of rows) {
    const list = byItem.get(row.item_id) ?? [];
    list.push(row);
    byItem.set(row.item_id, list);
  }
  const pairs = new Map<string, CountPair>();
  for (const [item, list] of byItem) {
    list.sort(byTime);
    const to = list[list.length - 1];
    const toDay = shelterDate(to.counted_at);
    for (let i = list.length - 2; i >= 0; i--) {
      if (shelterDate(list[i].counted_at) < toDay) {
        pairs.set(item, { from: list[i], to });
        break;
      }
    }
  }
  return pairs;
}

/**
 * The items counted in both of two chosen stocktakes. Given in either
 * order; the earlier one is always `from`.
 */
export function stocktakePairs(
  rows: CountRow[],
  stocktakeA: string,
  stocktakeB: string,
): Map<string, CountPair> {
  const a = new Map<string, CountRow>();
  const b = new Map<string, CountRow>();
  for (const row of rows) {
    if (row.stocktake_id === stocktakeA) a.set(row.item_id, row);
    if (row.stocktake_id === stocktakeB) b.set(row.item_id, row);
  }
  const pairs = new Map<string, CountPair>();
  for (const [item, ra] of a) {
    const rb = b.get(item);
    if (!rb) continue;
    pairs.set(item, byTime(ra, rb) <= 0 ? { from: ra, to: rb } : { from: rb, to: ra });
  }
  return pairs;
}

/** One saved sheet, for the picker: when, and how many items it counted. */
export type StocktakeSession = { id: string; counted_at: string; items: number };

/** Newest first. Every row of one stocktake shares counted_at (0093). */
export function stocktakeSessions(rows: CountRow[]): StocktakeSession[] {
  const sessions = new Map<string, StocktakeSession>();
  for (const row of rows) {
    const s = sessions.get(row.stocktake_id);
    if (s) s.items += 1;
    else sessions.set(row.stocktake_id, { id: row.stocktake_id, counted_at: row.counted_at, items: 1 });
  }
  return [...sessions.values()].sort((x, y) => Date.parse(y.counted_at) - Date.parse(x.counted_at));
}

/**
 * The forecast window that matches the interval between two counts: the
 * day of the first count up to the day before the second, inclusive —
 * `days` days, so consecutive intervals never count a day twice. Null for
 * two counts on the same shelter day.
 */
export function planWindow(pair: CountPair): { from: string; to: string; days: number } | null {
  const from = shelterDate(pair.from.counted_at);
  const toDay = shelterDate(pair.to.counted_at);
  const days = daysBetween(from, toDay);
  if (days <= 0) return null;
  return { from, to: addDaysIso(toDay, -1), days };
}

/** One stock_count_intervals row (0096): two consecutive counts of one item. */
export type IntervalRow = {
  from_count_id: string;
  to_count_id: string;
  received: number;
  receipts: number;
  /** Null when the counts and receipts do not share one unit. */
  used: number | null;
};

/** What arrived and what was used between a pair's two counts. */
export type Between = {
  received: number;
  receipts: number;
  /** Null across a unit change, as the view has it. */
  used: number | null;
};

/**
 * The pair's figures from the view. A pair is not always two consecutive
 * counts — latest mode skips same-day recounts, and two picked stocktakes
 * can have others between them — so this follows the view's intervals from
 * `from` to `to` and adds them up. The sum telescopes: the counts between
 * cancel, leaving from + all receipts in between − to, which is the view's
 * own rule applied to the wider interval. Null when the chain does not
 * reach `to` (the view was not loaded, or is behind the counts).
 */
export function receivedBetween(intervals: IntervalRow[], pair: CountPair): Between | null {
  const next = new Map(intervals.map((i) => [i.from_count_id, i]));
  let at = pair.from.id;
  let received = 0;
  let receipts = 0;
  let used: number | null = 0;
  for (let steps = 0; steps <= intervals.length; steps++) {
    const step = next.get(at);
    if (!step) return null;
    received += Number(step.received);
    receipts += Number(step.receipts);
    used = used == null || step.used == null ? null : used + Number(step.used);
    if (step.to_count_id === pair.to.id) {
      return { received: round2(received), receipts, used: used == null ? null : round2(used) };
    }
    at = step.to_count_id;
  }
  return null;
}

/**
 * How far usage may sit from the plan before the row is marked. Loose on
 * purpose: counts are by eye, diets are estimates by size, and the page
 * is for spotting the big gaps the backlog item asked about.
 */
export const GAP_RATIO = 0.25;

/**
 * Units a stocktake counts one by one: a count of them is exact to the
 * piece, bar a half tablet or a miscount of one.
 */
export const COUNTED_UNITS: ReadonlySet<string> = new Set([
  "tablet",
  "capsule",
  "sachet",
  "application",
  "dose",
  "can",
  "portion",
]);

/**
 * For every other unit (ml, g, mg, drops, cups…) the count is a reading of
 * a bottle, bag or tub by eye, so it can be off by a share of what is on
 * the shelf rather than by one.
 */
export const READ_MARGIN = 0.05;

/**
 * The floor: the smallest gap two counts can tell apart, in the item's own
 * unit — one of a counted unit, or READ_MARGIN of the larger count for a
 * read one. A gap no bigger than this is inside what the counts can get
 * wrong, so it is never marked, however large a share of the plan it is.
 * There is deliberately no absolute number here (decisions.md 2026-09-26:
 * units differ per item); the floor comes from the counts themselves.
 */
export function countMargin(pair: CountPair): number {
  if (COUNTED_UNITS.has(pair.to.unit)) return 1;
  return round2(Math.max(pair.from.counted_quantity, pair.to.counted_quantity, 0) * READ_MARGIN);
}

export type UsageReading =
  /** The unit changed between the counts, or since: no subtraction. */
  | { state: "unitChanged" }
  /** Both counts on one shelter day. */
  | { state: "sameDay" }
  /** The deliveries could not be read, so nothing is said. */
  | { state: "unknown" }
  /** Later count > earlier count + recorded deliveries: at least `missing` arrived unrecorded (or a miscount). */
  | { state: "unlogged"; missing: number }
  /** Used within GAP_RATIO of the plan. */
  | { state: "asPlanned"; used: number; gap: number }
  /**
   * Past GAP_RATIO (or nothing planned, or a little below zero), but no
   * further from the plan than `margin`, what the two counts can get
   * wrong. `gap` is used − planned, signed.
   */
  | { state: "withinCount"; used: number; gap: number; margin: number }
  /** Used `gap` more than planned. */
  | { state: "moreThanPlanned"; used: number; gap: number }
  /** Used `gap` less than planned, > 0. */
  | { state: "lessThanPlanned"; used: number; gap: number }
  /** Used some, and nothing was planned at all. */
  | { state: "usedUnplanned"; used: number }
  /** Used none, and nothing was planned: nothing to see. */
  | { state: "unchangedUnplanned" };

export function readUsage(
  pair: CountPair,
  between: Between | null,
  planned: number,
  /** The item's unit now: the forecast is in this unit. */
  currentUnit: string,
): UsageReading {
  if (pair.from.unit !== pair.to.unit || pair.to.unit !== currentUnit) return { state: "unitChanged" };
  if (planWindow(pair) == null) return { state: "sameDay" };
  if (between == null) return { state: "unknown" };
  if (between.used == null) return { state: "unitChanged" };

  // Rounded to the column's two places, so 0.1 + 0.2 style noise never
  // makes a held count read as used.
  const used = round2(between.used);
  const margin = countMargin(pair);
  const inMargin = (n: number) => Math.abs(n) <= margin + 1e-9;
  // Below zero by more than the counts can get wrong: something arrived
  // unrecorded. By less, it is a miscount, and reads as nothing used.
  if (used < 0 && !inMargin(used)) return { state: "unlogged", missing: -used };

  if (!(planned > 0)) {
    if (used === 0) return { state: "unchangedUnplanned" };
    return inMargin(used) ? { state: "withinCount", used, gap: used, margin } : { state: "usedUnplanned", used };
  }
  const gap = round2(Math.max(used, 0) - planned);
  if (Math.abs(gap) <= planned * GAP_RATIO + 1e-9) return { state: "asPlanned", used, gap };
  if (inMargin(gap)) return { state: "withinCount", used, gap, margin };
  return gap > 0
    ? { state: "moreThanPlanned", used, gap }
    : { state: "lessThanPlanned", used, gap: -gap };
}

/** Whether the row is one of the gaps the page exists to show. */
export function standsOut(reading: UsageReading): boolean {
  return (
    reading.state === "moreThanPlanned" ||
    reading.state === "lessThanPlanned" ||
    reading.state === "usedUnplanned" ||
    reading.state === "unlogged"
  );
}

/**
 * Used against the plan: the signed quantity (+ is more than planned) and
 * the same as a whole percentage of the plan. Null when there is nothing to
 * compare (unit change, same day, deliveries unknown, or unrecorded
 * deliveries that leave usage unknown). `percent` is null when nothing was
 * planned — a share of zero is not a number, and a dash says so better
 * than "∞%".
 */
export function difference(
  reading: UsageReading,
  planned: number | null,
): { quantity: number; percent: number | null } | null {
  let quantity: number;
  switch (reading.state) {
    case "asPlanned":
    case "withinCount":
    case "moreThanPlanned":
      quantity = reading.gap;
      break;
    case "lessThanPlanned":
      quantity = -reading.gap;
      break;
    case "usedUnplanned":
      quantity = reading.used;
      break;
    case "unchangedUnplanned":
      quantity = 0;
      break;
    default:
      return null;
  }
  const percent = planned != null && planned > 0 ? Math.round((quantity / planned) * 100) : null;
  // -0 would print as "-0%".
  return { quantity: round2(quantity) || 0, percent: percent === 0 ? 0 : percent };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * The item's stock_on_hand was written after the pair's latest count
 * without a history row — the single-cell edit on Management →
 * Medications / Diets (0093 records only stocktakes). Only meaningful when
 * `to` is the item's newest history row. A second's slack: a stocktake
 * stamps both with the same now(), but they travel as different strings.
 */
export function editedSince(pair: CountPair, stockCountedAt: string | null): boolean {
  if (!stockCountedAt) return false;
  return Date.parse(stockCountedAt) - Date.parse(pair.to.counted_at) > 1000;
}

/** A resident on a prescription / diet for this item. */
export type Assignment = {
  item_id: string;
  resident_id: string;
  start_date: string;
  end_date: string | null;
};

/**
 * Residents the forecast leaves out of this interval although they were
 * on this item during it: their status today is one the forecast excludes
 * (`excluded`: resident id → the date that status began), they moved to
 * it after the interval started, and their prescription / diet overlaps
 * the interval. Counted per item, each resident once.
 */
export function departedDuring(
  assignments: Assignment[],
  excluded: Map<string, string>,
  itemId: string,
  window: { from: string; to: string },
): number {
  const residents = new Set<string>();
  for (const a of assignments) {
    if (a.item_id !== itemId) continue;
    const leftOn = excluded.get(a.resident_id);
    if (leftOn == null || leftOn <= window.from) continue;
    if (a.start_date > window.to) continue;
    if (a.end_date != null && a.end_date < window.from) continue;
    residents.add(a.resident_id);
  }
  return residents.size;
}
