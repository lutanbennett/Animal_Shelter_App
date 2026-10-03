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

export const MIN_PASSWORD_LENGTH = 12;

/** A recovery link's session may set a password without the old one for this long. */
export const RECOVERY_WINDOW_SECONDS = 30 * 60;

/**
 * Whether this session was opened by a password-recovery link a moment
 * ago, from the newest `amr` entry. Decoded, not verified (the caller has
 * run getUser()), and anything unreadable counts as *not* recovery — the
 * opposite default to signedInWithPassword, because here "yes" waives the
 * current-password check.
 */
export function openedByRecoveryLink(
  accessToken: string | null | undefined,
  nowSeconds: number = Date.now() / 1000,
): boolean {
  if (!accessToken) return false;
  try {
    const payload = accessToken.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { amr?: { method?: string; timestamp?: number }[] };
    const latest = (claims.amr ?? []).reduce<{ method?: string; timestamp?: number } | null>(
      (best, entry) =>
        typeof entry === "object" && entry && (best === null || (entry.timestamp ?? 0) > (best.timestamp ?? 0))
          ? entry
          : best,
      null,
    );
    if (!latest || (latest.method !== "otp" && latest.method !== "recovery")) return false;
    return nowSeconds - (latest.timestamp ?? 0) <= RECOVERY_WINDOW_SECONDS;
  } catch {
    return false;
  }
}

/**
 * A change by choice must prove knowledge of the current password, so a
 * found, unlocked, signed-in phone can't be used to take the account. The
 * two legitimate exceptions have no current password to give: the forced
 * change after a temporary one (the flag is app_metadata, service-role
 * only) and a fresh recovery-link session. Decided on the server from the
 * session itself — never from anything the form says.
 */
export function requiresCurrentPassword(
  user: Pick<User, "app_metadata"> | null | undefined,
  accessToken: string | null | undefined,
): boolean {
  return !mustChangePassword(user) && !openedByRecoveryLink(accessToken);
}
