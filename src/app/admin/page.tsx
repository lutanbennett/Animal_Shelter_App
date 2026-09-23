import { Globe, ShieldCheck } from "lucide-react";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getT } from "@/lib/i18n/get-t";
import { SectionTiles, type SectionTile } from "@/components/SectionTiles";
import { ENCLOSURE_ICONS, SECTION_ICONS } from "@/components/hub-icons";

/**
 * Admin → the group's own landing page: a tile per page the Admin nav group
 * lists, in the same order. It used to redirect to the first page in the
 * group, which stopped reading as a section once the group grew past a
 * handful of links (user, 2026-09-23).
 *
 * Security moved to the pinned footer group in the nav on 2026-09-22 and so
 * isn't in the Admin group any more, but it is still admin configuration and
 * belongs on this page — its tile says where else to find it. Every page
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
    },
    {
      href: "/admin/zones",
      label: t.nav.zones,
      description: t.admin.landing.tiles.zones,
      icon: ENCLOSURE_ICONS.zone,
    },
    {
      href: "/admin/immunization-types",
      label: t.nav.immunizationTypes,
      description: t.admin.landing.tiles.immunizationTypes,
      icon: SECTION_ICONS.immunizations,
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
      href: "/admin/security",
      label: t.nav.security,
      description: t.admin.landing.tiles.security,
      icon: ShieldCheck,
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

      <SectionTiles tiles={tiles} />
    </main>
  );
}
