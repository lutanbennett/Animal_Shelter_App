import { Suspense } from "react";
import { Activity, Globe } from "lucide-react";
import { DriveStatus } from "./DriveStatus";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getT } from "@/lib/i18n/get-t";
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
 * listed, Security included, is admin-gated, so the one check covers the
 * whole grid; a manager never reaches this page at all.
 */
export default async function AdminPage() {
  await requireAdminUser();
  const { t } = await getT();

  const tiles: SectionTile[] = [
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
      href: "/admin/status",
      label: t.nav.systemStatus,
      description: t.admin.landing.tiles.systemStatus,
      icon: Activity,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.landing.title}
        </h1>
        <p className="text-sm text-muted">{t.admin.landing.subtitle}</p>
      </div>

      <Suspense fallback={<p className="text-sm text-muted">{t.admin.landing.drive.checking}</p>}>
        <DriveStatus />
      </Suspense>

      <SectionTiles tiles={tiles} />
    </main>
  );
}
