/**
 * The question every check asks: may this person do this?
 * Pure and client-safe, so a server component, a server action and a client
 * component all call the same function. The pattern, and why it is this shape:
 * docs/decisions/2026-10-03-permissions-catalogue.md.
 *
 *   can(perms, "stock.count")              // a yes/no activity
 *   can(perms, "medical.weight", "read")   // an edit/read activity at a level
 *
 * `Permissions` is plain data (no methods, no functions), so it crosses the
 * server/client boundary as a prop. It is the person's own permissions, so
 * nothing in it is secret.
 */

import { isActivityKey, type ActivityKey, type Level, type LevelKey, type YesNoKey } from "./catalogue";

/** What my_permissions() (0132) returns, as the app holds it. Cells: 1 read, 2 edit or yes. */
export type Permissions = {
  role: {
    key: string;
    name: string;
    nameTh: string | null;
    homePath: string | null;
  };
  /**
   * Every role key this login holds today, main role first (my_permissions().roles, 0196). One entry for almost
   * everyone; more while someone is covering. The cells below are already the union of them, so this
   * is for the things that are keyed on a role rather than on a cell: a role's cards, its jobs, the manual's audience.
   */
  roles: readonly string[];
  /** Admin's column is a rule, not data (§6): true answers yes to every known activity. */
  isAdmin: boolean;
  /** No entry means None. Only keys the catalogue knows are ever put here. */
  cells: Readonly<Partial<Record<ActivityKey, 1 | 2>>>;
};

/**
 * Whether this login is inside the app at all: Admin, or a role that holds at least one cell, which is to say one card
 * that gives something. A role is a placeholder until a card is assigned, so a role with no cards is not in the app; there
 * is no column that switches a role on or off. Admin sits outside the card system (CLAUDE.md, "Hard-coded security is forbidden").
 */
export function entersApp(perms: Permissions | null | undefined): boolean {
  if (!perms) return false;
  return perms.isAdmin || Object.keys(perms.cells).length > 0;
}

/**
 * Fails closed. Every one of these answers false, never true and never a
 * throw: no permissions at all (signed out, no role, archived role), an
 * activity key the catalogue does not know (reachable only from untyped
 * code, since the type refuses it), a level other than "read" or "edit", and
 * a missing cell. Admin is yes for every key the catalogue knows, before any
 * cell is read, as has_permission() is in the database. The one difference:
 * the database also says yes to Admin for a key it does not know (§6 rule 8),
 * which a typo in a policy could hide; here an unknown key is no for everyone.
 *
 * A yes/no activity takes no level: asking one "read" is a type error.
 */
export function can(perms: Permissions | null | undefined, activity: YesNoKey): boolean;
export function can(perms: Permissions | null | undefined, activity: LevelKey, level?: Level): boolean;
export function can(
  perms: Permissions | null | undefined,
  activity: ActivityKey,
  level: Level = "edit",
): boolean {
  if (!perms) return false;
  if (!isActivityKey(activity)) return false;
  if (level !== "read" && level !== "edit") return false;
  if (perms.isAdmin) return true;
  const cell = perms.cells[activity];
  return cell !== undefined && cell >= (level === "read" ? 1 : 2);
}

/**
 * Reads my_permissions()'s jsonb defensively. Null for null or anything that
 * is not the expected object. Cells for keys this build does not know are
 * dropped (the database can be a release ahead), and so is any cell that is
 * not exactly 1 or 2, so a malformed answer can only ever mean less access.
 */
export function parsePermissions(raw: unknown): Permissions | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const role = r.role as Record<string, unknown> | null | undefined;
  if (!role || typeof role.key !== "string" || typeof role.name !== "string") return null;
  const cells: Partial<Record<ActivityKey, 1 | 2>> = {};
  const given = r.permissions && typeof r.permissions === "object" ? (r.permissions as Record<string, unknown>) : {};
  for (const [key, level] of Object.entries(given)) {
    if (isActivityKey(key) && (level === 1 || level === 2)) cells[key] = level;
  }
  return {
    role: {
      key: role.key,
      name: role.name,
      nameTh: typeof role.name_th === "string" ? role.name_th : null,
      homePath: typeof role.home_path === "string" ? role.home_path : null,
    },
    roles: Array.isArray(r.roles) && r.roles.every((k) => typeof k === "string") && r.roles.length > 0 ? (r.roles as string[]) : [role.key],
    isAdmin: r.is_admin === true,
    cells,
  };
}
