/**
 * Deliveries (/deliveries): one stock_receipts row (0096) per delivery of
 * one item, the missing "received" in
 *
 *     used = previous count + received âˆ’ new count
 *
 * that Management â†’ Stock between counts reads through the
 * stock_count_intervals view.
 *
 * The one rule with teeth is WHEN a delivery happened. The view puts a
 * delivery in the interval with previous.counted_at < received_at <=
 * next.counted_at, so a delivery must land on the right side of every
 * stocktake of its item. The form asks for a day, not a time; this file
 * turns the day into an instant:
 *   - today, no count of the item today: now â€” it is being recorded as it
 *     is unpacked, and a count taken later today will see it.
 *   - an earlier day with no count of the item that day: midday at the
 *     shelter. Any instant that day is on the same side of every count.
 *   - any day the item WAS counted: the person says whether the delivery
 *     was on the shelf when it was counted. "Before" is the earliest count's
 *     own instant (the right-hand end is closed, so it is inside the
 *     interval that count ends); "after" is a second past the latest count
 *     that day â€” or now, if that is later.
 * A future day is refused: a delivery is recorded once it has arrived.
 *
 * Pure: no database, no i18n. scripts/check-stock-deliveries.mjs runs it.
 */

import { todayIso } from "@/lib/format";

/** Who records a delivery: 0096's write policy. Volunteers count but do not. */
export const DELIVERY_ROLES = ["admin", "management", "staff"] as const;

export function canRecordDelivery(role: string | null | undefined): boolean {
  return role != null && (DELIVERY_ROLES as readonly string[]).includes(role);
}

export type DeliveryKind = "medication" | "diet";

/** Whether the delivery was on the shelf when that day's stocktake counted it. */
export type DeliveryTiming = "before" | "after";

export type ReceivedAt =
  /** Leave received_at to the column default, now(). */
  | { ok: true; value: null }
  | { ok: true; value: string }
  | { ok: false; reason: "dateInvalid" | "future" | "needsTiming" };

/**
 * `countedAt` is every counted_at of THIS item (any day; the ones on `date`
 * are picked out here). `now` is a parameter so the check script can pin it.
 */
export function receivedAtFor(
  date: string,
  countedAt: string[],
  timing: DeliveryTiming | null,
  now: number = Date.now(),
): ReceivedAt {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return { ok: false, reason: "dateInvalid" };
  }
  const today = todayIso(now);
  if (date > today) return { ok: false, reason: "future" };

  const thatDay = countedAt
    .filter((at) => todayIso(Date.parse(at)) === date)
    .map((at) => Date.parse(at))
    .sort((a, b) => a - b);

  if (thatDay.length === 0) {
    return date === today ? { ok: true, value: null } : { ok: true, value: `${date}T12:00:00+07:00` };
  }
  if (timing == null) return { ok: false, reason: "needsTiming" };
  if (timing === "before") return { ok: true, value: new Date(thatDay[0]).toISOString() };
  const afterLast = thatDay[thatDay.length - 1] + 1000;
  // Today, now is already past the count (bar the second's slack).
  if (date === today && now > afterLast) return { ok: true, value: null };
  return { ok: true, value: new Date(afterLast).toISOString() };
}

/**
 * Which side of that day's stocktake a recorded delivery fell, for the
 * recent list: on a day the item was counted the time shown can equal the
 * count's own minute, so the time alone cannot say. Mirrors receivedAtFor:
 * "before" is at or before the day's first count (the closed end of the
 * interval it ends), "after" is past the day's last. "between" only when
 * the item was counted more than once that day and the delivery sits
 * between two of them. Null on a day the item was not counted.
 */
export type CountSide = "before" | "after" | "between";

export function sideOfCount(receivedAt: string, countedAt: string[]): CountSide | null {
  const at = Date.parse(receivedAt);
  const day = todayIso(at);
  const thatDay = countedAt
    .filter((c) => todayIso(Date.parse(c)) === day)
    .map((c) => Date.parse(c))
    .sort((a, b) => a - b);
  if (thatDay.length === 0) return null;
  if (at <= thatDay[0]) return "before";
  if (at > thatDay[thatDay.length - 1]) return "after";
  return "between";
}

/** The shelter days each item was counted on, for the form's before/after question. */
export function countDaysByItem(rows: { item_id: string; counted_at: string }[]): Record<string, string[]> {
  const days: Record<string, string[]> = {};
  for (const row of rows) {
    const day = todayIso(Date.parse(row.counted_at));
    const list = (days[row.item_id] ??= []);
    if (!list.includes(day)) list.push(day);
  }
  return days;
}

type Parsed<T> = { ok: true; value: T } | { ok: false };

/** A delivered quantity in the item's unit: a number above 0 (0096's check). */
export function parseDeliveryQuantity(raw: string | null | undefined): Parsed<number> {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: false };
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return { ok: false };
  return { ok: true, value: n };
}

/**
 * "2 boxes of 50" â†’ 100, for the form's pack helper. Null unless both are
 * numbers above 0; rounded to the column's sensible precision so 3 Ã— 0.1
 * does not save as 0.30000000000000004.
 */
export function packTotal(packs: string, perPack: string): number | null {
  const a = Number(packs.trim());
  const b = Number(perPack.trim());
  if (!packs.trim() || !perPack.trim() || !(a > 0) || !(b > 0)) return null;
  return Math.round(a * b * 1000) / 1000;
}
