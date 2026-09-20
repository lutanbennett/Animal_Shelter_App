import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * A frequency's schedule (0044). Exactly one kind, or none:
 *   per day   — doses_per_day, a whole number
 *   interval  — one dose every interval_count interval_units, the first
 *               on the prescription's start date
 *   as needed — everything null; can't be forecast
 */
export type FrequencySchedule = {
  doses_per_day: number | null;
  interval_count: number | null;
  interval_unit: IntervalUnit | null;
};

export const INTERVAL_UNITS = ["day", "week", "month"] as const;
export type IntervalUnit = (typeof INTERVAL_UNITS)[number];

export const SCHEDULE_KINDS = ["perDay", "interval", "asNeeded"] as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

export function scheduleKind(s: FrequencySchedule): ScheduleKind {
  if (s.doses_per_day != null) return "perDay";
  if (s.interval_count != null) return "interval";
  return "asNeeded";
}

/** The raw form values the schedule fields submit (see FrequencyScheduleFields). */
export type ScheduleFields = {
  kind: string | null;
  dosesPerDay: string | null;
  intervalCount: string | null;
  intervalUnit: string | null;
};

export type ScheduleError =
  | "kindInvalid"
  | "dosesPerDayWhole"
  | "intervalCountWhole"
  | "intervalUnitInvalid";

function wholeNumber(raw: string | null): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Validates the schedule fields into database columns. Returns an error
 * key (for the caller to translate) instead of a schedule when invalid.
 */
export function parseSchedule(
  fields: ScheduleFields,
): { schedule: FrequencySchedule } | { error: ScheduleError } {
  switch (fields.kind) {
    case "perDay": {
      const n = wholeNumber(fields.dosesPerDay);
      if (n == null) return { error: "dosesPerDayWhole" };
      return { schedule: { doses_per_day: n, interval_count: null, interval_unit: null } };
    }
    case "interval": {
      const n = wholeNumber(fields.intervalCount);
      if (n == null) return { error: "intervalCountWhole" };
      const unit = fields.intervalUnit;
      if (!INTERVAL_UNITS.includes(unit as IntervalUnit)) {
        return { error: "intervalUnitInvalid" };
      }
      return {
        schedule: {
          doses_per_day: null,
          interval_count: n,
          interval_unit: unit as IntervalUnit,
        },
      };
    }
    case "asNeeded":
      return { schedule: { doses_per_day: null, interval_count: null, interval_unit: null } };
    default:
      return { error: "kindInvalid" };
  }
}

/** "2 × a day", "every 2 weeks", "as needed" — for tables and pickers. */
export function describeSchedule(t: Dictionary, s: FrequencySchedule): string {
  switch (scheduleKind(s)) {
    case "perDay":
      return t.frequency.perDay(s.doses_per_day as number);
    case "interval":
      return t.frequency.every(
        s.interval_count as number,
        s.interval_unit as IntervalUnit,
      );
    default:
      return t.frequency.asNeeded;
  }
}

/**
 * Sort key: most frequent first (3 × a day … once a day, every other day,
 * weekly, monthly), "as needed" last. Only for ordering pick-lists — it is
 * an average and never shown.
 */
export function scheduleDosesPerDayForSort(s: FrequencySchedule): number {
  if (s.doses_per_day != null) return s.doses_per_day;
  if (s.interval_count != null && s.interval_unit != null) {
    const days = { day: 1, week: 7, month: 30 }[s.interval_unit];
    return 1 / (s.interval_count * days);
  }
  return -1;
}

export function compareSchedules<T extends FrequencySchedule>(a: T, b: T): number {
  return scheduleDosesPerDayForSort(b) - scheduleDosesPerDayForSort(a);
}
