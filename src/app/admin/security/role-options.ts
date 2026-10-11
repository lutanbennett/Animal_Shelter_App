import type { createAdminClient } from "@/lib/supabase/admin";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";

/**
 * A role the Security page can show, read from `roles` (0132) rather than a list in the code, so a configured
 * role (2IC, Head of Medical, Head of Maintenance) can be given from the app the moment it exists.
 *
 * The picker's value is the role's KEY. Saving writes `user_roles.role_id` and nothing else: the enum column it
 * once also wrote (docs/decisions/2026-10-11-security-role-picker.md) is gone (perm-drop-enum, 0181).
 */
export type RoleOption = {
  key: string;
  name: string;
  nameTh: string | null;
  /** Retired (Staff, 0173): shown on a login that still holds it, never offered. */
  archived: boolean;
};

/**
 * The order docs/roles-and-permissions.md lists Lanna's roles in, Admin first and Public viewer last. A role
 * added later and not named here sits after these, alphabetically, still before Public viewer.
 */
const ORDER = [
  "admin",
  "management",
  "second_in_command",
  "head_of_maintenance",
  "head_of_medical",
  "volunteer",
  "doctor",
];

function rank(key: string) {
  if (key === "public_viewer") return ORDER.length + 1;
  const i = ORDER.indexOf(key);
  return i === -1 ? ORDER.length : i;
}

export async function loadRoleOptions(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ roles: RoleOption[]; error: string | null }> {
  const { data, error } = await admin.from("roles").select("key, name, name_th, archived_at");
  if (error) return { roles: [], error: error.message };
  const roles = (data ?? [])
    .map((r) => ({
      key: r.key as string,
      name: r.name as string,
      nameTh: (r.name_th as string | null) ?? null,
      archived: r.archived_at != null,
    }))
    .sort((a, b) => rank(a.key) - rank(b.key) || a.name.localeCompare(b.name));
  return { roles, error: null };
}

/**
 * A built-in role's name comes from the dictionary (their rows carry no name_th); a configured role's is its
 * own, in Thai when it has one. Never the borrowed enum's: a 2IC must not read as "Volunteer".
 */
export function roleOptionLabel(t: Dictionary, locale: Locale, role: Pick<RoleOption, "key" | "name" | "nameTh">) {
  const builtIn = (t.admin.security.roles as Record<string, string>)[role.key];
  if (builtIn) return builtIn;
  return (locale === "th" && role.nameTh) || role.name;
}

/** The roles a login may be given: the live ones. */
export const givableRoles = (roles: RoleOption[]) => roles.filter((r) => !r.archived);
