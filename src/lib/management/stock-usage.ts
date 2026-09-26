/**
 * Management → Stock between counts: how each item's count moved between
 * two stocktakes, beside what the prescriptions and diets planned for the
 * same dates (backlog "Actual usage from stocktakes", Lutan 2026-09-26).
 *
 * What this can and cannot say is the whole design, and it is set by
 * 0093_stock_counts.sql: the app knows two counts and the forecast, but
 * nothing records a delivery. So
 *
 *     used = previous count + received − new count
 *
 * has an unknown in it, and nothing here is called "actual usage".
 *   - A fall is the LEAST that left the cupboard — exactly it only if
 *     nothing arrived. So "fell more than planned" is solid: at least that
 *     much more went than the plan says.
 *   - A fall smaller than planned cannot be told apart: doses or meals not
 *     given, or a delivery nobody logged topping the shelf back up.
 *   - A rise is a delivery nobody logged (or a miscount). Usage over that
 *     interval cannot be read at all.
 * And the plan itself can read low for a past interval: medication_forecast
 * and diet_forecast only count residents by their status *today*, so an
 * animal adopted, fostered or died since was eating and taking medicine
 * over those dates but is not in the plan. Such rows carry `departed`, so
 * the page can say so beside a "more than planned" rather than let it read
 * as loss.
 *
 * Pure: no database, no i18n. `now` is never needed — dates come from the
 * counts. scripts/check-stock-usage.mjs runs the real exports.
 */

import { addDaysIso, todayIso } from "@/lib/format";

/** One stock_counts row (0093), normalised. */
export type CountRow = {
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

/**
 * How far a fall may sit from the plan before the row is marked. Loose on
 * purpose: counts are by eye, diets are estimates by size, and the page
 * is for spotting the big gaps the backlog item asked about.
 */
export const GAP_RATIO = 0.25;

export type UsageReading =
  /** The unit changed between the counts, or since: no subtraction. */
  | { state: "unitChanged" }
  /** Both counts on one shelter day. */
  | { state: "sameDay" }
  /** Count went up: stock arrived that was not logged. Usage unknown. */
  | { state: "rose"; rise: number }
  /** Fell (or held) within GAP_RATIO of the plan. */
  | { state: "asPlanned"; fall: number; gap: number }
  /** Fell more than planned: at least `gap` more left than planned. */
  | { state: "moreThanPlanned"; fall: number; gap: number }
  /** Fell less than planned (or held): `gap` is how far short, > 0. */
  | { state: "lessThanPlanned"; fall: number; gap: number }
  /** Fell, and nothing was planned at all. */
  | { state: "fellUnplanned"; fall: number }
  /** Held, and nothing was planned: nothing to see. */
  | { state: "unchangedUnplanned" };

export function readUsage(
  pair: CountPair,
  planned: number,
  /** The item's unit now: the forecast is in this unit. */
  currentUnit: string,
): UsageReading {
  if (pair.from.unit !== pair.to.unit || pair.to.unit !== currentUnit) return { state: "unitChanged" };
  if (planWindow(pair) == null) return { state: "sameDay" };

  // Rounded to the column's two places, so 0.1 + 0.2 style noise never
  // makes a held count read as a fall.
  const change = round2(pair.to.counted_quantity - pair.from.counted_quantity);
  if (change > 0) return { state: "rose", rise: change };
  const fall = -change;

  if (!(planned > 0)) {
    return fall > 0 ? { state: "fellUnplanned", fall } : { state: "unchangedUnplanned" };
  }
  const gap = round2(fall - planned);
  if (Math.abs(gap) <= planned * GAP_RATIO + 1e-9) return { state: "asPlanned", fall, gap };
  return gap > 0
    ? { state: "moreThanPlanned", fall, gap }
    : { state: "lessThanPlanned", fall, gap: -gap };
}

/** Whether the row is one of the gaps the page exists to show. */
export function standsOut(reading: UsageReading): boolean {
  return (
    reading.state === "moreThanPlanned" ||
    reading.state === "lessThanPlanned" ||
    reading.state === "fellUnplanned"
  );
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
