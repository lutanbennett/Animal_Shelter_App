import type { Locale } from "@/lib/i18n/locales";

/**
 * A resident's breed or colour in the reader's language: the Thai when a Thai reader is looking and
 * one was typed, otherwise the English, never blank (residents.breed_th / colour_th, 0205). One rule,
 * used by every screen that shows either, so a page can never be half Thai with a gap in it.
 */
export function residentText(
  locale: Locale,
  en: string | null | undefined,
  th: string | null | undefined,
): string | null {
  if (locale === "th" && th?.trim()) return th.trim();
  return en?.trim() || null;
}
