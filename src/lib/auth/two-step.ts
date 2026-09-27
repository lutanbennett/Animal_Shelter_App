import type { Factor } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/app-env";

/**
 * 2-step verification for Settings → Security (docs/decisions.md,
 * 2026-09-27). The page decides who can get in at all, so it and every
 * action behind it need a session that has passed Supabase Auth's
 * authenticator-app (TOTP) factor — `aal: "aal2"` in the JWT. The rest of
 * the app keeps the ordinary sign-in.
 *
 * Measured on dev (scripts/check-two-step-session.mjs): a password or
 * Google session is aal1; verifying a code raises the same session to
 * aal2, which a refresh keeps, so it lasts until sign-out. A new sign-in
 * starts at aal1 again. Removing the factor drops an open session to aal1
 * at its next refresh (within the hour the access token lives).
 */
export const TWO_STEP_PATH = "/admin/security/verify";

export type AssuranceLevel = {
  /** What this session has passed: "aal1" after a password or Google, "aal2" after a code. */
  current: "aal1" | "aal2" | null;
  /** Whether the account has an authenticator app set up (a verified TOTP factor). */
  enrolled: boolean;
};

/**
 * The signed-in session's assurance level. The access token is checked
 * with GoTrue (getAuthenticatorAssuranceLevel(jwt) calls getUser(jwt))
 * before its `aal` claim is believed — the cookie is the browser's to
 * edit, so an unverified decode could be forged into "aal2".
 */
export async function getAssuranceLevel(): Promise<AssuranceLevel> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { current: null, enrolled: false };

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(
    session.access_token,
  );
  if (error || !data) return { current: null, enrolled: false };
  return {
    current: data.currentLevel === "aal2" ? "aal2" : data.currentLevel === "aal1" ? "aal1" : null,
    enrolled: data.nextLevel === "aal2",
  };
}

/** Whether this session has passed the authenticator-app step. */
export async function hasTwoStep() {
  return (await getAssuranceLevel()).current === "aal2";
}

/** An authenticator app that has been set up and confirmed with a code. */
export function isVerifiedTotp(factor: Pick<Factor, "factor_type" | "status">) {
  return factor.factor_type === "totp" && factor.status === "verified";
}

/**
 * The name the authenticator app shows above the codes. Dev and UAT say
 * so, since an admin may have both on one phone next to the live one.
 */
export function totpIssuer() {
  const env = getAppEnv();
  return env === "production" ? "Lanna Animal Care" : `Lanna Animal Care (${env === "dev" ? "test" : "UAT"})`;
}
