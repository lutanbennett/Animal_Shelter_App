import { safeNextPath } from "./next-path";

/**
 * Carries "where were you going" across the OAuth / recovery round trip WITHOUT
 * putting it on the callback URL (#nxtqs). Supabase compares the whole
 * redirectTo against an allow-list of exact paths; a `?next=` makes it miss and
 * GoTrue silently substitutes SITE_URL. So the URL handed over is always the
 * bare `${origin}/auth/callback`, and the destination rides in this cookie.
 *
 * The cookie is as untrusted as a query parameter: the READ side runs it
 * through safeNextPath() again. It is scoped to the callback path and lives ten
 * minutes. It is one per browser, like the PKCE code-verifier cookie beside it,
 * so two sign-ins started in two tabs already collide on the verifier; the
 * last one started wins, and neither can be sent anywhere unsafe.
 */
export const NEXT_COOKIE = "auth_next";
export const NEXT_COOKIE_PATH = "/auth/callback";
const TEN_MINUTES = 600;

/**
 * The one callback address per host: no query string, ever.
 *
 * It throws on anything that is not an http(s) origin rather than building a
 * nonsense address. `origin` is a DOM global (lib.dom.d.ts declares it), so a
 * caller that forgets to resolve its own origin still TYPECHECKS and then
 * silently mints `undefined/auth/callback` on the server -- which, in a
 * recovery email, is a dead link nobody would see until a person reported it.
 */
export function callbackUrl(origin: string): string {
  if (!/^https?:\/\/[^/]+$/.test(origin ?? "")) {
    throw new Error(`callbackUrl needs an http(s) origin with no path, got ${JSON.stringify(origin)}`);
  }
  return `${origin}${NEXT_COOKIE_PATH}`;
}

/** Cookie options for the write side. `secure` follows the origin's scheme so http dev still works. */
export function nextCookieOptions(origin: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: origin.startsWith("https://"),
    path: NEXT_COOKIE_PATH,
    maxAge: TEN_MINUTES,
  };
}

/**
 * Prefer the cookie; fall back to a `?next=` on the callback URL, because a
 * link minted before this change may still carry one. Either way the value is
 * validated here, on read.
 */
export function resolveNext(cookieValue: string | null | undefined, queryValue: string | null | undefined): string | null {
  return safeNextPath(cookieValue) ?? safeNextPath(queryValue);
}
