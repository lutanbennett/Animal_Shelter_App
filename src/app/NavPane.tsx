import { createClient } from "@/lib/supabase/server";
import { can, entersApp } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { canOpen, opensAnyIn, pagesIn, routeFor } from "@/lib/permissions/routes";
import { todayIso } from "@/lib/format";
import { countMyUrgentAccessRequests } from "@/lib/my-tasks/access-requests";
import { countMyUrgentMaintenance } from "@/lib/my-tasks/maintenance";
import { countMyUrgentRecurring } from "@/lib/my-tasks/recurring";
import { showMenuForLogin } from "@/lib/menu/show-menu";
import { NavLinks } from "./NavLinks";

export async function NavPane() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const perms = await loadPermissions();

  // A public viewer reaches an app-chrome page only to change a temporary
  // password; a menu of pages it would be bounced from is no use to it.
  if (!perms || !entersApp(perms)) return null;

  // Tiles only for a role whose Show the menu setting is off (Admin always keeps it).
  if (!(await showMenuForLogin())) return null;

  // Whether the menu offers a registered page: the same question its guard asks.
  const opens = (path: string) => {
    const route = routeFor(path);
    return !!route && canOpen(perms, route);
  };

  // The My tasks badge: what is due today or overdue across its sources.
  const today = todayIso();
  const [accessCount, maintenanceCount, recurringCount] = await Promise.all([
    perms.isAdmin ? countMyUrgentAccessRequests() : 0,
    opens("/maintenance") ? countMyUrgentMaintenance(supabase, user.id, today) : 0,
    countMyUrgentRecurring(supabase, user.id, today),
  ]);
  const urgentCount = accessCount + maintenanceCount + recurringCount;

  return (
    <NavLinks
      canSecurity={perms.isAdmin}
      // A landing opens for whoever may open one page in its section: the question its guard asks.
      canSettings={opensAnyIn(perms, "settings")}
      canManagement={opensAnyIn(perms, "management")}
      // Two or more pages, or the section would only repeat the one tile Home already has.
      canOperations={pagesIn(perms, "operations") > 1}
      // The list is the whole record: a login with no read of it would open an empty list (requireFullResident asks the same).
      canResidents={can(perms, "resident.record", "read")}
      hasTasks={can(perms, "recurring.do_own")}
      canAppointments={opens("/appointments")}
      urgentCount={urgentCount}
    />
  );
}
