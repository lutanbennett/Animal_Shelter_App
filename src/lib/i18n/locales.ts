export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookieName = "locale";

/**
 * The language a phone asks for: Thai when it is the first preference in
 * Accept-Language ("th-TH,th;q=0.9,en;q=0.8"), otherwise the default. Only the
 * first entry counts, so an English phone that lists Thai second stays English.
 * Pure, and shared with the Worker (worker/index.mjs) so its cache key and the
 * proxy agree on who gets which page.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  const first = (header ?? "").split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  return first === "th" || first.startsWith("th-") ? "th" : defaultLocale;
}

/**
 * The cookie to start a visitor with, or null to leave things alone. Only a
 * visitor with no valid `locale` cookie gets one, so the language toggle
 * (which always writes the cookie) wins from then on.
 */
export function initialLocaleCookie(
  cookie: string | undefined | null,
  acceptLanguage: string | null | undefined,
): Locale | null {
  if (isLocale(cookie)) return null;
  const asked = localeFromAcceptLanguage(acceptLanguage);
  return asked === defaultLocale ? null : asked;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
