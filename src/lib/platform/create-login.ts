import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTemporaryPassword } from "@/lib/auth/temp-password";
import { MUST_CHANGE_PASSWORD } from "@/lib/auth/password-change";
import { SETUP_OPEN_UNTIL, setupWindowEnd } from "@/lib/auth/two-step";

/*
 * The one service-role call behind "create a shelter's first Admin login" (#flogn, 0425). It must only be called AFTER
 * product_admin_permit_first_login has answered through the signed-in client (PADMIN, aal2, first login for that shelter,
 * address unused): src/app/platform/actions.ts does that. It touches no table, only the auth login.
 */
type CreatedLogin = { id: string; temporaryPassword: string } | { error: { code?: string } };

export async function createAuthLogin(email: string): Promise<CreatedLogin> {
  const temporaryPassword = generateTemporaryPassword();
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    app_metadata: { [MUST_CHANGE_PASSWORD]: true, [SETUP_OPEN_UNTIL]: setupWindowEnd() },
  });
  if (error || !data.user) return { error: { code: error?.code } };
  return { id: data.user.id, temporaryPassword };
}

/** Undo createAuthLogin when linking failed, so no orphaned login is left. */
export async function deleteAuthLogin(id: string): Promise<void> {
  await createAdminClient().auth.admin.deleteUser(id);
}
