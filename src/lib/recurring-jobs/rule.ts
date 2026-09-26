import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate } from "@/lib/format";

/**
 * The recurrence subset of 0095, as the app holds it. Whether a rule FALLS
 * on a date is decided only in SQL (recurrence_occurs_on, and the
 * recurrence_dates / recurring_job_dates functions built on it) — nothing
 * here evaluates a rule. This file parses a rule out of a form, checks the
 * shape the table's CHECK will insist on, and describes a rule in words.
 */

export const REPEATS = ["weekly", "monthly_day", "monthly_weekday"] as const;
export type Repeat = (typeof REPEATS)[number];

export const TIMES_OF_DAY = ["morning", "afternoon", "evening", "anytime"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

/** ISO weekdays, 1 = Monday … 7 = Sunday, in the order the form shows them. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** 1–4, then -1 for "last" (0095: there is no 5th). */
export const WEEKS_OF_MONTH = [1, 2, 3, 4, -1] as const;

export type RecurrenceRule = {
  repeat: Repeat;
  every: number;
  weekdays: number[] | null;
  month_day: number | null;
  week_of_month: number | null;
  starts_on: string;
  ends_on: string | null;
};

export function isRepeat(value: unknown): value is Repeat {
  return typeof value === "string" && (REPEATS as readonly string[]).includes(value);
}

export function isTimeOfDay(value: unknown): value is TimeOfDay {
  return typeof value === "string" && (TIMES_OF_DAY as readonly string[]).includes(value);
}

/** Sort key so a day's jobs read morning → evening, anytime last. */
export function timeOfDayRank(value: TimeOfDay): number {
  return TIMES_OF_DAY.indexOf(value);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Checks a rule against what recurring_jobs_rule (0095) will accept, so the
 * form can say what is wrong in words instead of surfacing a CHECK name.
 * Returns the key of the message in t.management.recurringJobs.errors.
 */
export function ruleProblem(
  rule: RecurrenceRule,
): keyof Dictionary["management"]["recurringJobs"]["errors"] | null {
  if (!Number.isInteger(rule.every) || rule.every < 1 || rule.every > 52) return "everyInvalid";
  if (!ISO_DATE.test(rule.starts_on)) return "startRequired";
  if (rule.ends_on !== null) {
    if (!ISO_DATE.test(rule.ends_on)) return "endInvalid";
    if (rule.ends_on < rule.starts_on) return "endBeforeStart";
  }
  switch (rule.repeat) {
    case "weekly":
      if (!rule.weekdays || rule.weekdays.length === 0) return "weekdaysRequired";
      return null;
    case "monthly_day":
      if (rule.month_day === null || rule.month_day < 1 || rule.month_day > 31) return "monthDayInvalid";
      return null;
    case "monthly_weekday":
      if (!rule.weekdays || rule.weekdays.length !== 1) return "weekdayRequired";
      if (rule.week_of_month === null || !(WEEKS_OF_MONTH as readonly number[]).includes(rule.week_of_month))
        return "weekOfMonthRequired";
      return null;
  }
}

/**
 * Only the columns the rule's kind uses, the rest null — the table's CHECK
 * refuses a weekly rule that still carries a month_day from an earlier
 * choice in the form.
 */
export function normalizeRule(rule: RecurrenceRule): RecurrenceRule {
  const weekdays = rule.weekdays ? [...new Set(rule.weekdays)].sort((a, b) => a - b) : null;
  return {
    ...rule,
    weekdays: rule.repeat === "monthly_day" ? null : rule.repeat === "monthly_weekday" ? (weekdays?.slice(0, 1) ?? null) : weekdays,
    month_day: rule.repeat === "monthly_day" ? rule.month_day : null,
    week_of_month: rule.repeat === "monthly_weekday" ? rule.week_of_month : null,
  };
}

/** A list read the way people say it: "Monday, Wednesday and Friday". */
function joinList(t: Dictionary, items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${t.management.recurringJobs.rule.and} ${items[items.length - 1]}`;
}

/** "Every Monday", "Every 2 weeks on Monday and Thursday", "First Monday of every month". */
export function describeRule(t: Dictionary, rule: Pick<RecurrenceRule, "repeat" | "every" | "weekdays" | "month_day" | "week_of_month">): string {
  const r = t.management.recurringJobs.rule;
  switch (rule.repeat) {
    case "weekly": {
      const days = joinList(t, (rule.weekdays ?? []).map((d) => r.weekdayNames[d - 1]));
      return rule.weekdays?.length === 7 ? r.everyDay(rule.every) : r.weekly(rule.every, days);
    }
    case "monthly_day":
      return r.monthlyDay(rule.every, rule.month_day ?? 1);
    case "monthly_weekday":
      return r.monthlyWeekday(
        rule.every,
        r.ordinals[String(rule.week_of_month ?? 1) as keyof typeof r.ordinals],
        r.weekdayNames[(rule.weekdays?.[0] ?? 1) - 1],
      );
  }
}

/** "from 7 Oct 2026", "7 Oct 2026 – 31 Dec 2026". */
export function describeSpan(t: Dictionary, locale: Locale, rule: Pick<RecurrenceRule, "starts_on" | "ends_on">): string {
  const r = t.management.recurringJobs.rule;
  return rule.ends_on
    ? r.between(formatDate(rule.starts_on, locale), formatDate(rule.ends_on, locale))
    : r.from(formatDate(rule.starts_on, locale));
}

/** The weekday of a YYYY-MM-DD shelter date as ISO 1–7, by calendar arithmetic. */
export function isoWeekday(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}
