import { Coins, HeartHandshake, LayoutDashboard, Languages } from "lucide-react";
import { requireManagementUser } from "@/lib/auth/require-management";
import { getT } from "@/lib/i18n/get-t";
import { SectionTiles, type SectionTile } from "@/components/SectionTiles";
import { CONTACT_ICONS, SECTION_ICONS, VET_ICONS } from "@/components/hub-icons";

/**
 * Management → the group's own landing page: a tile per page the Management
 * nav group lists, in the same order. The menus have grown past the point
 * where a nested accordion is a comfortable way in (user, 2026-09-23), so
 * the group label now opens this instead of redirecting to the dashboard.
 *
 * Every page in the group is management-gated, so the whole grid is behind
 * the one check — there is nothing here a manager may not open.
 */
export default async function ManagementPage() {
  await requireManagementUser();
  const { t } = await getT();

  const tiles: SectionTile[] = [
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
