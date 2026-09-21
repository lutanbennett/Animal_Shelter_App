"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { MUST_CHANGE_PASSWORD } from "@/lib/auth/password-change";
import { generateTemporaryPassword } from "@/lib/auth/temp-password";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type SecurityFormState =
  | { error: string }
  | { success: string; temporaryPassword: string; email: string }
  | undefined;

const VALID_ROLES = ["admin", "management", "staff", "vet", "volunteer"] as const;

/**
 * Creates a login with a generated temporary password and the
 * must-change flag set (src/lib/auth/password-change.ts). The password is
 * returned once, for the admin to pass on; it is never stored in clear or
 * shown again — issuing a new one is the only recovery. A Google-only
 * user simply never uses it.
 */
export async function createUser(
  _state: SecurityFormState,
  formData: FormData,
): Promise<SecurityFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const email = (formData.get("email") as string | null)?.trim();
  const role = formData.get("role") as string | null;

  if (!email) return { error: t.admin.security.errors.emailRequired };
  if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: t.admin.security.errors.selectValidRole };
  }

  const temporaryPassword = generateTemporaryPassword();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    app_metadata: { [MUST_CHANGE_PASSWORD]: true },
  });

  if (error) return { error: error.message };

  const { error: roleError } = await admin
    .from("user_roles")
    .insert({ user_id: data.user.id, role });

  if (roleError) {
    // Don't leave an orphaned login with no role if this half fails.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: roleError.message };
  }

  revalidatePath("/admin/security");
  return { success: t.admin.security.createdUser(email, role), temporaryPassword, email };
}

export async function updateUserRole(userId: string, role: string) {
  await assertAdminRole();
  const { t } = await getT();
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    throw new Error(t.admin.security.errors.invalidRole);
  }

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser?.id === userId) {
    throw new Error(t.admin.security.errors.cantChangeOwnRole);
  }

  const admin = createAdminClient();
  const { error } = await admin.from("user_roles").upsert({ user_id: userId, role });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/security");
}

/**
 * The admin's "reset password": a fresh temporary password, returned once,
 * and the must-change flag set again so the person picks their own at the
 * next sign-in. An admin can't issue one for themselves — they change
 * their own password at /account/password like anyone else.
 */
export async function issueTemporaryPassword(userId: string): Promise<string> {
  await assertAdminRole();
  const { t } = await getT();

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (currentUser?.id === userId) {
    throw new Error(t.admin.security.errors.cantResetOwnPassword);
  }

  const temporaryPassword = generateTemporaryPassword();
  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin.auth.admin.getUserById(userId);
  if (lookupError) throw new Error(lookupError.message);

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: temporaryPassword,
    app_metadata: { ...existing.user.app_metadata, [MUST_CHANGE_PASSWORD]: true },
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/security");
  return temporaryPassword;
}

export async function deleteUser(userId: string) {
  await assertAdminRole();
  const { t } = await getT();

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser?.id === userId) {
    throw new Error(t.admin.security.errors.cantDeleteOwnAccount);
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/security");
}
