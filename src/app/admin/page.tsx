import { Suspense } from "react";
import { Activity, Globe, History } from "lucide-react";
import { DriveStatus } from "./DriveStatus";
import { can } from "@/lib/permissions/can";
import { canOpen, routeFor } from "@/lib/permissions/routes";
import { requireAnyPageUnder } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { listHomeRoles } from "@/lib/home/roles";
import { HomeSwitch } from "@/components/HomeSwitch";
import { SectionTiles, type SectionTile } from "@/components/SectionTiles";
import {
  ENCLOSURE_ICONS,
  NAV_ICONS,
  SECTION_ICONS,
} from "@/components/hub-icons";

/**
 * Settings → its landing page: a tile per admin page. "Settings" is the
 * menu's name for /admin since 2026-09-23; the URL and the admin role kept
 * theirs. The sidebar lists only Settings itself, so this grid is the menu
 * for everything under it.
 *
 * Security is also pinned to the bottom of the sidebar (2026-09-22), but it
 * is still admin configuration and belongs on this page too — its tile
 * says where else to find it. Every page
 * listed asks its own activity (the route registry), and the grid shows only
 * the tiles this person may open; Security is the one that is an Admin rule
 * rather than an activity. The page opens for whoever can open one of them,
 * which today is Admin alone.
 */
export default async function AdminPage() {
  const { perms, supabase } = await requireAnyPageUnder("/admin");
  const { t } = await getT();

  const allTiles: SectionTile[] = [
    {
      href: "/admin/website",
      label: t.nav.website,
      description: t.admin.landing.tiles.website,
      icon: Globe,
    },
    {
      href: "/admin/enclosures",
      label: t.nav.enclosures,
      description: t.admin.landing.tiles.enclosures,
      icon: ENCLOSURE_ICONS.enclosure,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/admin/zones",
      label: t.nav.zones,
      description: t.admin.landing.tiles.zones,
      icon: ENCLOSURE_ICONS.zone,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/admin/facility-map",
      label: t.nav.facilityMap,
      description: t.admin.landing.tiles.facilityMap,
      icon: ENCLOSURE_ICONS.map,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/admin/immunization-types",
      label: t.nav.immunizationTypes,
      description: t.admin.landing.tiles.immunizationTypes,
      icon: SECTION_ICONS.immunizations,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/admin/procedure-types",
      label: t.nav.procedureTypes,
      description: t.admin.landing.tiles.procedureTypes,
      icon: SECTION_ICONS.procedures,
    },
    {
      href: "/admin/blood-test-types",
      label: t.nav.bloodTestTypes,
      description: t.admin.landing.tiles.bloodTestTypes,
      icon: SECTION_ICONS["blood-tests"],
    },
    {
      href: "/admin/frequencies",
      label: t.nav.frequencies,
      description: t.admin.landing.tiles.frequencies,
      icon: SECTION_ICONS.prescriptions,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/admin/security",
      label: t.nav.security,
      description: t.admin.landing.tiles.security,
      icon: NAV_ICONS.security,
    },
    {
      href: "/admin/recent-changes",
      label: t.nav.recentChanges,
      description: t.admin.landing.tiles.recentChanges,
      icon: History,
    },
    {
      href: "/admin/status",
      label: t.nav.systemStatus,
      description: t.admin.landing.tiles.systemStatus,
      icon: Activity,
    },
  ];
  const tiles = allTiles.filter((tile) => {
    if (tile.href === "/admin/security") return perms.isAdmin;
    const route = routeFor(tile.href);
    return !!route && canOpen(perms, route);
  });

  const homeRoles = perms.isAdmin ? await listHomeRoles(supabase) : [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      {perms.isAdmin && <HomeSwitch roles={homeRoles} current="settings" />}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.landing.title}
        </h1>
        <p className="text-sm text-muted">{t.admin.landing.subtitle}</p>
      </div>

      {can(perms, "system.status") && (
        <Suspense fallback={<p className="text-sm text-muted">{t.admin.landing.drive.checking}</p>}>
          <DriveStatus />
        </Suspense>
      )}

      <SectionTiles tiles={tiles} />
    </main>
  );
}
