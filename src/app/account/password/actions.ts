"use server";

import { redirect } from "next/navigation";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import {
  MIN_PASSWORD_LENGTH,
  MUST_CHANGE_PASSWORD,
  mustChangePassword,
  requiresCurrentPassword,
} from "@/lib/auth/password-change";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type ChangePasswordState = { error: string } | { success: true } | undefined;

/**
 * The signed-in user sets their own password. Two callers: the forced
 * change after a temporary password (the proxy sends them here and
 * nowhere else), and anyone changing theirs by choice. The must-change
 * flag lives in app_metadata, which only the service role can write, so
 * clearing it goes through the admin client — after the password has
 * actually been replaced, never before.
 *
 * A change by choice must also prove the current password, checked here
 * and not in the form: auth.updateUser() does not ask for it, so anyone
 * who can post to this action would otherwise skip a browser-side check.
 * Whether it is owed is read from the session (requiresCurrentPassword),
 * never from the form. After a change every other session is signed out.
 */
export async function changeOwnPassword(
  _state: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const { t } = await getT();
  const e = t.account.password.errors;

  const password = formData.get("password");
  const confirm = formData.get("confirm");
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return { error: e.tooShort(MIN_PASSWORD_LENGTH) };
  }
  if (password !== confirm) return { error: e.mismatch };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (requiresCurrentPassword(user, (await supabase.auth.getSession()).data.session?.access_token)) {
    const current = formData.get("current");
    if (typeof current !== "string" || current === "") return { error: e.currentRequired };
    // Fail closed: no email on the account, or a check that cannot run,
    // refuses the change rather than skipping the proof.
    if (!user.email) return { error: e.cannotVerify };
    // A throwaway client, so the check neither touches this session's
    // cookies nor leaves a second session behind.
    const verifier = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { error: signInError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInError) {
      if (signInError.status === 400 || /invalid login credentials/i.test(signInError.message)) {
        return { error: e.currentWrong };
      }
      return { error: e.cannotVerify };
    }
    await verifier.auth.signOut();
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Supabase refuses the same password again; say so in our words.
    if (/different from the old password/i.test(error.message)) return { error: e.samePassword };
    return { error: error.message };
  }

  if (mustChangePassword(user)) {
    const admin = createAdminClient();
    const { error: flagError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, [MUST_CHANGE_PASSWORD]: false },
    });
    if (flagError) return { error: flagError.message };
  }

  // Someone changes their password because they fear another device has
  // the account; Supabase leaves those sessions alive unless told not to.
  const { error: othersError } = await supabase.auth.signOut({ scope: "others" });
  if (othersError) return { error: e.othersNotSignedOut };

  // Forced change and recovery both go on into the app; a change by choice
  // stays on the page with a confirmation.
  if (formData.get("continue") === "1") redirect(DEFAULT_SIGNED_IN_PATH);
  return { success: true };
}
