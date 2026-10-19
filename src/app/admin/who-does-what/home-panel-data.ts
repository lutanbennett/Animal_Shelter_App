import "server-only";
import { canUseBills } from "@/lib/bills/access";
import { loadRoleCards } from "@/lib/home/roles";
import { homeTilesFor, outsideLabel, OUTSIDE_PATHS } from "@/lib/home/tiles";
import { ACTIVITIES, type ActivityKey } from "@/lib/permissions/catalogue";
import { can, type Permissions } from "@/lib/permissions/can";
import { canOpen, routeFor, ROUTES } from "@/lib/permissions/routes";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { PanelOption, PanelTile } from "./HomeScreenPanel";

/**
 * What the Home screen panel shows for one role: its saved tiles (or, when it has none, the home it derives today),
 * each with whether the role can open the page right now, and every other page as something to add. Read with the service
 * role after the page's guard, like the rest of this page.
 */
export async function homePanelData(saved: readonly string[], roleKey: string, perms: Permissions | null, t: Dictionary): Promise<{ tiles: PanelTile[]; options: PanelOption[]; derived: boolean }> {
  const w = t.admin.whoDoesWhat;
  const h = w.homeView;
  const derived = saved.length === 0;
  const paths = derived && perms ? homeTilesFor(perms, t, undefined, await loadRoleCards(roleKey)).map((x) => x.href) : saved;

  const kindOf = new Map(ACTIVITIES.map((a) => [a.key as string, a.kind]));
  const levelLabel = (activity: string, level: number) =>
    kindOf.get(activity) === "yesno" ? (level >= 2 ? w.levels.yes : w.levels.no) : level >= 2 ? w.levels.edit : w.levels.read;

  /** null when the role opens the page; otherwise what is missing, and the one cell that would fix it when a cell can. */
  function missingFor(path: string): { missing: string; grant?: PanelOption["grant"] } | null {
    if (!perms) return { missing: h.noPermissions };
    if (path === "/residents") return perms.role.opensApp ? null : { missing: h.noPermissions };
    if (path === "/bills") return canUseBills(perms) ? null : { missing: h.billsRule };
    if (path === "/assistant") {
      return can(perms, "assistant.ask") ? null : { missing: `${w.activities["assistant.ask" as ActivityKey]}: ${w.levels.yes}`, grant: { activity: "assistant.ask", level: 2, activityLabel: w.activities["assistant.ask" as ActivityKey], levelLabel: w.levels.yes } };
    }
    const route = routeFor(path);
    if (!route) return { missing: h.noPermissions };
    if (canOpen(perms, route)) return null;
    if (route.scope && perms.scopes.clinical !== route.scope.clinical) return { missing: h.clinicRule };
    const level = route.level === "edit" ? 2 : route.level === "read" ? 1 : 2;
    const activityLabel = w.activities[route.activity];
    const lvl = levelLabel(route.activity, level);
    return { missing: `${activityLabel}: ${lvl}`, grant: { activity: route.activity, level, activityLabel, levelLabel: lvl } };
  }
  const labelOf = (path: string) => (routeFor(path) ? routeFor(path)!.label(t) : outsideLabel(path, t));

  const tiles: PanelTile[] = paths.map((path) => ({ path, label: labelOf(path), hiddenWhy: missingFor(path)?.missing }));
  const options: PanelOption[] = [...ROUTES.map((r) => r.path), ...OUTSIDE_PATHS]
    .filter((p) => !paths.includes(p))
    .map((path) => {
      const m = missingFor(path);
      return { path, label: `${labelOf(path)} (${path})`, ...(m ?? {}) };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  return { tiles, options, derived };
}
