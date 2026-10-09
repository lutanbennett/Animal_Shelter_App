import { addDaysIso } from "../format";
import type { CashflowRow } from "./cashflow";

/**
 * The clinic line of Management → Cashflow.
 *
 * Replaces the clinic rows `cashflow_forecast` (0072) returns, which charged
 * only the visits already booked at a flat estimate. Computed here, like
 * the fixed-outgoings rows (fixed-outgoings.ts), so the rule can change
 * without a migration; the page drops the RPC's clinic rows and folds these
 * in. Everything is pure and runs on shelter calendar dates.
 *
 * THE RULE, per week (Monday to Sunday):
 *
 *   visits = max(typical visits a week, visits booked that week)
 *   cost   = booked visits at their own cost where one is recorded,
 *            everything else (booked without a cost, and the visits
 *            expected but not yet booked) at the unit cost
 *
 * Booked visits are *inside* the count, not added on top of it: a week
 * with two booked and a typical 1.5 is two visits, not 3.5. A week with
 * one booked and a typical 1.5 is one booked visit at its own cost plus
 * half a visit at the unit cost.
 *
 * "Typical visits a week" is the completed visits of the last 90 days
 * divided by 90/7. The unit cost is the mean `cost` of those completed
 * visits that have one, once at least MIN_COSTED_FOR_MEAN do; below that
 * it is the flat estimate from site_content, because one invoice is an
 * anecdote, not a price.
 *
 * The page forecasts by month, so each week is clipped to the window,
 * counted whole, and then split: a booked visit lands in the month it
 * actually falls in, and the unbooked remainder is spread across the
 * months by days. Columns therefore add up to the window total, and a week
 * that straddles a month end is never counted twice. The typical rate is
 * only applied to days from today onward — the past is not a forecast.
 */

/** The history window, in days, and the lowest number of invoiced visits whose mean replaces the flat estimate. */
export const CLINIC_HISTORY_DAYS = 90;
export const MIN_COSTED_FOR_MEAN = 3;

export type ClinicVisit = {
  /** Shelter calendar date, YYYY-MM-DD. */
  date: string;
  /** clinic_visits.cost, or null while no invoice is recorded. */
  cost: number | null;
};

/** What the page prints under the table so the number can be accounted for. */
export type ClinicForecastBasis = {
  /** Typical visits per week, from history. 0 when there is none. */
  perWeek: number;
  /** Completed visits in the history window. 0 means "unknown", not "none needed". */
  historyVisits: number;
  /** Where the unit cost came from. `none` = no figure at all. */
  unitCostSource: "actual" | "estimate" | "none";
  unitCost: number | null;
  /** How many invoiced visits the mean was taken over (0 for `estimate`). */
  costedVisits: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function monthOf(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/** Monday of the week containing `date`. */
function weekStart(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDaysIso(date, -((dow + 6) % 7));
}

/** The unit cost and where it came from. */
export function clinicUnitCost(
  history: readonly ClinicVisit[],
  estimate: number | null,
): Pick<ClinicForecastBasis, "unitCost" | "unitCostSource" | "costedVisits"> {
  const costs = history.flatMap((v) => (v.cost == null ? [] : [v.cost]));
  if (costs.length >= MIN_COSTED_FOR_MEAN) {
    const mean = costs.reduce((a, b) => a + b, 0) / costs.length;
    return { unitCost: mean, unitCostSource: "actual", costedVisits: costs.length };
  }
  return estimate == null
    ? { unitCost: null, unitCostSource: "none", costedVisits: 0 }
    : { unitCost: estimate, unitCostSource: "estimate", costedVisits: 0 };
}

/**
 * `booked`: visits still scheduled, any date (only those in the window
 * count). `history`: completed visits in the last CLINIC_HISTORY_DAYS days.
 * `today` is the shelter's today.
 */
export function clinicForecast(args: {
  from: string;
  to: string;
  today: string;
  booked: readonly ClinicVisit[];
  history: readonly ClinicVisit[];
  estimate: number | null;
}): { rows: CashflowRow[]; basis: ClinicForecastBasis } {
  const { from, to, today, booked, history, estimate } = args;
  const perWeek = history.length / (CLINIC_HISTORY_DAYS / 7);
  const unit = clinicUnitCost(history, estimate);

  type Acc = { amount: number; missing: number; booked: number; bookedCosted: number; filler: number };
  const months = new Map<string, Acc>();
  const acc = (month: string) => {
    let a = months.get(month);
    if (!a) months.set(month, (a = { amount: 0, missing: 0, booked: 0, bookedCosted: 0, filler: 0 }));
    return a;
  };
  // Every month the window touches gets a row, empty or not.
  for (let d = from; d <= to; d = addDaysIso(d, 1)) acc(monthOf(d));

  for (let ws = weekStart(from); ws <= to; ws = addDaysIso(ws, 7)) {
    const lo = ws < from ? from : ws;
    const hiFull = addDaysIso(ws, 6);
    const hi = hiFull > to ? to : hiFull;

    const inWeek = booked.filter((v) => v.date >= lo && v.date <= hi);
    const futureDays = Math.max(0, Math.round((Date.parse(hi) - Date.parse(lo < today ? today : lo)) / 86_400_000) + 1);
    const expected = hi < today ? 0 : (perWeek * Math.min(futureDays, 7)) / 7;
    const filler = Math.max(0, expected - inWeek.length);

    for (const v of inWeek) {
      const a = acc(monthOf(v.date));
      a.booked += 1;
      const cost = v.cost ?? unit.unitCost;
      if (v.cost != null) a.bookedCosted += 1;
      if (cost == null) a.missing += 1;
      else a.amount += cost;
    }

    if (filler > 0) {
      // Spread the unbooked remainder over the days it could fall on.
      const days: string[] = [];
      for (let d = lo < today ? today : lo; d <= hi; d = addDaysIso(d, 1)) days.push(d);
      for (const d of days) {
        const a = acc(monthOf(d));
        const share = filler / days.length;
        a.filler += share;
        if (unit.unitCost != null) a.amount += share * unit.unitCost;
      }
    }
  }

  const rows: CashflowRow[] = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, a]) => {
      // Without a unit cost the expected visits cannot be priced: say so
      // as a gap rather than printing a zero.
      const unpricedFiller = unit.unitCost == null && a.filler > 0.005 ? Math.max(1, Math.round(a.filler)) : 0;
      return {
        category: "clinic",
        month,
        amount: round2(a.amount),
        // Only a month made entirely of invoiced booked visits is `actual`.
        basis: a.booked > 0 && a.bookedCosted === a.booked && a.filler < 0.005 ? "actual" : "estimated",
        missing_prices: a.missing + unpricedFiller,
      };
    });

  return {
    rows,
    basis: {
      perWeek,
      historyVisits: history.length,
      unitCost: unit.unitCost,
      unitCostSource: unit.unitCostSource,
      costedVisits: unit.costedVisits,
    },
  };
}
