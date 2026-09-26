import { createClient } from "@/lib/supabase/server";
import { hasAppAccess } from "@/lib/auth/app-access";
import { canManage } from "@/lib/auth/require-management";
import { NavLinks } from "./NavLinks";

export async function NavPane() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: role } = await supabase.rpc("current_user_role");

  // A public viewer reaches an app-chrome page only to change a temporary
  // password; a menu of pages it would be bounced from is no use to it.
  if (!hasAppAccess(role)) return null;

  return <NavLinks isAdmin={role === "admin"} canManage={canManage(role)} />;
}
