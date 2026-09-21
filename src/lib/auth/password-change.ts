import type { User } from "@supabase/supabase-js";

/**
 * Self-managed passwords: an admin never types a user's password. Creating
 * an account (or resetting one) mints a temporary password, shown to the
 * admin once to pass on, and marks the account so the person must choose
 * their own on their first email/password sign-in before reaching the app.
 *
 * The mark lives in `app_metadata`, which only the service role can write
 * — `user_metadata` is editable by the user themselves through
 * `auth.updateUser()`, so a flag there could be cleared without setting a
 * password. Google sign-in bypasses the forced change: no password was
 * used, so there is nothing to replace (see signedInWithPassword).
 */
export const MUST_CHANGE_PASSWORD = "must_change_password";

export const PASSWORD_CHANGE_PATH = "/account/password";

export function mustChangePassword(user: Pick<User, "app_metadata"> | null | undefined): boolean {
  return user?.app_metadata?.[MUST_CHANGE_PASSWORD] === true;
}

/**
 * Whether the current session was opened with a password, from the access
 * token's `amr` claim. The token is decoded, not verified: the caller has
 * already established the session with getUser(), and this only decides
 * whether the forced change applies. Anything unreadable counts as a
 * password sign-in, so a stale or odd token can't skip the change.
 */
export function signedInWithPassword(accessToken: string | null | undefined): boolean {
  if (!accessToken) return true;
  try {
    const payload = accessToken.split(".")[1];
    // atob rather than Buffer: this also runs in the request proxy.
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { amr?: ({ method?: string } | string)[] };
    const methods = (claims.amr ?? []).map((entry) =>
      typeof entry === "string" ? entry : (entry.method ?? ""),
    );
    if (methods.length === 0) return true;
    return methods.includes("password");
  } catch {
    return true;
  }
}

export const MIN_PASSWORD_LENGTH = 8;
