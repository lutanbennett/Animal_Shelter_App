/**
 * The forecast windows the Management → Medications and → Diets tables
 * show: the fixed next-7 and next-30-day columns, plus an optional custom
 * From/To window from the page's query string (the picker above the
 * table). Shared so both pages read the same parameters the same way.
 */

export type ForecastWindow = {
  /** Inclusive ISO dates. */
  from: string;
  to: string;
  /** Fixed windows carry their length; the custom one is null. */
  days: number | null;
};

/** The fixed windows, in days from today inclusive. */
export const FIXED_FORECAST_DAYS = [7, 30] as const;

/** Longest custom window accepted, so a stray year-long range can't stall the query. */
const MAX_CUSTOM_DAYS = 366;

export function isoDatePlus(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}

export type ForecastWindowParams = {
  from?: string | string[];
  to?: string | string[];
};

/**
 * Reads the custom window from the query string. Returns the window, or
 * `invalid` when both parameters are present but don't make a usable
 * range (so the page can say so), or null when the picker is empty.
 */
export function parseCustomWindow(
  params: ForecastWindowParams,
): { window: ForecastWindow } | { invalid: true } | null {
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const to = Array.isArray(params.to) ? params.to[0] : params.to;
  if (!from && !to) return null;
  if (!isIsoDate(from) || !isIsoDate(to)) return { invalid: true };
  const days = daysBetween(from, to);
  if (days < 1 || days > MAX_CUSTOM_DAYS) return { invalid: true };
  return { window: { from, to, days: null } };
}

/** The fixed windows plus the custom one, in table order. */
export function forecastWindows(custom: ForecastWindow | null): ForecastWindow[] {
  const today = isoDatePlus(0);
  const fixed = FIXED_FORECAST_DAYS.map((days) => ({
    from: today,
    to: isoDatePlus(days - 1),
    days,
  }));
  return custom ? [...fixed, custom] : fixed;
}
