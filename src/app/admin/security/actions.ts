"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type SecurityFormState = { error: string } | { success: string } | undefined;

const VALID_ROLES = ["admin", "management", "staff", "vet", "volunteer"] as const;

export async function createUser(
  _state: SecurityFormState,
  formData: FormData,
): Promise<SecurityFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;
  const role = formData.get("role") as string | null;

  if (!email) return { error: t.admin.security.errors.emailRequired };
  if (!password || password.length < 8) {
    return { error: t.admin.security.errors.passwordTooShort };
  }
  if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { error: t.admin.security.errors.selectValidRole };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
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
  return { success: t.admin.security.createdUser(email, role) };
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

export async function resetUserPassword(userId: string, password: string) {
  await assertAdminRole();
  const { t } = await getT();
  if (password.length < 8) {
    throw new Error(t.admin.security.errors.passwordTooShort);
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) throw new Error(error.message);
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
