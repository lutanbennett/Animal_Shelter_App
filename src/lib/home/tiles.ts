/**
 * A role's home screen, derived and not written out (§8): the pages it may open, from the
 * route registry, one tile each. Ordering and grouping live here beside the registry, not in
 * it, because a home belongs to a role and a page belongs to a task. Pure and client-safe.
 *
 * What a tile is: a registry entry, plus two that are not in it because they ask no activity
 * (My tasks, which is recurring.do_own's; Residents, which opens for every role that opens the
 * app). A record-scoped page is never here: the registry does not hold one, and that is the
 * contract.
 */
import { Receipt, Sparkles, type LucideIcon } from "lucide-react";
import { groupIcon } from "@/lib/home/group-icons";
import { canUseBills } from "@/lib/bills/access";
import { NAV_ICONS } from "@/components/hub-icons";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can, type Permissions } from "@/lib/permissions/can";
import { CARDS, includedCards, type CardKey } from "@/lib/permissions/cards";
import { canOpen, opensAnyIn, routeFor, routesFor, type RouteEntry } from "@/lib/permissions/routes";

/** Counts shown on tiles (what the left menu's badge showed): due today or overdue. */
export type TileCounts = {
  my?: number;
  maintenance?: number;
  billsWaiting?: number;
  /** Resident photos waiting for approval; only a login that may publish is given a number (countPhotosWaiting). */
  photosWaiting?: number;
};

export type HomeTile = {
  href: string;
  /** In the person's language: resolved here, since two pages with one word are one tile. */
  label: string;
  icon: LucideIcon;
  /** A count shown on the tile (bills waiting), when there is one to show. */
  badge?: string;
  /** A group's doorway tile (role_groups, 0241): the tiles behind it. A group grants nothing, so these are drawn
   * exactly as they would be on the home, by cardTile() against the same permissions. */
  inside?: HomeTile[];
};

/**
 * A group on a role's home (0241): a doorway tile that opens a page of the cards inside it. `label` is already in the
 * reader's language; `cards` are the role's own cards. Presentation only: it grants nothing.
 */
export type RoleGroup = { id: string; label: string; icon: string; cards: readonly CardKey[] };

/** A role's cards (every one, in order) and the groups some of them sit in. */
export type RoleCards = { cards: readonly CardKey[]; groups: readonly RoleGroup[] };

/** Where a group's page lives; the home's doorway tile opens it. */
export const groupHref = (id: string) => `/home/group/${id}`;

const asRoleCards = (home: readonly CardKey[] | RoleCards | undefined): RoleCards | undefined =>
  !home ? undefined : "cards" in home ? (home as RoleCards) : { cards: home as readonly CardKey[], groups: [] };

/**
 * Hand-chosen order for the default roles (§8 point 3), after the two leading tiles. A path not
 * listed follows in registry order, so a role a shelter adds is coherent without an entry here.
 * (Staff had one until it was retired, 0173.)
 */
const ORDER: Record<string, readonly string[]> = {
  management: [
    "/management/recurring-jobs",
    "/management/clinics",
    "/operations/medication-list",
    "/management/dashboard",
    "/management/contacts",
    "/maintenance",
  ],
};

const rank = (r: RouteEntry) => (r.level === "read" ? 1 : 2);

function billsTile(perms: Permissions, t: Dictionary, billsWaiting: number | undefined): HomeTile[] {
  if (!canUseBills(perms)) return [];
  return [{ href: "/bills", label: t.bills.tile.title, icon: Receipt, ...(billsWaiting ? { badge: t.bills.tile.waiting(billsWaiting) } : {}) }];
}

/**
 * Pages a card opens that are not in the route registry, each with the test its own page uses . Everything else a card opens is a registry entry, tested by canOpen().
 */
export const OUTSIDE_REGISTRY: Record<string, { icon: LucideIcon; open: (p: Permissions) => boolean }> = {
  "/residents": { icon: NAV_ICONS.residents, open: (p) => can(p, "resident.record", "read") },
  "/bills": { icon: Receipt, open: canUseBills },
  "/assistant": { icon: Sparkles, open: (p) => can(p, "assistant.ask") },
  "/my": { icon: NAV_ICONS.my, open: (p) => can(p, "recurring.do_own") },
  "/operations": { icon: NAV_ICONS.shelterOperations, open: (p) => opensAnyIn(p, "operations") },
  "/management": { icon: NAV_ICONS.management, open: (p) => opensAnyIn(p, "management") },
};

/**
 * Why a held card draws no tile: the page it opens, and what is missing for it. A role's cells are
 * exactly the union of its cards' grants (0257), so a card whose page is refused is refused by one of these hard-coded
 * activities (routes.ts page rules, OUTSIDE_REGISTRY), because the role has not been given the access that opens it. Null when the page opens.
 */
export function tileBlock(key: CardKey, perms: Permissions): { page: string; rule: string } | null {
  const page = CARDS[key].opens;
  const outside = OUTSIDE_REGISTRY[page];
  if (outside) return outside.open(perms) ? null : { page, rule: `${page} needs an activity this role does not hold (src/lib/home/tiles.ts)` };
  const route = routeFor(page);
  if (!route) return { page, rule: `${page} is in neither the page registry (routes.ts) nor OUTSIDE_REGISTRY` };
  if (canOpen(perms, route)) return null;
  return { page, rule: `routes.ts: ${page} needs ${route.activity} at ${route.level}${route.alsoActivity ? ` (or ${route.alsoActivity})` : ""}` };
}

/** Whether a role's tile for this card can be drawn: its page opens for the role. What the card gives is the database's business. */
export function cardTile(key: CardKey, perms: Permissions, t: Dictionary, billsWaiting?: number): HomeTile | null {
  const card = CARDS[key];
  const page = card.opens;
  // No tile for a page the role cannot open: a tile would invent access. The card is not lost from sight, though:
  // cardsWithoutTile() names it and the home says so.
  if (tileBlock(key, perms)) return null;
  const icon = OUTSIDE_REGISTRY[page]?.icon ?? routeFor(page)?.icon;
  if (!icon) return null;
  const badge = page === "/bills" && billsWaiting ? { badge: t.bills.tile.waiting(billsWaiting) } : {};
  return { href: page, label: card.label(t), icon, ...badge };
}

/**
 * The held cards that draw no tile, each with the page and what it lacks: what the home says out loud so that a card which
 * opens nothing is never silent. A card another held card includes (View residents under Residents) is not listed.
 */
export function cardsWithoutTile(held: readonly CardKey[], perms: Permissions): { key: CardKey; page: string; rule: string }[] {
  return held.flatMap((key) => {
    const block = isSubsumed(key, held) ? null : tileBlock(key, perms);
    return block ? [{ key, ...block }] : [];
  });
}

/**
 * The home of a role that has cards (role_cards, 0194): its cards in the order it keeps them, one tile each. A card
 * another held card includes and shares its page with (View residents under Residents) is that card's tile, not a
 * second one. Roles with no cards get the derived home below, as a role a shelter creates always did.
 */
/** A card another held card includes and shares its page with (View residents under Residents) draws no tile of its own. */
export function isSubsumed(key: CardKey, held: readonly CardKey[]): boolean {
  return held.some((o) => o !== key && CARDS[o].opens === CARDS[key].opens && includedCards(o).includes(key));
}

export function cardTilesFor(held: readonly CardKey[], perms: Permissions, t: Dictionary, billsWaiting?: number, groups: readonly RoleGroup[] = []): HomeTile[] {
  const tilesOf = (keys: readonly CardKey[]) =>
    keys.flatMap((key) => {
      const tile = isSubsumed(key, held) ? null : cardTile(key, perms, t, billsWaiting);
      return tile ? [tile] : [];
    });
  const grouped = new Set(groups.flatMap((g) => g.cards));
  // A group is one tile after the loose cards, in the groups' own order. A group whose cards draw nothing for this role
  // is not shown: an empty doorway would open nothing. The seeded groups (0241) start empty, which is how every home
  // stays exactly as it was until someone puts a card in one.
  const doors = groups.flatMap((g) => {
    const inside = tilesOf(held.filter((key) => g.cards.includes(key)));
    return inside.length > 0 ? [{ href: groupHref(g.id), label: g.label, icon: groupIcon(g.icon), inside }] : [];
  });
  return [...tilesOf(held.filter((key) => !grouped.has(key))), ...doors];
}

/**
 * Photos to approve belongs to an activity, not to a role or a card: whoever may publish (the database's own test
 * for approving) gets the tile and the number waiting, whatever their home is built from. A count of undefined
 * means this login may not approve, so nothing is added.
 */
function withApprovalTile(tiles: HomeTile[], t: Dictionary, waiting: number): HomeTile[] {
  const badge = waiting > 0 ? { badge: t.photoApproval.tileWaiting(waiting) } : {};
  // A home built from the registry already drew the tile (without a number); put the number on it.
  if (tiles.some((x) => x.href === "/photos/approve")) return tiles.map((x) => (x.href === "/photos/approve" ? { ...x, ...badge } : x));
  // Inside a group: the number goes on that tile, behind the doorway, not on a second tile on the home.
  if (tiles.some((x) => x.inside?.some((y) => y.href === "/photos/approve"))) return tiles.map((x) => (x.inside ? { ...x, inside: withApprovalTile(x.inside, t, waiting) } : x));
  const route = routeFor("/photos/approve");
  if (!route) return tiles;
  return [...tiles, { href: route.path, label: route.label(t), icon: route.icon, ...badge }];
}

/** Put the due-today counts on the tiles they belong to: My tasks carries the total, Maintenance its share. */
export function withCounts(drawn: HomeTile[], t: Dictionary, counts?: TileCounts): HomeTile[] {
  if (!counts) return drawn;
  const tiles = counts.photosWaiting === undefined ? drawn : withApprovalTile(drawn, t, counts.photosWaiting);
  return tiles.map((tile) => {
    if (tile.inside) return { ...tile, inside: withCounts(tile.inside, t, { ...counts, photosWaiting: undefined }) };
    const n = tile.href === "/my" ? counts.my : tile.href === "/maintenance" ? counts.maintenance : undefined;
    return n && n > 0 && !tile.badge ? { ...tile, badge: t.my.navBadge(n) } : tile;
  });
}

export function homeTilesFor(perms: Permissions, t: Dictionary, billsWaiting?: number, cards?: readonly CardKey[] | RoleCards, counts?: TileCounts): HomeTile[] {
  return withCounts(homeTilesBase(perms, t, billsWaiting, cards), t, counts);
}

/**
 * The home of a login that holds more than one role (a cover, 0196): each role's own home, drawn the way it is drawn for
 * someone who holds only that role, joined with the main role's first and a tile shown once. `perms` is the database's
 * union (my_permissions()), so a tile appears only if the union's cells cover it and its page opens: nothing wider than
 * what the database enforces, and (because each role keeps its own cards, jobs and curated home) nothing narrower either.
 * A login with one role gets exactly homeTilesFor()'s answer.
 */
export function homeTilesForRoles(
  perms: Permissions,
  t: Dictionary,
  billsWaiting: number | undefined,
  cardsByRole: Readonly<Record<string, readonly CardKey[] | RoleCards>>,
  counts?: TileCounts,
): HomeTile[] {
  const seen = new Set<string>();
  const tiles: HomeTile[] = [];
  for (const key of perms.roles.length > 0 ? perms.roles : [perms.role.key]) {
    const asRole: Permissions = { ...perms, role: { ...perms.role, key } };
    for (const tile of homeTilesBase(asRole, t, billsWaiting, cardsByRole[key])) {
      if (seen.has(tile.href)) continue;
      seen.add(tile.href);
      tiles.push(tile);
    }
  }
  // "Add photos" is the extra of a role with jobs and no medical photos job; once ANY held role has that job it is
  // redundant (the union's cells would otherwise give the maintenance side of a cover the extra too).
  const shown = perms.roles.length > 1 && tiles.some((x) => x.href === "/medical/photos") ? tiles.filter((x) => x.href !== "/photos/add") : tiles;
  return withCounts(shown, t, counts);
}

/** One role's share of a multi-role home: its tiles, drawn as if it were the person's only role. */
export type HomeGroup = { roleKey: string; tiles: HomeTile[] };

/**
 * The same home as homeTilesForRoles(), kept apart by role (main role first) instead of merged: a tile two roles both
 * give is in each group. Layout only: every tile still needs the union `perms` to open its page. A login with one role
 * gets one group, the same tiles homeTilesFor() draws.
 */
export function homeGroupsForRoles(
  perms: Permissions,
  t: Dictionary,
  billsWaiting: number | undefined,
  cardsByRole: Readonly<Record<string, readonly CardKey[] | RoleCards>>,
  counts?: TileCounts,
): HomeGroup[] {
  const keys = perms.roles.length > 0 ? perms.roles : [perms.role.key];
  const raw = keys.map((key) => {
    const asRole: Permissions = { ...perms, role: { ...perms.role, key } };
    return { roleKey: key, tiles: homeTilesBase(asRole, t, billsWaiting, cardsByRole[key]) };
  });
  const addPhotosRedundant = keys.length > 1 && raw.some((g) => g.tiles.some((x) => x.href === "/medical/photos"));
  return raw
    .map((g) => ({ roleKey: g.roleKey, tiles: withCounts(addPhotosRedundant ? g.tiles.filter((x) => x.href !== "/photos/add") : g.tiles, t, counts) }))
    .filter((g, i) => i === 0 || g.tiles.length > 0);
}

function homeTilesBase(perms: Permissions, t: Dictionary, billsWaiting?: number, cards?: readonly CardKey[] | RoleCards): HomeTile[] {
  const home = asRoleCards(cards);
  if (home && home.cards.length > 0) return cardTilesFor(home.cards, perms, t, billsWaiting, home.groups);

  let routes = routesFor(perms).filter((r) => r.device !== "desk");
  // Settings pages are Admin's night home (/admin), not a role's tasks; a role that holds only
  // those still gets a home rather than an empty one.
  const outsideSettings = routes.filter((r) => !r.path.startsWith("/admin/"));
  if (outsideSettings.length > 0) routes = outsideSettings;

  // Two pages with one word are one tile. Of one activity (Contacts, the directory and its
  // manager) it opens the one that does more: the page this role holds at the higher level. Of two
  // activities (two pages sharing a word) it opens the menu's page.
  const byLabel = new Map<string, { route: RouteEntry; label: string }>();
  for (const route of routes) {
    const label = route.label(t);
    const held = byLabel.get(label);
    const wins =
      !held ||
      (route.activity === held.route.activity
        ? rank(route) > rank(held.route)
        : route.menu && !held.route.menu);
    if (wins) byLabel.set(label, { route, label });
  }

  const order = ORDER[perms.role.key] ?? [];
  const position = (path: string) => {
    const i = order.indexOf(path);
    return i === -1 ? order.length : i;
  };
  const fromRegistry: HomeTile[] = [...byLabel.values()]
    .map((v, i) => ({ tile: { href: v.route.path, label: v.label, icon: v.route.icon }, i }))
    .sort((a, b) => position(a.tile.href) - position(b.tile.href) || a.i - b.i)
    .map((x) => x.tile);

  const lead: HomeTile[] = [];
  if (can(perms, "recurring.do_own")) lead.push({ href: "/my", label: t.nav.my, icon: NAV_ICONS.my });
  if (can(perms, "resident.record", "read")) lead.push({ href: "/residents", label: t.nav.residents, icon: NAV_ICONS.residents });
  return [...lead, ...fromRegistry.filter((x) => !lead.some((l) => l.label === x.label)), ...billsTile(perms, t, billsWaiting)];
}
