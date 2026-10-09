import type { CashflowRow } from "./cashflow";

/**
 * Fixed outgoings (0114): the named monthly costs — Rent, Electricity,
 * Salaries as ONE total line — that the cashflow forecast adds to what the
 * shelter's records imply. Pure functions only; the page fetches.
 *
 * This is not payroll and nothing here should grow toward it. A line is a
 * named cost, never a person, and the table refuses a 25th line
 * (docs/decisions/2026-09-29-fixed-outgoings-not-payroll.md).
 */

/** The trigger's cap in 0114, mirrored so the UI can say so before a save fails. */
export const MAX_FIXED_OUTGOINGS = 24;

/** A row as `fixed_outgoings` returns it. */
export type FixedOutgoing = {
  id: string;
  label: string;
  /** Display only (0166): the label a Thai reader sees, when written. */
  label_th: string | null;
  monthly_amount: number | string;
  note: string | null;
  active: boolean;
  /** First of a month, ISO, or null = from the beginning. */
  starts_on: string | null;
  /** First of the LAST month included, ISO, or null = open-ended. */
  ends_on: string | null;
};

/** What the editor sends, as strings from inputs. Months are `YYYY-MM` from <input type="month">. */
export type FixedOutgoingFields = {
  label: string;
  labelTh: string;
  monthlyAmount: string;
  note: string;
  active: boolean;
  startsMonth: string;
  endsMonth: string;
};

export type FixedOutgoingError =
  | "labelRequired"
  | "amountInvalid"
  | "monthInvalid"
  | "rangeReversed";

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** `YYYY-MM` → the first of that month, ISO; "" → null; anything else → undefined. */
function monthToDate(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return MONTH.test(trimmed) ? `${trimmed}-01` : undefined;
}

/** The row to write, or the reason it cannot be. */
export function parseFixedOutgoing(
  fields: FixedOutgoingFields,
):
  | {
      ok: true;
      row: {
        label: string;
        label_th: string | null;
        monthly_amount: number;
        note: string | null;
        active: boolean;
        starts_on: string | null;
        ends_on: string | null;
      };
    }
  | { ok: false; error: FixedOutgoingError } {
  const label = fields.label.trim();
  if (!label) return { ok: false, error: "labelRequired" };

  const amountText = fields.monthlyAmount.trim();
  const amount = Number(amountText);
  // numeric(12,2): ten digits before the point, never negative.
  if (!amountText || !Number.isFinite(amount) || amount < 0 || amount >= 1e10) {
    return { ok: false, error: "amountInvalid" };
  }

  const starts_on = monthToDate(fields.startsMonth);
  const ends_on = monthToDate(fields.endsMonth);
  if (starts_on === undefined || ends_on === undefined) {
    return { ok: false, error: "monthInvalid" };
  }
  if (starts_on && ends_on && ends_on < starts_on) {
    return { ok: false, error: "rangeReversed" };
  }

  return {
    ok: true,
    row: {
      label,
      label_th: fields.labelTh.trim() || null,
      monthly_amount: Math.round(amount * 100) / 100,
      note: fields.note.trim() || null,
      active: fields.active,
      starts_on,
      ends_on,
    },
  };
}

function daysInMonth(year: number, month1: number) {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/**
 * The fixed outgoings as `cashflow_forecast`-shaped rows (category
 * "fixed"), one per month the window touches — the same months the
 * function returns, so the page folds them with everything else.
 *
 * PRO-RATA BY DAY, matching the function. cashflow_forecast slices the
 * window per month (a window starting on the 20th counts only days 20–end
 * of that month for food, medication and the rest, so the columns add up
 * to the window total). A fixed monthly amount follows the same rule: it
 * counts `days in window ÷ days in month` of the amount. A 30-day window
 * therefore carries about one month of rent, not two whole ones; a window
 * covering a whole calendar month carries exactly one. Whether a *line*
 * applies is decided by month (starts_on / ends_on are firsts of months),
 * so a line ended in September has nothing in October at all.
 *
 * Always `priced`: the amount is what someone entered, and a fixed line has
 * no "unpriced" state, so missing_prices is 0.
 */
export function fixedOutgoingRows(
  lines: readonly FixedOutgoing[],
  from: string,
  to: string,
): CashflowRow[] {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const rows: CashflowRow[] = [];

  for (let y = fy, m = fm; y < ty || (y === ty && m <= tm); m === 12 ? ((m = 1), y++) : m++) {
    const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
    const dim = daysInMonth(y, m);
    const monthEnd = `${y}-${String(m).padStart(2, "0")}-${String(dim).padStart(2, "0")}`;
    const sliceFrom = from > monthStart ? from : monthStart;
    const sliceTo = to < monthEnd ? to : monthEnd;
    const days = Number(sliceTo.slice(8)) - Number(sliceFrom.slice(8)) + 1;

    let amount = 0;
    for (const line of lines) {
      if (!line.active) continue;
      if (line.starts_on && line.starts_on > monthStart) continue;
      if (line.ends_on && line.ends_on < monthStart) continue;
      amount += (Number(line.monthly_amount) * days) / dim;
    }

    rows.push({
      category: "fixed",
      month: monthStart,
      amount: Math.round(amount * 100) / 100,
      basis: "priced",
      missing_prices: 0,
    });
  }
  return rows;
}
