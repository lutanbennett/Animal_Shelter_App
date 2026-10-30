import {
  isScheduledDay,
  monthDaysOf,
  weekdaysOf,
  type RxSchedule,
  type ScheduleUnit,
} from "@/lib/medication-list/due";

/**
 * A prescription's recurring schedule (0283): which DAYS a dose falls on. The times on those days are the
 * ticked rounds (prescription_rounds), one dose per tick, four at most (Lutan, 2026-10-30).
 * The day rule itself lives in medication-list/due.ts, which mirrors the forecast (0284).
 */
export { isScheduledDay, type RxSchedule, type ScheduleUnit };

export const SCHEDULE_UNITS = ["day", "week", "month"] as const;

export const AS_NEEDED: RxSchedule = {
  schedule_unit: null,
  schedule_every: null,
  schedule_weekdays: null,
  schedule_month_days: null,
};

/** The columns a query selects to read a prescription's schedule. */
export const SCHEDULE_COLUMNS = "schedule_unit, schedule_every, schedule_weekdays, schedule_month_days";

/** At most four doses a day: Morning, Lunch, Evening, Night. */
export const MAX_DOSES_PER_DAY = 4;

/** The raw form values: strings, as inputs submit them. */
export type ScheduleFormValues = {
  /** "asNeeded" or a unit. */
  unit: string;
  every: string;
  weekdays: string[];
  monthDays: string[];
};

export type ScheduleFormError = "unitInvalid" | "everyWhole" | "weekdaysNone" | "monthDaysNone";

const whole = (raw: string | null | undefined): number | null => {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

function distinctSorted(raw: string[], lo: number, hi: number): number[] | null {
  const out = new Set<number>();
  for (const r of raw) {
    const n = Number(r);
    if (!Number.isInteger(n) || n < lo || n > hi) return null;
    out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

/** Validates the form's day-pattern fields into the columns, in the shape 0283's check demands. */
export function parseScheduleForm(v: {
  unit: string | null;
  every: string | null;
  weekdays: string[];
  monthDays: string[];
}): { schedule: RxSchedule } | { error: ScheduleFormError } {
  if (v.unit === "asNeeded") return { schedule: AS_NEEDED };
  if (!(SCHEDULE_UNITS as readonly string[]).includes(v.unit ?? "")) return { error: "unitInvalid" };
  const unit = v.unit as ScheduleUnit;
  const every = whole(v.every);
  if (every == null) return { error: "everyWhole" };
  if (unit === "week") {
    const days = distinctSorted(v.weekdays, 1, 7);
    if (!days || days.length === 0) return { error: "weekdaysNone" };
    return { schedule: { schedule_unit: unit, schedule_every: every, schedule_weekdays: days, schedule_month_days: null } };
  }
  if (unit === "month") {
    const days = distinctSorted(v.monthDays, 1, 31);
    if (!days || days.length === 0) return { error: "monthDaysNone" };
    return { schedule: { schedule_unit: unit, schedule_every: every, schedule_weekdays: null, schedule_month_days: days } };
  }
  return { schedule: { schedule_unit: unit, schedule_every: every, schedule_weekdays: null, schedule_month_days: null } };
}

/** The form's starting values: a new prescription is every day; a stored null weekday/day is resolved from the start date. */
export function scheduleToForm(s: RxSchedule | null, start: string): ScheduleFormValues {
  if (!s) return { unit: "day", every: "1", weekdays: [], monthDays: [] };
  if (s.schedule_unit == null) return { unit: "asNeeded", every: "1", weekdays: [], monthDays: [] };
  return {
    unit: s.schedule_unit,
    every: String(s.schedule_every ?? 1),
    weekdays: s.schedule_unit === "week" ? weekdaysOf(s, start).map(String) : [],
    monthDays: s.schedule_unit === "month" ? monthDaysOf(s, start).map(String) : [],
  };
}

/** Whether the schedule has days at all (as needed does not, so it shows no ticks). */
export const isRecurring = (s: RxSchedule | null): boolean => s != null && s.schedule_unit != null && s.schedule_every != null;

export type Words = {
  asNeeded: string;
  /** "every day", "every 3 days" */
  everyDays: (n: number) => string;
  /** "every week on Mon, Thu", "every 2 weeks on Mon" */
  everyWeeks: (n: number, days: string) => string;
  /** "every month on day 1, 15", "every 2 months on day 31" */
  everyMonths: (n: number, days: string) => string;
  weekdayShort: (isoWeekday: number) => string;
};

/** "every day", "every week on Mon, Thu", "every 2 months on day 15", "as needed" — for lists and the form. */
export function describeRxSchedule(w: Words, s: RxSchedule | null, start: string): string {
  if (!s || s.schedule_unit == null || s.schedule_every == null) return w.asNeeded;
  if (s.schedule_unit === "day") return w.everyDays(s.schedule_every);
  if (s.schedule_unit === "week") {
    return w.everyWeeks(s.schedule_every, weekdaysOf(s, start).map(w.weekdayShort).join(", "));
  }
  return w.everyMonths(s.schedule_every, monthDaysOf(s, start).join(", "));
}

/** The words from a dictionary's prescriptions.days block. */
export function wordsFrom(d: Omit<Words, "weekdayShort"> & { weekdayShort: readonly string[] }): Words {
  return { ...d, weekdayShort: (n) => d.weekdayShort[n - 1] };
}

/** The plain-English words, for the archive files and anything outside the dictionaries. */
export const ENGLISH_WORDS: Words = {
  asNeeded: "As needed",
  everyDays: (n) => (n === 1 ? "Every day" : `Every ${n} days`),
  everyWeeks: (n, days) => `${n === 1 ? "Every week" : `Every ${n} weeks`} on ${days}`,
  everyMonths: (n, days) => `${n === 1 ? "Every month" : `Every ${n} months`} on day ${days}`,
  weekdayShort: (d) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d - 1],
};
