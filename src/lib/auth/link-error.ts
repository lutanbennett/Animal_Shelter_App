/**
 * Supabase reports a refused email link (a password reset) in the URL FRAGMENT:
 * `/login?error=google#error=access_denied&error_code=otp_expired&error_description=…`.
 * A fragment never reaches the server, so the callback route cannot tell a spent
 * reset link from a failed Google sign-in; the browser has to read it (#rcgle,
 * docs/decisions/2026-11-27-reset-link-error-read-in-the-browser.md).
 *
 * Returns which of OUR messages to show, or null when the fragment carries no
 * error. `error_description` is never shown: it is text anyone can put in a link
 * to this page, so only known codes are mapped and anything else gets a generic line.
 */
export type LinkErrorKind = "used" | "failed";

/** Codes meaning the one-time link is spent: timed out, or consumed by a mail scanner or prefetch before the person arrived. */
const SPENT = new Set(["otp_expired", "otp_disabled", "flow_state_expired", "flow_state_not_found"]);

export function linkErrorFromHash(hash: string): LinkErrorKind | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const code = params.get("error_code");
  if (!code && !params.get("error")) return null;
  return code && SPENT.has(code) ? "used" : "failed";
}
