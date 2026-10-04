/**
 * The `next` parameter that carries "where were you going" through the
 * sign-in flow: the request proxy sets it when it bounces a signed-out
 * visitor to /login, the login form and the Google OAuth leg pass it
 * along, and /auth/callback or the password action redirect to it.
 *
 * Only a same-origin path is honoured, so a crafted link can't send someone
 * off-site right after a genuine sign-in. Rather than listing bad prefixes
 * (`//` was caught; `/\`, which browsers read as `//`, was not), the value
 * is parsed the way a browser would and kept only if it stays on our
 * origin; what comes back is the parsed `pathname + search`, never the raw
 * input, so a fragment or rebuilt absolute URL can't survive. Backslashes
 * and control characters have no legitimate use in a path here and are
 * refused outright (URL parsers silently drop tab and newline, so
 * `/<tab>/evil.com` would otherwise become `//evil.com`).
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(next)) return null;
  try {
    const url = new URL(next, "http://x");
    return url.origin === "http://x" ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}

/**
 * The app side's home page: where a fresh sign-in lands when nothing asked
 * for somewhere else, and where "Open the app" on the public site goes. "/" is
 * the public home for everyone; "/home" is the home of the app and works out
 * which home the signed-in person gets (My tasks was the landing from
 * 2026-09-26, Lutan; it is now a tile on the home, and `/my` still opens it).
 */
export const DEFAULT_SIGNED_IN_PATH = "/home";

/** A vet's home: /my sends them here, since they have no tasks (2026-09-29). */
export const VET_HOME_PATH = "/appointments";
