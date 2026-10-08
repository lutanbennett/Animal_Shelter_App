import { canOpen, routeFor } from "@/lib/permissions/routes";
import { requireAnyPageIn } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { SectionTiles, type SectionTile } from "@/components/SectionTiles";

/**
 * Operations → its landing page: a tile per page of daily work
 * (docs/decisions/2026-10-07-management-settings-split.md, agreed with Lutan 2026-10-08).
 *
 * Only the medication list lives under /operations. The rest keep the addresses the manual,
 * notifications, email and home tiles link to, and moved here only in the menu; the route
 * registry's `section` says so, and is what this page's guard and the sidebar entry ask.
 *
 * Gated per tile by each page's own activity, like Management's tiles: moving a page here changed
 * nobody's access. It opens for anyone who can open one tile, so staff and volunteers, who never
 * had Management or Settings, have this section in their menu.
 */
const TILES: { href: string; description: (t: Dictionary) => string }[] = [
  { href: "/enclosures", description: (t) => t.operations.landing.tiles.enclosures },
  { href: "/operations/medication-list", description: (t) => t.operations.landing.tiles.medicationList },
  { href: "/maintenance", description: (t) => t.operations.landing.tiles.maintenance },
  { href: "/stocktake", description: (t) => t.operations.landing.tiles.stocktake },
  { href: "/deliveries", description: (t) => t.operations.landing.tiles.deliveries },
  { href: "/projects", description: (t) => t.operations.landing.tiles.projects },
  { href: "/vets", description: (t) => t.operations.landing.tiles.vets },
  { href: "/contacts", description: (t) => t.operations.landing.tiles.contacts },
];

export default async function OperationsPage() {
  const { perms } = await requireAnyPageIn("operations");
  const { t } = await getT();

  const tiles: SectionTile[] = TILES.flatMap(({ href, description }) => {
    const route = routeFor(href);
    return route && canOpen(perms, route)
      ? [{ href, label: route.label(t), description: description(t), icon: route.icon }]
      : [];
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.operations.landing.title}</h1>
        <p className="text-sm text-muted">{t.operations.landing.subtitle}</p>
      </div>

      <SectionTiles tiles={tiles} />
    </main>
  );
}
