import { createClient } from "@/lib/supabase/server";
import { hasAppAccess, isShelterRole } from "@/lib/auth/app-access";
import { canManage } from "@/lib/auth/require-management";
import { canStocktake } from "@/lib/management/stocktake";
import { todayIso } from "@/lib/format";
import { canReadMaintenance } from "@/lib/maintenance/queries";
import { countMyUrgentAccessRequests } from "@/lib/my-tasks/access-requests";
import { countMyUrgentMaintenance } from "@/lib/my-tasks/maintenance";
import { countMyUrgentRecurring } from "@/lib/my-tasks/recurring";
import { canReadRecurringJobs } from "@/lib/recurring-jobs/access";
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
  const today = todayIso();
  const [accessCount, maintenanceCount, recurringCount] = await Promise.all([
    role === "admin" ? countMyUrgentAccessRequests() : 0,
    canReadMaintenance(role) ? countMyUrgentMaintenance(supabase, user.id, today) : 0,
    canReadRecurringJobs(role) ? countMyUrgentRecurring(supabase, user.id, today) : 0,
  ]);
  const urgentCount = accessCount + maintenanceCount + recurringCount;

  return (
    <NavLinks
      isAdmin={role === "admin"}
      canManage={canManage(role)}
      isShelter={isShelterRole(role)}
      canStocktake={canStocktake(role)}
      urgentCount={urgentCount}
    />
  );
}
