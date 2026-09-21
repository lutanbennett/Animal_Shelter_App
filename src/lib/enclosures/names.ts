import type { Locale } from "@/lib/i18n/locales";

/**
 * A zone or enclosure name in the reader's language (0058). `name` is the
 * English key — unique, the Drive folder name, what the placement logic
 * matches — and `name_th` is display only, so a Thai reader gets it when
 * it is set and the English otherwise. Empty strings count as unset.
 */
export function placeName(
  locale: Locale,
  name: string | null | undefined,
  nameTh: string | null | undefined,
): string {
  if (locale === "th" && nameTh?.trim()) return nameTh.trim();
  return name ?? "";
}
