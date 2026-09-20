import type { Dictionary } from "./i18n/dictionaries/en";
import type { Locale } from "./i18n/locales";

// Each locale maps to a fixed BCP-47 tag with an explicit calendar. Thai
// dates are shown in the Buddhist Era (year + 543, `-u-ca-buddhist`), which
// is how Thai staff read and write dates day to day — decided 2026-09-20,
// reversing an earlier Gregorian pin (see docs/decisions.md). Only display
// is affected: dates are stored and submitted as ISO Gregorian, and the
// browser's native date inputs stay Gregorian. The tag is pinned rather
// than left to the runtime default so the string is identical on the
// server and in the browser — a locale that tracks the runtime's default
// causes a hydration mismatch when server and client environments differ.
const DATE_LOCALE_TAG: Record<Locale, string> = {
  en: "en-GB",
  th: "th-TH-u-ca-buddhist",
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

// The kilogram abbreviation per locale — Thai writes it กก., and it appears
// beside numbers in too many places (tiles, chart, list, form suffix) to
// carry through the dictionary each time.
const KG_UNIT: Record<Locale, string> = { en: "kg", th: "กก." };

export function weightUnit(locale: Locale = "en") {
  return KG_UNIT[locale];
}

// Weights are stored as unbounded numeric; PostgREST hands them back as JS
// numbers, so 12.50 arrives as 12.5. Shown to two decimals at most (the
// scales the shelter uses read to 10 g) with the locale's separators.
export function formatWeightKg(kg: number, locale: Locale = "en") {
  return `${kg.toLocaleString(DATE_LOCALE_TAG[locale], {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${KG_UNIT[locale]}`;
}

// A signed change between two readings, for the trend indicators: "+0.4 kg"
// / "−0.4 kg" / "±0 kg". Uses a real minus sign so it doesn't read as a dash.
export function formatWeightDelta(deltaKg: number, locale: Locale = "en") {
  const rounded = Math.round(deltaKg * 100) / 100;
  if (rounded === 0) return `±0 ${KG_UNIT[locale]}`;
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

// Costs are Thai baht — the shelter's only currency — shown whole (quotes
// and invoices are in whole baht) with the locale's grouping separator.
export function formatBaht(amount: number, locale: Locale = "en") {
  return amount.toLocaleString(DATE_LOCALE_TAG[locale], {
    style: "currency",
    currency: "THB",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Month-column labels for the visits-per-month chart: "Sep", with the year
// added where a run of months crosses into a new one ("Jan 2027").
export function formatMonth(
  value: string | number | Date,
  locale: Locale = "en",
  withYear = false,
) {
  return new Date(value).toLocaleDateString(
    DATE_LOCALE_TAG[locale],
    withYear ? { month: "short", year: "numeric" } : { month: "short" },
  );
}
