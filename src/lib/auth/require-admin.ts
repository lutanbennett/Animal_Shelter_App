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

/** Same check for use inside a server action, where redirect() can't be used. */
export async function assertAdminRole() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_user_role");
  if (role !== "admin") {
    const { t } = await getT();
    throw new Error(t.admin.security.errors.adminAccessRequired);
  }
}
