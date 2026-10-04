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
import type { LucideIcon } from "lucide-react";
import { NAV_ICONS } from "@/components/hub-icons";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can, type Permissions } from "@/lib/permissions/can";
import { jobsOfRole } from "@/lib/permissions/jobs";
import { canOpen, routeFor, routesFor, type RouteEntry } from "@/lib/permissions/routes";

export type HomeTile = {
  href: string;
  /** In the person's language: resolved here, since two pages with one word are one tile. */
  label: string;
  icon: LucideIcon;
};

/**
 * Hand-chosen order for the default roles (§8 point 3), after the two leading tiles. A path not
 * listed follows in registry order, so a role a shelter adds is coherent without an entry here.
 * Staff's is the 2IC's whiteboard column: stocktake, purchasing, maintenance.
 */
const ORDER: Record<string, readonly string[]> = {
  management: [
    "/management/recurring-jobs",
    "/management/vets",
    "/management/medication-list",
    "/management/dashboard",
    "/management/contacts",
    "/maintenance",
  ],
  staff: ["/stocktake", "/management/purchasing", "/maintenance", "/deliveries"],
};

const rank = (r: RouteEntry) => (r.level === "read" ? 1 : 2);

export function homeTilesFor(perms: Permissions, t: Dictionary): HomeTile[] {
  // A role that is given jobs (src/lib/permissions/jobs.ts) shows its jobs, one tile each, and
  // nothing else: that is what "a home of named jobs" means. A job whose bundle the role's cells
  // do not cover, or whose page it may not open, draws no tile rather than a tile that refuses.
  const jobs = jobsOfRole(perms.role.key);
  if (jobs.length > 0) {
    return jobs.flatMap((job) => {
      const route = routeFor(job.opens);
      const covered = job.bundle.every((b) => (b.level ? can(perms, b.activity, b.level) : can(perms, b.activity)));
      return route && covered && canOpen(perms, route)
        ? [{ href: route.path, label: job.label(t), icon: route.icon }]
        : [];
    });
  }

  let routes = routesFor(perms).filter((r) => r.device !== "desk");
  // Settings pages are Admin's night home (/admin), not a role's tasks; a role that holds only
  // those still gets a home rather than an empty one.
  const outsideSettings = routes.filter((r) => !r.path.startsWith("/admin/"));
  if (outsideSettings.length > 0) routes = outsideSettings;

  // Two pages with one word are one tile. Of one activity (Contacts, the directory and its
  // manager) it opens the one that does more: the page this role holds at the higher level. Of two
  // activities (Enclosures, and the map prototype under the same word) it opens the menu's page.
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
  return [...lead, ...fromRegistry.filter((x) => !lead.some((l) => l.label === x.label))];
}
