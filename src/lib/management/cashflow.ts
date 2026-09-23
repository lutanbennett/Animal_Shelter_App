import { isoDatePlus, parseCustomWindow, type ForecastWindow, type ForecastWindowParams } from "./forecast-window";

/**
 * Management → Cashflow: the shape of what `cashflow_forecast` (0072)
 * returns, and the arithmetic the page and its chart share.
 *
 * Everything here is pure. The server component fetches, this folds the
 * rows into a month × category grid, and the client component re-folds the
 * same grid whenever a category is toggled off — so the chart, the table
 * and the totals above them can never disagree about what is showing.
 */

/**
 * The five categories, in stack order (bottom of the column first). This
 * order is also the order the series colours were colour-blind checked in,
 * so changing it means re-running that check — see the --series-* tokens in
 * globals.css.
 */
export const CASHFLOW_CATEGORIES = [
  "food",
  "medication",
  "immunization",
  "vet",
  "maintenance",
] as const;

export type CashflowCategory = (typeof CASHFLOW_CATEGORIES)[number];

/** How an amount was arrived at; the page labels each one. */
export type CashflowBasis = "priced" | "estimated" | "actual";

/** The CSS variable carrying each category's colour. */
export const CATEGORY_FILL: Record<CashflowCategory, string> = {
  food: "var(--series-food)",
  medication: "var(--series-medication)",
  immunization: "var(--series-immunization)",
  vet: "var(--series-vet)",
  maintenance: "var(--series-maintenance)",
};

/**
 * Where the missing price is entered. The table turns a "not priced yet"
 * count into a link here, so the fix is one click from the gap rather than
 * something the reader has to go and find.
 */
export const CATEGORY_PRICE_PATH: Record<CashflowCategory, string> = {
  food: "/management/diets",
  medication: "/management/medications",
  immunization: "/admin/immunization-types",
  // The vet figure is the flat typical-visit estimate, edited beside the
  // other site settings rather than per visit.
  vet: "/admin/website",
  maintenance: "/maintenance",
};

/**
 * The fixed windows this page offers. Deliberately *not*
 * FIXED_FORECAST_DAYS from forecast-window.ts: that constant is the 7/30
 * the Medications and Diets tables draw as columns, and those pages would
 * change shape if it moved. A cashflow window is a month or a quarter —
 * 7 days of outgoings is not a useful figure — so this page carries its
 * own two and reuses the picker and the parser unchanged.
 */
export const CASHFLOW_FIXED_DAYS = [30, 90] as const;

/** A row exactly as cashflow_forecast returns it. */
export type CashflowRow = {
  category: string;
  month: string;
  // numeric and bigint both arrive from PostgREST as strings often enough
  // to normalise here rather than trust either.
  amount: number | string | null;
  basis: string;
  missing_prices: number | string | null;
};

export type CashflowCell = {
  amount: number;
  /** Items in this month the shelter owns but cannot price. */
  missing: number;
  basis: CashflowBasis;
};

export type CashflowMonth = {
  /** First of the month, ISO. */
  month: string;
  cells: Record<CashflowCategory, CashflowCell>;
};

function isCategory(value: string): value is CashflowCategory {
  return (CASHFLOW_CATEGORIES as readonly string[]).includes(value);
}

function toBasis(value: string): CashflowBasis {
  return value === "estimated" || value === "actual" ? value : "priced";
}

function num(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function emptyCells(): Record<CashflowCategory, CashflowCell> {
  return Object.fromEntries(
    CASHFLOW_CATEGORIES.map((c) => [c, { amount: 0, missing: 0, basis: "priced" as CashflowBasis }]),
  ) as Record<CashflowCategory, CashflowCell>;
}

/**
 * Folds the flat rows into one entry per month, oldest first, with every
 * category present. The function already returns a full grid, but a month
 * with no row at all would otherwise punch a hole in the chart, so missing
 * combinations become an explicit zero here.
 */
export function buildCashflowMonths(rows: CashflowRow[]): CashflowMonth[] {
  const byMonth = new Map<string, CashflowMonth>();
  for (const row of rows) {
    if (!isCategory(row.category)) continue;
    const month = row.month.slice(0, 10);
    let entry = byMonth.get(month);
    if (!entry) {
      entry = { month, cells: emptyCells() };
      byMonth.set(month, entry);
    }
    entry.cells[row.category] = {
      amount: num(row.amount),
      missing: num(row.missing_prices),
      basis: toBasis(row.basis),
    };
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** What one month adds up to across the categories still switched on. */
export function monthTotal(month: CashflowMonth, shown: ReadonlySet<CashflowCategory>): number {
  let total = 0;
  for (const category of CASHFLOW_CATEGORIES) {
    if (shown.has(category)) total += month.cells[category].amount;
  }
  return total;
}

/** What one category adds up to across the whole window. */
export function categoryTotal(months: CashflowMonth[], category: CashflowCategory): CashflowCell {
  let amount = 0;
  let missing = 0;
  // A category's basis over the window is the weakest month's: a quarter
  // where one month is still an estimate is an estimate. `actual` only
  // survives if every month earned it.
  let sawEstimated = false;
  let sawActual = false;
  let sawPriced = false;
  for (const month of months) {
    const cell = month.cells[category];
    amount += cell.amount;
    missing += cell.missing;
    if (cell.basis === "estimated") sawEstimated = true;
    else if (cell.basis === "actual") sawActual = true;
    else sawPriced = true;
  }
  const basis: CashflowBasis = sawEstimated
    ? "estimated"
    : sawActual && !sawPriced
      ? "actual"
      : "priced";
  return { amount, missing, basis };
}

/** The whole window, across the categories still switched on. */
export function windowTotal(
  months: CashflowMonth[],
  shown: ReadonlySet<CashflowCategory>,
): { amount: number; missing: number } {
  let amount = 0;
  let missing = 0;
  for (const month of months) {
    for (const category of CASHFLOW_CATEGORIES) {
      if (!shown.has(category)) continue;
      amount += month.cells[category].amount;
      missing += month.cells[category].missing;
    }
  }
  return { amount, missing };
}

export type CashflowWindowParams = ForecastWindowParams & { days?: string | string[] };

/**
 * The window the page is showing. Unlike the Diets and Medications tables,
 * which draw every window as a column side by side, this page shows one
 * window at a time: the 30 or 90-day button, or a custom From/To that
 * overrides it. `invalid` carries a half-filled picker through so the page
 * can say so while still rendering the default window.
 */
export function resolveCashflowWindow(params: CashflowWindowParams): {
  window: ForecastWindow;
  invalid: boolean;
} {
  const custom = parseCustomWindow(params);
  if (custom && "window" in custom) return { window: custom.window, invalid: false };

  const raw = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = CASHFLOW_FIXED_DAYS.find((d) => String(d) === raw) ?? CASHFLOW_FIXED_DAYS[0];
  return {
    window: { from: isoDatePlus(0), to: isoDatePlus(days - 1), days },
    invalid: custom != null && "invalid" in custom,
  };
}
