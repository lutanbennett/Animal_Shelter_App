import type { Factor, User } from "@supabase/supabase-js";
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

/**
 * Who may bind a login's first authenticator app
 * (docs/decisions/2026-10-01-first-authenticator-needs-an-admin-to-open-it.md).
 * A password alone must not be able to enrol one: a stolen password would
 * let the thief enrol their own app and lock the real admin out, and
 * 2-step that an unverified session can set up protects nobody. So a first
 * set-up needs a window opened from outside that session — by another
 * admin at aal2 (Allow set-up, or granting the admin role) or by the
 * developer's script. Both live in app_metadata, which only the service
 * role can write.
 */
export const SETUP_OPEN_UNTIL = "two_step_setup_until";
/** The one authenticator app Security accepts for this login. */
export const APPROVED_FACTOR = "two_step_factor";
/** How long an opened set-up stays open. */
export const SETUP_WINDOW_MS = 3 * 86_400_000;
/**
 * Apps created before this rule shipped are trusted as they are — making
 * every existing admin enrol again would lock them all out on deploy. An
 * app created at or after this moment counts only if it is the approved
 * one, so one a password-only session enrols straight with Supabase (the
 * anon key is public) never opens Security.
 */
export const RULE_STARTS_AT = "2026-10-01T00:00:00Z";

export function setupWindowEnd(now = Date.now()) {
  return new Date(now + SETUP_WINDOW_MS).toISOString();
}

type Meta = Pick<User, "app_metadata" | "factors">;

/** An authenticator app that has been set up and confirmed with a code. */
export function isVerifiedTotp(factor: Pick<Factor, "factor_type" | "status">) {
  return factor.factor_type === "totp" && factor.status === "verified";
}

/** Confirmed apps that Security believes: the approved one, or one from before the rule. */
export function trustedTotpFactors(user: Meta): Factor[] {
  const approved = user.app_metadata?.[APPROVED_FACTOR];
  return (user.factors ?? []).filter(
    (f) => isVerifiedTotp(f) && (f.id === approved || f.created_at < RULE_STARTS_AT),
  );
}

/** Whether set-up has been opened for this login and has not run out. */
export function isSetupOpen(user: Pick<User, "app_metadata">, now = Date.now()) {
  const until = user.app_metadata?.[SETUP_OPEN_UNTIL];
  return typeof until === "string" && Date.parse(until) > now;
}

/** A login's 2-step state, from a user GoTrue has just returned. */
export function twoStepState(user: Meta) {
  const enrolled = trustedTotpFactors(user).length > 0;
  return { enrolled, setupOpen: !enrolled && isSetupOpen(user) };
}

export type AssuranceLevel = {
  /** What this session has passed: "aal1" after a password or Google, "aal2" after a code. */
  current: "aal1" | "aal2" | null;
  /** Whether the account has a trusted authenticator app (a verified TOTP factor Security accepts). */
  enrolled: boolean;
  /** Not enrolled, and an admin has opened set-up for this login. */
  setupOpen: boolean;
};

/**
 * The signed-in session's assurance level. The access token is checked
 * with GoTrue (getAuthenticatorAssuranceLevel(jwt) calls getUser(jwt))
 * before its `aal` claim is believed — the cookie is the browser's to
 * edit, so an unverified decode could be forged into "aal2". An aal2
 * earned with an app Security doesn't trust counts as aal1.
 */
export async function getAssuranceLevel(): Promise<AssuranceLevel> {
  const none = { current: null, enrolled: false, setupOpen: false } as const;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return none;

  const [{ data, error }, { data: userData }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(session.access_token),
    supabase.auth.getUser(),
  ]);
  if (error || !data || !userData.user) return none;

  const state = twoStepState(userData.user);
  const level =
    data.currentLevel === "aal2" ? "aal2" : data.currentLevel === "aal1" ? "aal1" : null;
  return { current: level === "aal2" && !state.enrolled ? "aal1" : level, ...state };
}

/** Whether this session has passed the authenticator-app step. */
export async function hasTwoStep() {
  return (await getAssuranceLevel()).current === "aal2";
}

/**
 * The name the authenticator app shows above the codes. Dev and UAT say
 * so, since an admin may have both on one phone next to the live one.
 */
export function totpIssuer() {
  const env = getAppEnv();
  return env === "production" ? "Lanna Animal Care" : `Lanna Animal Care (${env === "dev" ? "test" : "UAT"})`;
}
