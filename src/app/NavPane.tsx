import { createClient } from "@/lib/supabase/server";
import { hasAppAccess } from "@/lib/auth/app-access";
import { canManage } from "@/lib/auth/require-management";
import { canStocktake } from "@/lib/management/stocktake";
import { todayIso } from "@/lib/format";
import { canReadMaintenance } from "@/lib/maintenance/queries";
import { countMyUrgentMaintenance } from "@/lib/my-tasks/maintenance";
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

  // The My tasks badge: what is due today or overdue across its sources.
  const urgentCount = canReadMaintenance(role)
    ? await countMyUrgentMaintenance(supabase, user.id, todayIso())
    : 0;

  return (
    <NavLinks
      isAdmin={role === "admin"}
      canManage={canManage(role)}
      canStocktake={canStocktake(role)}
      urgentCount={urgentCount}
    />
  );
}
