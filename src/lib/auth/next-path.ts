/**
 * The `next` parameter that carries "where were you going" through the
 * sign-in flow: the request proxy sets it when it bounces a signed-out
 * visitor to /login, the login form and the Google OAuth leg pass it
 * along, and /auth/callback or the password action redirect to it.
 *
 * Only a same-origin path is honoured — never an absolute URL or a
 * protocol-relative `//host` — so a crafted link can't send someone
 * off-site after they sign in.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Where a fresh sign-in lands when nothing asked for somewhere else. */
export const DEFAULT_SIGNED_IN_PATH = "/residents";
