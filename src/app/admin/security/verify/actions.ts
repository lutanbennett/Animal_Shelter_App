"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import {
  runAction,
  unexpectedFailure,
  type ActionRefusal,
  type ActionResult,
} from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import {
  APPROVED_FACTOR,
  SETUP_OPEN_UNTIL,
  isSetupOpen,
  totpIssuer,
  trustedTotpFactors,
} from "@/lib/auth/two-step";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

/*
 * The step-up itself: set up an authenticator app, then turn a 6-digit
 * code into an aal2 session (src/lib/auth/two-step.ts). These are the only
 * actions under src/app/admin/security/ that don't require aal2 — they are
 * how a session gets it. Neither can change anyone's access: setup adds a
 * factor to your own login only, and a code only raises your own session.
 * They still need an admin, since only admins open Security.
 */

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

export type TwoStepSetup = ActionResult<{
  factorId: string;
  /** An <img src> for the QR code. */
  qrCode: string;
  /** The same key, to type in when the camera can't be used. */
  secret: string;
}>;

/**
 * Starts setting up an authenticator app: a new, unconfirmed TOTP factor
 * and its QR code. It becomes the account's factor only once a code from
 * it is confirmed (confirmTwoStep). A setup abandoned half-way leaves an
 * unconfirmed factor behind, so any earlier one is cleared first — GoTrue
 * wants friendly names unique per login, and the QR code on screen should
 * always be the one that counts.
 */
export async function startTwoStepSetup(): Promise<TwoStepSetup> {
  const { t } = await getT();
  const e = t.admin.security.twoStep.errors;
  return runAction("security.startTwoStepSetup", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return refuse(t.admin.security.errors.adminAccessRequired);

    const factors = user.factors ?? [];
    if (trustedTotpFactors(user).length > 0) return refuse(e.alreadySetUp);
    // A password alone must not enrol an app: an admin opens a first set-up.
    if (!isSetupOpen(user)) return refuse(e.setupNotOpen);
    const admin = createAdminClient();
    for (const factor of factors.filter((f) => f.status !== "verified")) {
      await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
      issuer: totpIssuer(),
    });
    if (error) return unexpectedFailure("security.startTwoStepSetup", error, t.common.somethingWentWrong);

    // auth-js hands back `data:image/svg+xml;utf-8,<svg …>` with the SVG
    // unescaped; a # or % in it would end the URL early, so encode it.
    const svg = data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-8,/, "");
    return {
      ok: true,
      factorId: data.id,
      qrCode: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      secret: data.totp.secret,
    };
  });
}

export type ConfirmTwoStepState = ActionResult | undefined;

/** GoTrue's answers for a code that didn't do it. */
function codeRefusal(error: AuthError, e: { wrongCode: string; expired: string; tooMany: string }) {
  if (error.code === "mfa_verification_failed" || error.code === "mfa_verification_rejected") {
    return e.wrongCode;
  }
  if (error.code === "mfa_challenge_expired") return e.expired;
  if (error.code === "over_request_rate_limit" || error.status === 429) return e.tooMany;
  return null;
}

/**
 * Checks a 6-digit code against the login's own authenticator app and,
 * when it matches, raises this session to aal2 — the new tokens go into
 * the session cookies — then returns to Security. The first code from a
 * newly set-up app also confirms it as the account's factor.
 */
export async function confirmTwoStep(
  _state: ConfirmTwoStepState,
  formData: FormData,
): Promise<ConfirmTwoStepState> {
  const { t } = await getT();
  const e = t.admin.security.twoStep.errors;
  const result = await runAction("security.confirmTwoStep", t.common.somethingWentWrong, async () => {
    if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);

    const code = ((formData.get("code") as string | null) ?? "").replace(/\s+/g, "");
    if (!/^\d{6}$/.test(code)) return refuse(e.codeFormat);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return refuse(t.admin.security.errors.adminAccessRequired);

    // Only a factor of this login's own: a confirmed app, or the one being
    // set up (named by the form). Anything else is refused before GoTrue.
    const factors = (user.factors ?? []).filter((f) => f.factor_type === "totp");
    const wanted = formData.get("factorId") as string | null;
    const trusted = trustedTotpFactors(user)[0];
    const factor = trusted ?? factors.find((f) => f.status !== "verified" && f.id === wanted);
    if (!factor) return refuse(e.noFactor);
    // Confirming a new app binds it to the login: only inside an opened window.
    if (!trusted && !isSetupOpen(user)) return refuse(e.setupNotOpen);

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (error) {
      const words = codeRefusal(error, e);
      return words ? refuse(words) : unexpectedFailure("security.confirmTwoStep", error, t.common.somethingWentWrong);
    }
    if (!trusted) {
      // Bound: this app is now the login's own, and the window closes.
      const admin = createAdminClient();
      const { error: bindError } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { [APPROVED_FACTOR]: factor.id, [SETUP_OPEN_UNTIL]: null },
      });
      if (bindError) {
        return unexpectedFailure("security.confirmTwoStep", bindError, t.common.somethingWentWrong);
      }
    }
    return { ok: true };
  });
  // Outside runAction: nothing to catch, and the redirect is the success.
  if (result.ok) redirect("/admin/security");
  return result;
}
