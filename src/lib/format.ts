import type { Dictionary } from "./i18n/dictionaries/en";
import type { Locale } from "./i18n/locales";

// Each locale maps to a fixed BCP-47 tag with an explicit Gregorian calendar
// (`-u-ca-gregory`) — Thai's default calendar is Buddhist Era (year + 543),
// which would silently shift every date shown and could confuse medical
// record-keeping. The locale is otherwise pinned (not left to the runtime
// default) so the date string is identical on the server and in the
// browser — a locale that tracks the runtime's default causes a hydration
// mismatch when server and client environments differ.
const DATE_LOCALE_TAG: Record<Locale, string> = {
  en: "en-GB",
  th: "th-TH-u-ca-gregory",
};

export function formatDate(value: string | null | undefined, locale: Locale = "en") {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(DATE_LOCALE_TAG[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(
  value: string | null | undefined,
  locale: Locale = "en",
) {
  if (!value) return "—";
  return new Date(value).toLocaleString(DATE_LOCALE_TAG[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

// Ages are always a staff estimate (the shelter never has a real DOB), so
// estimated_age_years is "age as guessed on age_estimated_on" and keeps
// aging from that date — a "~5 years old" recorded at intake reads "~6
// years old" a year later, instead of staying frozen at whatever was typed
// in on day one. Rounded to the nearest half year.
export function estimatedAgeNow(
  estimatedAgeYears: number | null | undefined,
  estimatedOn?: string | null,
  now: number = Date.now(),
): number | null {
  if (estimatedAgeYears == null) return null;

  const elapsedYears = estimatedOn
    ? Math.max(0, (now - new Date(estimatedOn).getTime()) / MS_PER_YEAR)
    : 0;
  return Math.round((estimatedAgeYears + elapsedYears) * 2) / 2;
}

export function formatAge(
  t: Dictionary,
  estimatedAgeYears: number | null | undefined,
  estimatedOn?: string | null,
) {
  const age = estimatedAgeNow(estimatedAgeYears, estimatedOn);
  if (age == null) return t.format.ageUnknown;
  return t.format.ageEstimated(age);
}

// Weights are stored as unbounded numeric; PostgREST hands them back as JS
// numbers, so 12.50 arrives as 12.5. Shown to two decimals at most (the
// scales the shelter uses read to 10 g) with the locale's separators.
export function formatWeightKg(kg: number, locale: Locale = "en") {
  return `${kg.toLocaleString(DATE_LOCALE_TAG[locale], {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} kg`;
}

// A signed change between two readings, for the trend indicators: "+0.4 kg"
// / "−0.4 kg" / "±0 kg". Uses a real minus sign so it doesn't read as a dash.
export function formatWeightDelta(deltaKg: number, locale: Locale = "en") {
  const rounded = Math.round(deltaKg * 100) / 100;
  if (rounded === 0) return `±0 kg`;
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${formatWeightKg(Math.abs(rounded), locale)}`;
}

// Axis-tick dates: "3 Sep" inside a year, "Sep 2026" once the range is long
// enough for the month alone to be ambiguous.
export function formatAxisDate(
  value: string | number | Date,
  locale: Locale = "en",
  withYear = false,
) {
  return new Date(value).toLocaleDateString(
    DATE_LOCALE_TAG[locale],
    withYear
      ? { month: "short", year: "numeric" }
      : { day: "numeric", month: "short" },
  );
}
