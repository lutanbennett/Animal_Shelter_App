import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { requireRole } from "./require-role";

/** Sends non-admins to the no-access page (require-role.ts). Returns the current user. */
export async function requireAdminUser() {
  const { user } = await requireRole((role) => role === "admin");
  return user;
}

/**
 * Whether the signed-in user is an admin, for a server action that
 * returns its refusal rather than throwing (src/lib/action-result.ts).
 */
export async function hasAdminRole() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_user_role");
  return role === "admin";
}

/** Same check for use inside a server action, where redirect() can't be used. */
export async function assertAdminRole() {
  if (!(await hasAdminRole())) {
    const { t } = await getT();
    throw new Error(t.admin.security.errors.adminAccessRequired);
  }
}
