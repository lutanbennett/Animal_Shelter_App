/**
 * A utility bill is filed against the month it covers. The database keeps the FIRST of that month (utility_bills.covers_month,
 * 0305), so what a person picks as a month ("2026-10") is turned into "2026-10-01" here, whatever the screen showed.
 * Pure and client-safe.
 */
const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "2026-10" (a month input) or "2026-10-17" (any day in it) becomes "2026-10-01"; anything else is null. */
export function coversMonthDate(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  const m = MONTH.exec(v.slice(0, 7));
  if (!m || (v.length !== 7 && !/^\d{4}-\d{2}-\d{2}$/.test(v))) return null;
  return `${m[1]}-${m[2]}-01`;
}

/** The month input's value for a stored covers_month ("2026-10-01" gives "2026-10"). */
export function monthInputValue(date: string | null | undefined): string {
  return date && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : "";
}
