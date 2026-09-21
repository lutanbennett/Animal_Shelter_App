"use server";

import { getSiteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type ForgotPasswordState = { error: string } | { sent: true } | undefined;

/**
 * Asks Supabase to email a recovery link. The link returns to
 * /auth/callback, which exchanges it for a session and sends the person
 * on to /account/password?reset=1 to choose a new password. The reply is
 * the same whether or not the address has an account, so the form can't
 * be used to find out who has a login; Supabase's own rate limit applies.
 * Emails only go out once the project has an SMTP provider (README).
 */
export async function requestPasswordReset(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const { t } = await getT();
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    return { error: t.login.forgot.errors.emailRequired };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${await requestOrigin()}/auth/callback?next=${encodeURIComponent("/account/password?reset=1")}`,
  });
  // A rate-limit or config error is worth showing; "user not found" is
  // deliberately not distinguished from success.
  if (error && !/not found/i.test(error.message)) return { error: error.message };
  return { sent: true };
}

/** Where the recovery link returns to — see requestOrigin() in ../actions.ts. */
async function requestOrigin() {
  return (await getSiteOrigin())?.origin ?? "http://localhost:3000";
}
