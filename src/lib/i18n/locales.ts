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

/** A year, the same as the proxy's own cookie and the toggle's before it. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The `document.cookie` string that sets the language, for the toggle in the
 * browser.
 *
 * PI FAILOVER (D), 2026-11-01: the toggle used to call a `setLocale` Server
 * Action, and a Server Action POSTs to the address of the page the person is
 * on -- so the switcher put a write on every address in the app, including the
 * public site's, and no page could go on WRAPPED_WRITE_PATHS while it did. It
 * could not simply be wrapped: `claim_write_request()` is revoked from `anon`
 * and raises for a login `holds_app_role()` answers false for
 * (0292_write_requests.sql), and this toggle is drawn for signed-out visitors
 * on the public site. Wrapping it would have broken the language switch for
 * exactly the people who use it most.
 *
 * So it writes the cookie from the browser instead. The cookie has never been
 * httpOnly -- not here and not in src/proxy.ts -- so this is the same value
 * written by the same party that already owned it, and the server side is
 * unchanged: `getLocale()` still reads it and still passes it through
 * `isLocale()`, so a tampered value falls back to the default.
 *
 * Pure, and the attributes are kept beside the proxy's so the two cannot
 * drift. docs/decisions/2026-11-01-header-writes-wrapped.md.
 */
export function localeCookie(locale: Locale): string {
  return `${localeCookieName}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}
