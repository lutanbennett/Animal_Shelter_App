import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { requireRole } from "./require-role";

/**
 * The roles that see the Management section (dashboard, contact
 * management). Admin is a superset of management, so it is always in.
 */
export const MANAGEMENT_ROLES = new Set(["admin", "management"]);

export function canManage(role: string | null | undefined): boolean {
  return role != null && MANAGEMENT_ROLES.has(role);
}

/** Sends everyone but admin/management to the no-access page (require-role.ts). */
export async function requireManagementUser() {
  const { user } = await requireRole(canManage);
  return user;
}

/**
 * Whether the signed-in user is admin or management, for a server action
 * that returns its refusal rather than throwing (src/lib/action-result.ts).
 */
export async function hasManagementRole() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_user_role");
  return canManage(role);
}

/** Same check for use inside a server action, where redirect() can't be used. */
export async function assertManagementRole() {
  if (!(await hasManagementRole())) {
    const { t } = await getT();
    throw new Error(t.management.errors.managementAccessRequired);
  }
}
