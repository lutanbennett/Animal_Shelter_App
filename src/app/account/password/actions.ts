"use server";

import { redirect } from "next/navigation";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import { MIN_PASSWORD_LENGTH, MUST_CHANGE_PASSWORD, mustChangePassword } from "@/lib/auth/password-change";
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

  // Forced change and recovery both go on into the app; a change by choice
  // stays on the page with a confirmation.
  if (formData.get("continue") === "1") redirect(DEFAULT_SIGNED_IN_PATH);
  return { success: true };
}
