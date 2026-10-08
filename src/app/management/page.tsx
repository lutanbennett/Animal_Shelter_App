import { Coins, Globe, HeartHandshake, LayoutDashboard, Languages, Scale, ShoppingCart } from "lucide-react";
import { canOpen, routeFor } from "@/lib/permissions/routes";
import { requireAnyPageIn } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { SectionTiles, type SectionTile } from "@/components/SectionTiles";
import { CONTACT_ICONS, NAV_ICONS, SECTION_ICONS, VET_ICONS } from "@/components/hub-icons";

/**
 * Management → the group's own landing page: a tile per page the route registry
 * puts in the Management section (sectionOf), which includes /admin/website. The menus have grown past the point
 * where a nested accordion is a comfortable way in (user, 2026-09-23), so
 * the group label now opens this instead of redirecting to the dashboard.
 *
 * The grid is filtered by the same question each page's own guard asks (the
 * route registry), so a person sees only the tiles they can open, and the
 * page itself opens for whoever can open at least one of them.
 */
export default async function ManagementPage() {
  const { perms } = await requireAnyPageIn("management");
  const { t } = await getT();

  const allTiles: SectionTile[] = [
    {
      href: "/management/dashboard",
      label: t.nav.dashboard,
      description: t.management.landing.tiles.dashboard,
      icon: LayoutDashboard,
    },
    {
      href: "/management/contacts",
      label: t.nav.contacts,
      description: t.management.landing.tiles.contacts,
      icon: CONTACT_ICONS.contact,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/management/shelter-friends",
      label: t.nav.shelterFriends,
      description: t.management.landing.tiles.shelterFriends,
      icon: HeartHandshake,
    },
    // Keeps its /admin address; the Director runs the website by day as Management (Lutan, 2026-10-08).
    {
      href: "/admin/website",
      label: t.nav.website,
      description: t.admin.landing.tiles.website,
      icon: Globe,
    },
    {
      href: "/management/vets",
      label: t.nav.vets,
      description: t.management.landing.tiles.vets,
      icon: VET_ICONS.vet,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/management/medications",
      label: t.nav.medications,
      description: t.management.landing.tiles.medications,
      icon: SECTION_ICONS.prescriptions,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/management/diets",
      label: t.nav.diets,
      description: t.management.landing.tiles.diets,
      icon: SECTION_ICONS.diet,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/management/recurring-jobs",
      label: t.nav.recurringJobs,
      description: t.management.landing.tiles.recurringJobs,
      icon: NAV_ICONS.recurringJobs,
    },
    {
      href: "/management/stock-usage",
      label: t.nav.stockUsage,
      description: t.management.landing.tiles.stockUsage,
      icon: Scale,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/management/purchasing",
      label: t.nav.purchasing,
      description: t.management.landing.tiles.purchasing,
      icon: ShoppingCart,
      phoneNote: t.largerScreen.tileLabel,
    },
    {
      href: "/management/cashflow",
      label: t.nav.cashflow,
      description: t.management.landing.tiles.cashflow,
      icon: Coins,
    },
    {
      href: "/management/translations",
      label: t.nav.translations,
      description: t.management.landing.tiles.translations,
      icon: Languages,
    },
  ];
  const tiles = allTiles.filter((tile) => {
    const route = routeFor(tile.href);
    return !!route && canOpen(perms, route);
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.management.landing.title}
        </h1>
        <p className="text-sm text-muted">{t.management.landing.subtitle}</p>
      </div>

      <SectionTiles tiles={tiles} />
    </main>
  );
}
