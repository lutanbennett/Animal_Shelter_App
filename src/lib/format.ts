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
// this anchors estimated_age_years to intake_date and keeps aging it from
// there — a "~5 years old" recorded at intake reads "~6 years old" a year
// later, instead of staying frozen at whatever was typed in on day one.
export function formatAge(
  t: Dictionary,
  estimatedAgeYears: number | null | undefined,
  intakeDate?: string | null,
) {
  if (estimatedAgeYears == null) return t.format.ageUnknown;

  const elapsedYears = intakeDate
    ? Math.max(0, (Date.now() - new Date(intakeDate).getTime()) / MS_PER_YEAR)
    : 0;
  const age = Math.round((estimatedAgeYears + elapsedYears) * 2) / 2;
  return t.format.ageEstimated(age);
}
