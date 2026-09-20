import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

/**
 * The roles that see the Management section (dashboard, contact
 * management). Admin is a superset of management, so it is always in.
 */
export const MANAGEMENT_ROLES = new Set(["admin", "management"]);

export function canManage(role: string | null | undefined): boolean {
  return role != null && MANAGEMENT_ROLES.has(role);
}

/** Redirects everyone but admin/management away from Management pages. */
export async function requireManagementUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: role } = await supabase.rpc("current_user_role");
  if (!canManage(role)) redirect("/");

  return user;
}

/** Same check for use inside a server action, where redirect() can't be used. */
export async function assertManagementRole() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_user_role");
  if (!canManage(role)) {
    const { t } = await getT();
    throw new Error(t.management.errors.managementAccessRequired);
  }
}
