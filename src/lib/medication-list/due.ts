/**
 * Whether a prescription's dose falls on a given day — the question the
 * medication list asks of every current prescription (docs/roles-and-
 * permissions.md §14: "Every 2 days and the like: show only on the days it
 * falls due, worked out from the start date").
 *
 * Reads the prescription's own schedule (0283) — which days, as chosen on the
 * form — by the same rule the stock forecast counts with
 * (prescription_dose_days_between(), 0284), so the list and the forecast
 * never disagree about a day. The frequency is no longer read.
 *
 * Plain data and no imports, so scripts/check-medication-list-due.mjs can
 * load this very file under Node's type stripping rather than a copy of it.
 */

export type ScheduleUnit = "day" | "week" | "month";

/** The prescriptions.schedule_* columns. Every field null = as needed (no schedule). */
export type RxSchedule = {
  schedule_unit: ScheduleUnit | null;
  schedule_every: number | null;
  /** ISO weekdays, 1 (Mon) .. 7 (Sun); null = the start date's weekday. */
  schedule_weekdays: number[] | null;
  /** Days of the month 1 .. 31; null = the start date's day. A day the month lacks is its last day. */
  schedule_month_days: number[] | null;
};

export type DueSchedule = RxSchedule;

/**
 * `due` — a dose falls on this day. `notToday` — the schedule is real but
 * today is not one of its days. `asNeeded` — no schedule to work from (a doctor's
 * "as needed"), so the prescription is shown, never hidden.
 */
export type DueState = "due" | "notToday" | "asNeeded";

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

const utc = (iso: string): number => {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
};

const daysBetween = (fromIso: string, toIso: string): number => Math.round((utc(toIso) - utc(fromIso)) / 86_400_000);

const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** ISO weekday of a YYYY-MM-DD date: 1 (Mon) .. 7 (Sun). */
export function isoWeekday(iso: string): number {
  const dow = new Date(utc(iso)).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** The weekdays the schedule falls on (the start date's when none are stored). */
export function weekdaysOf(s: RxSchedule, start: string): number[] {
  return s.schedule_weekdays && s.schedule_weekdays.length > 0 ? s.schedule_weekdays : [isoWeekday(start)];
}

/** The days of the month the schedule falls on (the start date's when none are stored). */
export function monthDaysOf(s: RxSchedule, start: string): number[] {
  return s.schedule_month_days && s.schedule_month_days.length > 0 ? s.schedule_month_days : [parts(start)[2]];
}

/** Does a dose day of the schedule that began on `start` land on `day` (both YYYY-MM-DD)? */
export function isScheduledDay(start: string, s: RxSchedule, day: string): boolean {
  const unit = s.schedule_unit;
  const every = s.schedule_every;
  if (unit == null || every == null || every < 1) return false;
  const elapsed = daysBetween(start, day);
  if (elapsed < 0) return false;

  if (unit === "day") return elapsed % every === 0;

  if (unit === "week") {
    if (!weekdaysOf(s, start).includes(isoWeekday(day))) return false;
    // Weeks run Monday to Sunday, counted from the start date's week.
    return Math.floor((elapsed + (isoWeekday(start) - 1)) / 7) % every === 0;
  }

  // Calendar months from the start date; a day the month lacks moves to the month's last day.
  const [sy, sm] = parts(start);
  const [dy, dm, dd] = parts(day);
  const months = (dy - sy) * 12 + (dm - sm);
  if (months < 0 || months % every !== 0) return false;
  const last = daysInMonth(dy, dm);
  return monthDaysOf(s, start).some((d) => Math.min(d, last) === dd);
}

/** `day` is a dose day of the schedule that began on `start` (both YYYY-MM-DD). */
export function doseDueState(start: string, schedule: DueSchedule | null, day: string): DueState {
  if (!schedule || schedule.schedule_unit == null || schedule.schedule_every == null) return "asNeeded";
  return isScheduledDay(start, schedule, day) ? "due" : "notToday";
}
