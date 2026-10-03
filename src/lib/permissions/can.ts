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
    opensApp: boolean;
    homePath: string | null;
  };
  /** Admin's column is a rule, not data (§6): true answers yes to every known activity. */
  isAdmin: boolean;
  scopes: {
    residents: string;
    clinical: string;
    contacts: string;
    photos: string;
    seesLoginEmails: boolean;
  };
  /** No entry means None. Only keys the catalogue knows are ever put here. */
  cells: Readonly<Partial<Record<ActivityKey, 1 | 2>>>;
};

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
  const scopes = (r.scopes ?? {}) as Record<string, unknown>;
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
      opensApp: role.opens_app === true,
      homePath: typeof role.home_path === "string" ? role.home_path : null,
    },
    isAdmin: r.is_admin === true,
    scopes: {
      residents: String(scopes.residents ?? "all"),
      clinical: String(scopes.clinical ?? "any"),
      contacts: String(scopes.contacts ?? "full"),
      photos: String(scopes.photos ?? "all"),
      seesLoginEmails: scopes.sees_login_emails === true,
    },
    cells,
  };
}
