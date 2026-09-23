import type { Dictionary } from "./i18n/dictionaries/en";
import type { Locale } from "./i18n/locales";

// Each locale maps to a fixed BCP-47 tag, used for the *number* formats
// below (grouping separators, the baht symbol), which every ICU agrees on.
const NUMBER_LOCALE_TAG: Record<Locale, string> = {
  en: "en-GB",
  th: "th-TH",
};

// Dates are assembled by hand rather than through toLocaleDateString():
// even with the locale pinned, the abbreviated month comes from the
// runtime's ICU data, and Node/Chrome (CLDR 38+) write "20 Sept 2026" for
// en-GB where iOS Safari writes "20 Sep 2026" — a hydration mismatch on
// every client component that shows a date, first seen on a phone on
// 2026-09-21. A fixed table gives the same string everywhere. Thai dates
// are in the Buddhist Era (year + 543), which is how Thai staff read and
// write dates day to day (decided 2026-09-20; see docs/decisions.md);
// only display is affected — dates are stored and submitted as ISO
// Gregorian, and the browser's native date inputs stay Gregorian.
const SHORT_MONTHS: Record<Locale, readonly string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
};

/** The pieces of a date in the runtime's time zone — the same zone toLocaleDateString() used. */
function dateParts(value: string | number | Date, locale: Locale) {
  const d = new Date(value);
  return {
    day: d.getDate(),
    month: SHORT_MONTHS[locale][d.getMonth()],
    year: locale === "th" ? d.getFullYear() + 543 : d.getFullYear(),
    time: `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

/** "20 Sep 2026" / "20 ก.ย. 2569". */
export function formatDate(value: string | null | undefined, locale: Locale = "en") {
  if (!value) return "—";
  const { day, month, year } = dateParts(value, locale);
  return `${day} ${month} ${year}`;
}

/** "20 Sep 2026, 14:05" / "20 ก.ย. 2569 14:05" — the shapes en-GB and th-TH produced. */
export function formatDateTime(
  value: string | null | undefined,
  locale: Locale = "en",
) {
  if (!value) return "—";
  const { day, month, year, time } = dateParts(value, locale);
  return locale === "th" ? `${day} ${month} ${year} ${time}` : `${day} ${month} ${year}, ${time}`;
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
  return `${kg.toLocaleString(NUMBER_LOCALE_TAG[locale], {
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
  const { day, month, year } = dateParts(value, locale);
  return withYear ? `${month} ${year}` : `${day} ${month}`;
}

// Costs are Thai baht — the shelter's only currency — shown whole (quotes
// and invoices are in whole baht) with the locale's grouping separator.
export function formatBaht(amount: number, locale: Locale = "en") {
  return amount.toLocaleString(NUMBER_LOCALE_TAG[locale], {
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
  const { month, year } = dateParts(value, locale);
  return withYear ? `${month} ${year}` : month;
}

// A unit price — per tablet, per ml, per dose — is often a few baht and
// change, so unlike formatBaht (whole baht, for totals and invoice figures)
// this keeps up to two decimals, matching the numeric(12, 2) the prices are
// stored in. "฿2.50", "฿120".
export function formatBahtPrice(amount: number, locale: Locale = "en") {
  return amount.toLocaleString(NUMBER_LOCALE_TAG[locale], {
    style: "currency",
    currency: "THB",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// The largest numeric(12, 2) there is — the type every price column uses.
const MAX_BAHT = 9_999_999_999.99;

export type ParsedBaht = { ok: true; value: number | null } | { ok: false };

/**
 * A baht amount typed into a form (0071's price fields). Blank is a real
 * answer — null, "nobody has priced this yet" — and anything that isn't a
 * non-negative number in range is rejected rather than coerced, because
 * the one thing the cashflow forecast must never do is invent a zero.
 * Rounded to two decimals so what is stored is what was shown.
 */
export function parseBahtAmount(raw: string | null | undefined): ParsedBaht {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return { ok: true, value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > MAX_BAHT) return { ok: false };
  return { ok: true, value: Math.round(value * 100) / 100 };
}
