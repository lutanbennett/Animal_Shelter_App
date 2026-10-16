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
import { Receipt, Sparkles, UserPlus, type LucideIcon } from "lucide-react";
import { canUseBills } from "@/lib/bills/access";
import { NAV_ICONS } from "@/components/hub-icons";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can, type Permissions } from "@/lib/permissions/can";
import { CARDS, cardOpens, includedCards, type CardKey } from "@/lib/permissions/cards";
import { jobsOfRole } from "@/lib/permissions/jobs";
import { canOpen, routeFor, routesFor, type RouteEntry } from "@/lib/permissions/routes";

/** Counts shown on tiles (what the left menu's badge showed): due today or overdue. */
export type TileCounts = { my?: number; maintenance?: number; billsWaiting?: number };

export type HomeTile = {
  href: string;
  /** In the person's language: resolved here, since two pages with one word are one tile. */
  label: string;
  icon: LucideIcon;
  /** A count shown on the tile (bills waiting), when there is one to show. */
  badge?: string;
};

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

function managementDay(perms: Permissions, t: Dictionary, billsWaiting?: number): HomeTile[] {
  const tiles: HomeTile[] = [];
  const recurring = routeFor("/management/recurring-jobs");
  if (recurring && canOpen(perms, recurring)) tiles.push({ href: recurring.path, label: recurring.label(t), icon: recurring.icon });
  if (can(perms, "resident.register")) tiles.push({ href: "/residents/new", label: t.appHome.intake, icon: UserPlus });
  if (perms.role.opensApp) tiles.push({ href: "/residents", label: t.nav.residents, icon: NAV_ICONS.residents });
  if (can(perms, "recurring.do_own")) tiles.push({ href: "/my", label: t.nav.my, icon: NAV_ICONS.my });
  return tiles;
}

/**
 * Curated homes: a role whose phone screen is chosen, not derived. This is the whole list, and it
 * is keyed on the role's key on purpose (docs/decisions/2026-10-06-home-screen-belongs-to-a-role.md):
 * a home is a property of the role, and a role a shelter creates has none until someone curates
 * one, so it gets the derived home below, which already shows a tile only for a page its cells open.
 * Not `roles.home_path`, which names one page and cannot say "these four tiles"; not a job list,
 * which Management's cells are wider than.
 */
const CURATED_HOME: Record<string, (perms: Permissions, t: Dictionary, billsWaiting?: number) => HomeTile[]> = {
  management: managementDay,
};

/**
 * Pages a card opens that are not in the route registry, each with the test its own page uses (the same three
 * the derived home special-cases above). Everything else a card opens is a registry entry, tested by canOpen().
 */
const OUTSIDE_REGISTRY: Record<string, { icon: LucideIcon; open: (p: Permissions) => boolean }> = {
  "/residents": { icon: NAV_ICONS.residents, open: (p) => p.role.opensApp },
  "/bills": { icon: Receipt, open: canUseBills },
  "/assistant": { icon: Sparkles, open: (p) => can(p, "assistant.ask") },
};

/** Whether a role's tile for this card can be drawn: its page opens for the role AND its cells cover the bundle. */
export function cardTile(key: CardKey, perms: Permissions, t: Dictionary, billsWaiting?: number): HomeTile | null {
  const card = CARDS[key];
  const covered = card.bundle.every((b) => (b.level ? can(perms, b.activity, b.level) : can(perms, b.activity)));
  if (!covered) return null;
  const page = cardOpens(card, perms.scopes.clinical);
  const outside = OUTSIDE_REGISTRY[page];
  const route = routeFor(page);
  const icon = outside?.icon ?? route?.icon;
  const opens = outside ? outside.open(perms) : route ? canOpen(perms, route) : false;
  if (!icon || !opens) return null;
  const badge = page === "/bills" && billsWaiting ? { badge: t.bills.tile.waiting(billsWaiting) } : {};
  return { href: page, label: card.label(t), icon, ...badge };
}

/**
 * The home of a role that has cards (role_cards, 0194): its cards in the order it keeps them, one tile each. A card
 * another held card includes and shares its page with (View residents under Residents) is that card's tile, not a
 * second one. Roles with no cards get the derived home below, as a role a shelter creates always did.
 */
/** A card another held card includes and shares its page with (View residents under Residents) draws no tile of its own. */
export function isSubsumed(key: CardKey, held: readonly CardKey[], perms: Permissions): boolean {
  const clinical = perms.scopes.clinical;
  return held.some((o) => o !== key && cardOpens(CARDS[o], clinical) === cardOpens(CARDS[key], clinical) && includedCards(o).includes(key));
}

export function cardTilesFor(held: readonly CardKey[], perms: Permissions, t: Dictionary, billsWaiting?: number): HomeTile[] {
  return held.flatMap((key) => {
    const subsumed = isSubsumed(key, held, perms);
    const tile = subsumed ? null : cardTile(key, perms, t, billsWaiting);
    return tile ? [tile] : [];
  });
}

/** Put the due-today counts on the tiles they belong to: My tasks carries the total, Maintenance its share. */
function withCounts(tiles: HomeTile[], t: Dictionary, counts?: TileCounts): HomeTile[] {
  if (!counts) return tiles;
  return tiles.map((tile) => {
    const n = tile.href === "/my" ? counts.my : tile.href === "/maintenance" ? counts.maintenance : undefined;
    return n && n > 0 && !tile.badge ? { ...tile, badge: t.my.navBadge(n) } : tile;
  });
}

export function homeTilesFor(perms: Permissions, t: Dictionary, billsWaiting?: number, cards?: readonly CardKey[], counts?: TileCounts): HomeTile[] {
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
  cardsByRole: Readonly<Record<string, readonly CardKey[]>>,
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

function homeTilesBase(perms: Permissions, t: Dictionary, billsWaiting?: number, cards?: readonly CardKey[]): HomeTile[] {
  if (cards && cards.length > 0) return cardTilesFor(cards, perms, t, billsWaiting);

  // A role that is given jobs (src/lib/permissions/jobs.ts) shows its jobs, one tile each, and
  // nothing else: that is what "a home of named jobs" means. A job whose bundle the role's cells
  // do not cover, or whose page it may not open, draws no tile rather than a tile that refuses.
  const jobs = jobsOfRole(perms.role.key);
  if (jobs.length > 0) {
    // Add photos (photo first, then the resident) is not a job of its own: any role with jobs that holds
    // photos.resident_add gets the tile after its jobs. The Head of Medical has Add Medical Photos already.
    const addPhotos = routeFor("/photos/add");
    const extra: HomeTile[] =
      addPhotos && canOpen(perms, addPhotos) && !jobs.some((j) => j.opens === "/medical/photos")
        ? [{ href: addPhotos.path, label: addPhotos.label(t), icon: addPhotos.icon }]
        : [];
    return [...jobs.flatMap((job) => {
      const route = routeFor(job.opens);
      const covered = job.bundle.every((b) => (b.level ? can(perms, b.activity, b.level) : can(perms, b.activity)));
      return route && covered && canOpen(perms, route)
        ? [{ href: route.path, label: job.label(t), icon: route.icon }]
        : [];
    }), ...extra, ...billsTile(perms, t, billsWaiting)];
  }

  // The Director's daytime screen (the whiteboard's Management column, 2026-10-03): a few big tiles on a
  // phone, not every page Management can open. Clinic visits, medical records and a resident's details are
  // tabs on a resident, so they are reached through the Residents tile and need no tile of their own.
  const curated = CURATED_HOME[perms.role.key];
  if (curated) return curated(perms, t, billsWaiting);

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
  if (perms.role.opensApp) lead.push({ href: "/residents", label: t.nav.residents, icon: NAV_ICONS.residents });
  return [...lead, ...fromRegistry.filter((x) => !lead.some((l) => l.label === x.label)), ...billsTile(perms, t, billsWaiting)];
}
