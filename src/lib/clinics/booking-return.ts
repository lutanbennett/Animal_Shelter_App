/**
 * Where the booking form sends you after saving, when the page that opened it said so (`?from=`).
 *
 * The value comes from the address bar, so it is never used as given: it must equal one of the fixed
 * pages below, or a clinic's own page, character for character. Not a prefix check, not "starts with /":
 * `//evil.example` starts with a slash and a browser reads it as another site.
 * docs/decisions/2026-10-22-booking-returns-to-the-list.md
 */
const FIXED_PAGES = new Set(["/upcoming-visits", "/appointments"]);
const CLINIC_PAGE = /^\/clinics\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The page to return to, or null (the caller then keeps its usual destination). */
export function bookingReturnPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  return FIXED_PAGES.has(raw) || CLINIC_PAGE.test(raw) ? raw : null;
}
