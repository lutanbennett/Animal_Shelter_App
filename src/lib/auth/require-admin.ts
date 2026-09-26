import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

/** Redirects non-admins away from admin-only pages. Returns the current user. */
export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: role } = await supabase.rpc("current_user_role");
  if (role !== "admin") redirect("/");

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
