/**
 * The route registry: every page a person can open because they hold an
 * activity, once. Path, activity, level, icon, label, device. The page's own
 * guard (requirePermission) names the same activity, and
 * check-permission-catalogue.mjs fails when a page and its entry disagree.
 *
 * It is data, not only a guard list. The menu, the home screens, a hub's
 * buttons and the recurring-job "who can do this" rule read it, so a role's
 * page set is derived from its cells (`routesFor`) instead of written out
 * per role (§8). Adding a page is one entry here plus the guard on the page.
 *
 * Pure and client-safe. Only stock is registered so far; the sweeps add the
 * rest, and Settings and Management landing pages with their areas.
 */

import { ClipboardCheck, ShoppingCart, Truck, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can, type Permissions } from "./can";
import type { ActivityKey, Level, LevelKey } from "./catalogue";

export type RouteEntry = {
  /** The path as a person types it, no trailing slash. A page under it inherits nothing: list each page. */
  path: string;
  activity: ActivityKey;
  /** The level the page needs to open. Omit for a yes/no activity. */
  level?: Level;
  icon: LucideIcon;
  /** The person's own words for it, from the dictionary. */
  label: (t: Dictionary) => string;
  /** "phone" and "desk" are two pages over one action (§8); "any" is one page for both. */
  device: "any" | "phone" | "desk";
  /** Listed in the sidebar. False is still guarded and reachable; a home tile may show it. */
  menu: boolean;
};

export const ROUTES: readonly RouteEntry[] = [
  {
    path: "/stocktake",
    activity: "stock.count",
    icon: ClipboardCheck,
    label: (t) => t.nav.stocktake,
    device: "any",
    menu: true,
  },
  {
    path: "/deliveries",
    activity: "stock.delivery",
    icon: Truck,
    label: (t) => t.deliveries.title,
    device: "any",
    menu: false,
  },
  {
    path: "/management/purchasing",
    activity: "stock.purchasing",
    icon: ShoppingCart,
    label: (t) => t.management.purchasing.title,
    // Steps on a phone, the table from md up: one page, two layouts (§13).
    device: "any",
    menu: false,
  },
];

/** Whether `perms` opens this entry. */
export function canOpen(perms: Permissions | null | undefined, route: RouteEntry): boolean {
  return can(perms, route.activity as LevelKey, route.level);
}

/** The entries this person may open, in registry order; the caller groups and sorts. */
export function routesFor(perms: Permissions | null | undefined): readonly RouteEntry[] {
  return ROUTES.filter((r) => canOpen(perms, r));
}

/** The entry for a path (exact), or undefined. */
export function routeFor(path: string): RouteEntry | undefined {
  return ROUTES.find((r) => r.path === path);
}
