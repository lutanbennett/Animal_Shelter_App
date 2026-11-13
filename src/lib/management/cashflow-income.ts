/**
 * The income side of Management → Cashflow: what the shelter has actually
 * RECORDED as received, never a forecast of what it will receive.
 *
 * The outgoings on that page are a projection; donations are history. So the
 * rule (docs/decisions/2026-11-13-cashflow-income-side.md) is: show the last
 * INCOME_MONTHS complete calendar months as measured actuals, and one average
 * of them, labelled as a past average and drawn as a reference line, not as a
 * prediction. Nothing here guesses a future month.
 *
 * Pure: the page fetches, this folds.
 */

/** How many complete calendar months of recorded gifts are shown and averaged. */
export const INCOME_MONTHS = 6;

/** A donation as read from the register: its date and the amount on each line (null = a gift in kind). */
export type GiftRow = {
  received_on: string;
  donation_lines: { amount: number | string | null }[];
};

export type IncomeMonth = {
  /** First of the month, ISO. */
  month: string;
  /** Baht recorded that month, from priced lines only. */
  amount: number;
  /** Gifts that month with no figure (in kind), counted so they are not silently dropped. */
  inKind: number;
};

export type IncomeHistory = {
  months: IncomeMonth[];
  /** Average baht per month over `months`. */
  average: number;
  from: string;
  to: string;
};

function firstOfMonth(iso: string, offset: number): string {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return d.toISOString().slice(0, 10);
}

/** The window of complete months ending the day before the current month starts. */
export function incomeWindow(today: string): { from: string; to: string } {
  return { from: firstOfMonth(today, -INCOME_MONTHS), to: firstOfMonth(today, 0) };
}

/**
 * Amounts are summed in satang so floats cannot drift. A gift with several
 * lines counts once, by its `received_on`, for the sum of its priced lines.
 * `received_on` is `date not null` (0168), so there is no undated gift to place.
 */
export function incomeHistory(gifts: GiftRow[], today: string): IncomeHistory {
  const { from, to } = incomeWindow(today);
  const months: IncomeMonth[] = Array.from({ length: INCOME_MONTHS }, (_, i) => ({
    month: firstOfMonth(today, i - INCOME_MONTHS),
    amount: 0,
    inKind: 0,
  }));
  const satang = new Map<string, number>();
  for (const g of gifts) {
    const key = `${g.received_on.slice(0, 7)}-01`;
    const entry = months.find((m) => m.month === key);
    if (!entry) continue;
    const priced = g.donation_lines.filter((l) => l.amount != null);
    if (priced.length === 0) entry.inKind += 1;
    const sum = priced.reduce((s, l) => s + Math.round(Number(l.amount) * 100), 0);
    satang.set(key, (satang.get(key) ?? 0) + sum);
  }
  for (const m of months) m.amount = (satang.get(m.month) ?? 0) / 100;
  const average = months.reduce((s, m) => s + m.amount, 0) / months.length;
  return { months, average, from, to };
}
