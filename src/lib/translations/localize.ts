import type { Locale } from "@/lib/i18n/locales";
import type { PublicTranslations, TranslationRow } from "./types";

/**
 * A record's field in the reader's language: the approved translation when
 * it is in that language, otherwise the original. A record is never hidden
 * for lacking a translation (0042's rule, now for every translatable
 * field). Empty strings count as missing.
 */
export function localizedField(
  locale: Locale,
  original: string | null | undefined,
  translations: PublicTranslations | undefined,
  column: string,
): string {
  const t = translations?.[column];
  if (t && t.lang === locale && t.text.trim()) return t.text.trim();
  return original?.trim() ?? "";
}

/**
 * Same choice made from a full `translations` row (the signed-in pages
 * load rows rather than the public views' jsonb). Only an approved
 * translation stands in for the original; a draft or stale one is shown
 * beside it, labelled, by TranslationPanel.
 */
export function localizedFromRow(
  locale: Locale,
  original: string | null | undefined,
  row: TranslationRow | null | undefined,
): string {
  if (row && row.status === "approved" && row.target_lang === locale && row.text?.trim()) {
    return row.text.trim();
  }
  return original?.trim() ?? "";
}
