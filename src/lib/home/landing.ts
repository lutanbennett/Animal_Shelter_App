import "server-only";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Permissions } from "@/lib/permissions/can";
import { loadCardsByRole } from "@/lib/home/roles";
import { cardTilesFor, type HomeTile } from "@/lib/home/tiles";

/**
 * The Operations and Management landing pages, drawn from the role's groups (0241,
 * docs/decisions/2026-10-21-tile-groups-app.md). A role whose group of that name holds cards leads its landing page with
 * them, in the group's order, exactly as the group's own page draws them (cardTilesFor, against the reader's own
 * permissions). Every other page the landing lists follows, still filtered by each page's own guard.
 *
 * Leading, not replacing: a landing page is also how a role reaches pages no card opens (Translations, Who does what),
 * and scripts/check-menu-coverage.mjs counts them reachable from it. Showing only the group would take those away the
 * day someone drags a card in, which is the opposite of "nothing moves on the day".
 *
 * A group is matched to a landing by its English name, the name 0241 seeded (Operations, Management), so a group renamed
 * to something else is a group of its own and no longer leads the landing.
 */
export async function landingGroupTiles(perms: Permissions, section: "operations" | "management", t: Dictionary): Promise<HomeTile[]> {
  if (perms.isAdmin) return [];
  const keys = perms.roles.length > 0 ? perms.roles : [perms.role.key];
  const byRole = await loadCardsByRole(keys, "en");
  const seen = new Set<string>();
  const tiles: HomeTile[] = [];
  for (const key of keys) {
    const home = byRole[key];
    const group = home?.groups.find((g) => g.label.trim().toLowerCase() === section);
    if (!home || !group) continue;
    // Draw only this group (its tiles are labelled from t, so in the reader's language), with the cards it holds.
    const asRole: Permissions = { ...perms, role: { ...perms.role, key } };
    const door = cardTilesFor(home.cards, asRole, t, undefined, [{ ...group, label: "" }]).find((x) => x.inside);
    for (const tile of door?.inside ?? []) {
      if (seen.has(tile.href)) continue;
      seen.add(tile.href);
      tiles.push(tile);
    }
  }
  return tiles;
}

/** A landing's own list with the group's tiles first, in the group's order; a group tile the list lacks is added. */
export function leadWith<T extends { href: string }>(list: T[], lead: HomeTile[], make: (tile: HomeTile) => T): T[] {
  const first = lead.map((x) => list.find((y) => y.href === x.href) ?? make(x));
  return [...first, ...list.filter((y) => !lead.some((x) => x.href === y.href))];
}
