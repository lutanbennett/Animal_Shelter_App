import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { ROUTES, canOpen, routeFor } from "@/lib/permissions/routes";
import { todayIso } from "@/lib/format";
import { countMyUrgentAccessRequests } from "@/lib/my-tasks/access-requests";
import { countMyUrgentMaintenance } from "@/lib/my-tasks/maintenance";
import { countMyUrgentRecurring } from "@/lib/my-tasks/recurring";
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
  if (!perms?.role.opensApp) return null;

  // Whether the menu offers a registered page: the same question its guard asks.
  const opens = (path: string) => {
    const route = routeFor(path);
    return !!route && canOpen(perms, route);
  };
  // A landing page (Management, Settings) opens for whoever may open one page under it.
  const opensAnyUnder = (prefix: string) => ROUTES.some((r) => r.path.startsWith(prefix + "/") && canOpen(perms, r));

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
      canSettings={opensAnyUnder("/admin")}
      canManagement={opensAnyUnder("/management")}
      hasTasks={can(perms, "recurring.do_own")}
      canAppointments={opens("/appointments")}
      canEnclosures={opens("/enclosures")}
      canMaintenance={opens("/maintenance")}
      canVets={opens("/vets")}
      canContacts={opens("/contacts")}
      canProjects={opens("/projects")}
      canStocktake={can(perms, "stock.count")}
      canDeliveries={can(perms, "stock.delivery")}
      urgentCount={urgentCount}
    />
  );
}
