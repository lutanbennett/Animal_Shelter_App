import { createClient } from "@/lib/supabase/server";
import { canManage } from "@/lib/auth/require-management";
import { NavLinks } from "./NavLinks";

export async function NavPane() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: role } = await supabase.rpc("current_user_role");

  return <NavLinks isAdmin={role === "admin"} canManage={canManage(role)} />;
}
