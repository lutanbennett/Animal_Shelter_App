/**
 * Whether a prescription's dose falls on a given day — the question the
 * medication list asks of every current prescription (docs/roles-and-
 * permissions.md §14: "Every 2 days and the like: show only on the days it
 * falls due, worked out from the start date").
 *
 * It mirrors prescription_doses_between() (0044) so the list and the
 * forecast never disagree about a weekly tablet: the first dose is on the
 * start date and the next is one interval later; month intervals are
 * calendar months counted from the start date, the 31st clamping to the end
 * of a short month.
 *
 * Plain data and no imports, so scripts/check-medication-list-due.mjs can
 * load this very file under Node's type stripping rather than a copy of it.
 */

export type DueSchedule = {
  doses_per_day: number | null;
  interval_count: number | null;
  interval_unit: "day" | "week" | "month" | null;
};

/**
 * `due` — a dose falls on this day. `notToday` — the schedule is real but
 * today is between doses. `asNeeded` — no schedule to work from (a doctor's
 * "as needed"), so the prescription is shown, never hidden.
 */
export type DueState = "due" | "notToday" | "asNeeded";

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

const daysBetween = (fromIso: string, toIso: string): number => {
  const [fy, fm, fd] = parts(fromIso);
  const [ty, tm, td] = parts(toIso);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
};

const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** `day` is a dose day of the schedule that began on `start` (both YYYY-MM-DD). */
export function doseDueState(start: string, schedule: DueSchedule | null, day: string): DueState {
  if (!schedule) return "asNeeded";
  if (schedule.doses_per_day != null) return "due";
  const count = schedule.interval_count;
  const unit = schedule.interval_unit;
  if (count == null || unit == null) return "asNeeded";

  const elapsed = daysBetween(start, day);
  if (elapsed < 0) return "notToday";

  if (unit === "day") return elapsed % count === 0 ? "due" : "notToday";
  if (unit === "week") return elapsed % (7 * count) === 0 ? "due" : "notToday";

  // Calendar months from the start date.
  const [sy, sm, sd] = parts(start);
  const [dy, dm, dd] = parts(day);
  const months = (dy - sy) * 12 + (dm - sm);
  if (months < 0 || months % count !== 0) return "notToday";
  return dd === Math.min(sd, daysInMonth(dy, dm)) ? "due" : "notToday";
}
