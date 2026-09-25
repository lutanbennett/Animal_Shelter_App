/**
 * Stock on hand and days-of-stock for Management → Medications and → Diets
 * (0083). Both tables carry the same three columns, so both pages read them
 * through here.
 *
 * Days-of-stock is never stored: it is computed at read time from the same
 * 30-day forecast the page shows beside it, so the two cannot disagree.
 * The count is a snapshot — the cupboard has been emptying since it was
 * taken — so the usage since `stock_counted_at` is taken off first, at the
 * forecast's daily rate.
 */

import { addDaysIso, todayIso } from "@/lib/format";

/** The forecast window the daily rate is read from. */
export const STOCK_RATE_DAYS = 30;

const MS_PER_DAY = 86_400_000;

export type StockFigures = {
  /** In the item's own unit. Null = never counted, which is not 0. */
  stock_on_hand: number | null;
  /** Set by trigger whenever stock_on_hand is written; null while it is null. */
  stock_counted_at: string | null;
  /** Supplier lead time in days. Null = never flagged. */
  reorder_lead_days: number | null;
};

export type StockReading = {
  /**
   * - `notCounted`: stock_on_hand is null — nobody has counted it.
   * - `out`: counted as 0.
   * - `runDown`: counted above 0, but the forecast says it has been used up
   *   since the count.
   * - `notUsed`: counted, and nothing is forecast in the next 30 days, so it
   *   does not run out.
   * - `days`: `daysLeft` whole days of stock from today.
   */
  state: "notCounted" | "out" | "runDown" | "notUsed" | "days";
  /** Whole days of stock left from today; 0 for out/runDown, null when not counted or not used. */
  daysLeft: number | null;
  /** Shelter date it runs out on (today + daysLeft), when it runs out at all. */
  runsOutOn: string | null;
  /** Shelter calendar days since the count; null when not counted. */
  countedDaysAgo: number | null;
  /** Days-of-stock is within the reorder lead time. */
  reorder: boolean;
};

function shelterDaysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / MS_PER_DAY);
}

/**
 * Reads one item's stock against its forecast use over the next
 * STOCK_RATE_DAYS days (in the same unit as stock_on_hand). `now` is
 * injectable so the arithmetic can be checked against fixed instants.
 */
export function readStock(
  figures: StockFigures,
  usedInRateWindow: number,
  now: number = Date.now(),
): StockReading {
  const { stock_on_hand: stock, stock_counted_at: countedAt, reorder_lead_days: leadDays } =
    figures;
  if (stock == null) {
    return { state: "notCounted", daysLeft: null, runsOutOn: null, countedDaysAgo: null, reorder: false };
  }

  const today = todayIso(now);
  const countedMs = countedAt ? Date.parse(countedAt) : now;
  const countedDaysAgo = Math.max(0, shelterDaysBetween(todayIso(countedMs), today));
  const flag = (daysLeft: number) => leadDays != null && daysLeft <= leadDays;

  if (stock <= 0) {
    return { state: "out", daysLeft: 0, runsOutOn: today, countedDaysAgo, reorder: flag(0) };
  }

  const perDay = usedInRateWindow / STOCK_RATE_DAYS;
  if (!(perDay > 0)) {
    return { state: "notUsed", daysLeft: null, runsOutOn: null, countedDaysAgo, reorder: false };
  }

  // Elapsed real time, not calendar days: a count taken this morning has
  // already lost this morning's doses by tonight.
  const elapsedDays = Math.max(0, (now - countedMs) / MS_PER_DAY);
  const remaining = stock - perDay * elapsedDays;
  if (remaining <= 0) {
    return { state: "runDown", daysLeft: 0, runsOutOn: today, countedDaysAgo, reorder: flag(0) };
  }

  const daysLeft = Math.floor(remaining / perDay);
  return {
    state: "days",
    daysLeft,
    runsOutOn: addDaysIso(today, daysLeft),
    countedDaysAgo,
    reorder: flag(daysLeft),
  };
}

/** PostgREST can return numeric as a string; normalise the three columns once. */
export function stockFiguresOf(row: {
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
  reorder_lead_days: number | null;
}): StockFigures {
  return {
    stock_on_hand: row.stock_on_hand == null ? null : Number(row.stock_on_hand),
    stock_counted_at: row.stock_counted_at,
    reorder_lead_days: row.reorder_lead_days,
  };
}

export type Parsed<T> = { ok: true; value: T } | { ok: false };

/**
 * A stock count as typed. Blank is a real answer — "not counted" (null) —
 * and is kept apart from 0, which means out of stock. Negative or not a
 * number is refused here, before the check constraint would.
 */
export function parseStockCount(raw: string | null | undefined): Parsed<number | null> {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: true, value: null };
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return { ok: false };
  return { ok: true, value: n };
}

/** Longest lead time accepted; also keeps a typo inside the integer column. */
export const MAX_LEAD_DAYS = 365;

/** A reorder lead time: blank = none (null), else whole days, 1 to MAX_LEAD_DAYS. */
export function parseLeadDays(raw: string | null | undefined): Parsed<number | null> {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: true, value: null };
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > MAX_LEAD_DAYS) return { ok: false };
  return { ok: true, value: n };
}
