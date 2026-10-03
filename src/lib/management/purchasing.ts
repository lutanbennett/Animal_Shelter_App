/**
 * Management → Purchasing: how much of each medicine and food to buy for a
 * period, so whoever orders does not do the arithmetic by hand (backlog,
 * Lutan 2026-09-28). Per item, in its BASE unit (0118):
 *
 *     expected now = last count − used since + received since   (stock.ts)
 *     needed       = forecast use over [lead time + period] + safety stock
 *     buy          = needed − expected now, never below 0,
 *                    rounded up to a whole pack where a purchase unit is set
 *
 * "Expected now" is NOT re-derived here: expectedStockNow() in stock.ts is
 * the one helper Medications' and Diets' days-of-stock read as well.
 *
 * An item nobody has counted is assumed to have NOTHING on the shelf, and is
 * flagged `notCounted` so it never passes for a worked-out figure (Lutan,
 * 2026-10-04: a new prescription's medicine is on no shelf and would otherwise
 * never be bought; supersedes docs/decisions/2026-10-02-purchasing-page.md's
 * no-guess rule). It stops being assumed the moment a count exists. A count
 * older than STALE_COUNT_DAYS is flagged, not refused.
 *
 * Pure: no database, no i18n. scripts/check-purchasing.mjs runs it.
 */

import { isoDatePlus } from "@/lib/management/forecast-window";
import { expectedStockNow, parseSafetyStock, STOCK_RATE_DAYS } from "@/lib/management/stock";
import { resolveEntered, type UnitConversion } from "@/lib/units";

/** The period choices, in days from today. */
export const PURCHASE_PERIOD_DAYS = [7, 14, 30] as const;
export const DEFAULT_PURCHASE_PERIOD = 7;

/** A count older than this many days is "unreliable": the cupboard has moved on. */
export const STALE_COUNT_DAYS = 21;

/** `?days=14`; anything else falls back to the default rather than erroring. */
export function parsePeriod(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return (PURCHASE_PERIOD_DAYS as readonly number[]).includes(n) ? n : DEFAULT_PURCHASE_PERIOD;
}

/**
 * `?lead=off` leaves the supplier lead time out of the period. Included by
 * default: stock ordered today arrives `lead` days from now, and the period
 * is meant to be covered from arrival (docs/decisions/2026-10-02-purchasing-page.md).
 */
export function parseIncludeLead(raw: string | string[] | undefined): boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value !== "off";
}

/**
 * The days of forecast use one item needs: the period, plus its own lead
 * time when included. Whole days from today, inclusive — so a 7-day period
 * with no lead is today..today+6, the same window the 7-day forecast column
 * shows.
 */
export function windowDaysFor(period: number, leadDays: number | null, includeLead: boolean): number {
  return period + (includeLead && leadDays != null && leadDays > 0 ? leadDays : 0);
}

/** The forecast window [today, today + days − 1] as ISO dates. */
export function purchaseWindow(days: number): { from: string; to: string } {
  return { from: isoDatePlus(0), to: isoDatePlus(days - 1) };
}

export type SafetyStockResolved =
  | { ok: true; value: number | null }
  | { ok: false; reason: "invalid" | "unknownUnit" };

/**
 * A safety stock typed in the base unit or in one of the item's other units
 * (2 bags), as the number to store: always BASE units (0128). Blank is
 * null, "no floor"; 0 stays 0. The factor in force now converts it, once,
 * on save — like a delivery — and is never looked up again.
 */
export function resolveSafetyStock(
  raw: string | null | undefined,
  unitName: string | null | undefined,
  conversions: UnitConversion[],
  baseNames: string[],
): SafetyStockResolved {
  const parsed = parseSafetyStock(raw);
  if (!parsed.ok) return { ok: false, reason: "invalid" };
  if (parsed.value == null) return { ok: true, value: null };
  const resolved = resolveEntered(parsed.value, unitName, conversions, baseNames);
  if (!resolved.ok) return { ok: false, reason: resolved.reason === "unknownUnit" ? "unknownUnit" : "invalid" };
  return { ok: true, value: resolved.base };
}

export type PurchaseInput = {
  id: string;
  name: string;
  /** Last count in base units; null = never counted. */
  counted: number | null;
  countedAt: string | null;
  /** Forecast use over the 30-day rate window — the rate "used since" is read at. */
  usedInRateWindow: number;
  /** Forecast use over this item's own window (period + lead). */
  usedInWindow: number;
  windowDays: number;
  /** Deliveries recorded after the count, base units. */
  receivedSince: number;
  /** Null = no floor; 0 = a floor of nothing. Both add nothing to `needed`. */
  safetyStock: number | null;
  /** Base units in one purchase unit; null = no pack known. */
  packBase: number | null;
};

export type PurchaseRow = {
  id: string;
  name: string;
  /** "notCounted": nothing on the shelf is assumed, so the whole need is bought. */
  state: "notCounted" | "ok";
  counted: number | null;
  countedAt: string | null;
  countedDaysAgo: number | null;
  stale: boolean;
  usedSince: number;
  receivedSince: number;
  /** Raw expected stock; negative when forecast use has outrun the count. */
  expected: number | null;
  windowDays: number;
  periodUse: number;
  safetyStock: number | null;
  needed: number;
  /** Shortfall before pack rounding. When not counted, all of `needed`. */
  shortfall: number | null;
  /** Whole packs to buy, when a pack is known and something is needed. */
  packs: number | null;
  /** What to buy, base units, after pack rounding. */
  buy: number | null;
};

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
/** Up to 2 places: 2.301 → 2.31, never down. The epsilon stops 2.3 → 2.31. */
const ceil2 = (n: number) => Math.ceil(n * 100 - 1e-9) / 100;

export function purchaseRow(input: PurchaseInput, now: number = Date.now()): PurchaseRow {
  const safety = input.safetyStock != null && input.safetyStock > 0 ? input.safetyStock : 0;
  const needed = round6(input.usedInWindow + safety);
  const base = {
    id: input.id,
    name: input.name,
    windowDays: input.windowDays,
    periodUse: input.usedInWindow,
    safetyStock: input.safetyStock,
    needed,
  };

  const rounded = (shortfall: number) => {
    if (shortfall > 0 && input.packBase != null && input.packBase > 0) {
      const packs = Math.ceil(shortfall / input.packBase - 1e-9);
      return { packs, buy: round6(packs * input.packBase) };
    }
    return { packs: null, buy: shortfall > 0 ? ceil2(shortfall) : shortfall };
  };

  if (input.counted == null) {
    // Never counted: assume none on the shelf, so the whole need is bought.
    const shortfall = needed;
    return {
      ...base,
      state: "notCounted",
      counted: null,
      countedAt: null,
      countedDaysAgo: null,
      stale: false,
      usedSince: 0,
      receivedSince: 0,
      expected: null,
      shortfall,
      ...rounded(shortfall),
    };
  }

  const perDay = input.usedInRateWindow / STOCK_RATE_DAYS;
  const stock = expectedStockNow(input.counted, input.countedAt, perDay, input.receivedSince, now);
  // The shelf cannot hold less than nothing: a count used up on paper is 0.
  const onHand = Math.max(0, stock.expected);
  const shortfall = Math.max(0, round6(needed - onHand));
  const { packs, buy } = rounded(shortfall);

  return {
    ...base,
    state: "ok",
    counted: input.counted,
    countedAt: input.countedAt,
    countedDaysAgo: stock.countedDaysAgo,
    stale: stock.countedDaysAgo > STALE_COUNT_DAYS,
    usedSince: stock.usedSince,
    receivedSince: stock.receivedSince,
    expected: stock.expected,
    shortfall,
    packs,
    buy,
  };
}

/** A receipt, reduced to what the sums need. */
export type ReceiptFigure = {
  item_id: string;
  quantity: number;
  received_at: string;
  supplier_contact_id: string | null;
};

/**
 * Deliveries strictly after each item's count (0096: a delivery belongs to
 * the interval with previous.counted_at < received_at). An item never
 * counted has no count to add to, so it is left out.
 */
export function receivedSinceCount(
  receipts: ReceiptFigure[],
  countedAt: Map<string, string | null>,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const r of receipts) {
    const at = countedAt.get(r.item_id);
    if (!at || !(Date.parse(r.received_at) > Date.parse(at))) continue;
    totals.set(r.item_id, round6((totals.get(r.item_id) ?? 0) + r.quantity));
  }
  return totals;
}

/** The supplier of each item's most recent delivery that named one. */
export function usualSuppliers(receipts: ReceiptFigure[]): Map<string, string> {
  const latest = new Map<string, { at: number; supplier: string }>();
  for (const r of receipts) {
    if (!r.supplier_contact_id) continue;
    const at = Date.parse(r.received_at);
    const have = latest.get(r.item_id);
    if (!have || at > have.at) latest.set(r.item_id, { at, supplier: r.supplier_contact_id });
  }
  return new Map([...latest].map(([item, v]) => [item, v.supplier]));
}

export type ShoppingLine = {
  kind: "medication" | "diet";
  name: string;
  /** True when nobody has counted the item: nothing on the shelf is assumed. */
  notCounted?: boolean;
  /** What to buy, in the purchase unit when there is one, else base. */
  quantity: number;
  unit: string;
  /** The same in base units, always. */
  baseQuantity: number;
  baseUnit: string;
  supplier: string | null;
};

export type ShoppingGroup = { supplier: string | null; lines: ShoppingLine[] };

/**
 * The list taken to the wholesaler: only items with something to buy,
 * grouped by usual supplier (A–Z, "no usual supplier" last), items within a
 * group as given — the caller orders special diets before the standard one.
 */
export function groupBySupplier(lines: ShoppingLine[]): ShoppingGroup[] {
  const groups = new Map<string | null, ShoppingLine[]>();
  for (const line of lines) {
    const list = groups.get(line.supplier) ?? [];
    list.push(line);
    groups.set(line.supplier, list);
  }
  return [...groups]
    .map(([supplier, items]) => ({ supplier, lines: items }))
    .sort((a, b) => {
      if (a.supplier == null) return 1;
      if (b.supplier == null) return -1;
      return a.supplier.localeCompare(b.supplier);
    });
}
