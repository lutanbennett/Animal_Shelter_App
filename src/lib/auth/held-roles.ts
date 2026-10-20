import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayIso } from "@/lib/format";
import type { AppUser } from "./app-users";

/**
 * Every role key each of these logins holds today, main role first: the main row, then any additional role (cover)
 * whose dates include today. `app_users` (0196) lists a person once, by the main role, so a rota that asks only
 * `role_key` never offers the covering Head of Medical the maintenance jobs she is covering.
 *
 * Read with the service role because user_roles is Admin-only to read; only role KEYS leave here, for logins the
 * caller already named. "Today" is the shelter's date, and `ends_on` is the last day a cover counts, which is exactly
 * what the database's role_row_live() does (0196) for every permission check. This list can only decide whom a
 * picker OFFERS: the database still refuses the work itself.
 */
export async function loadHeldRoleKeys(userIds: readonly string[]): Promise<Map<string, string[]>> {
  const held = new Map<string, string[]>();
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return held;
  const today = todayIso();
  const { data, error } = await createAdminClient()
    .from("user_roles")
    .select("user_id, is_main, starts_on, ends_on, roles(key, archived_at)")
    .in("user_id", ids)
    .is("archived_at", null)
    .order("is_main", { ascending: false });
  // A failed read must not look like "nobody covers anyone"; the main role (app_users) is the caller's fallback.
  if (error) throw new Error(`Held roles: could not read user_roles: ${error.message}`);
  for (const row of (data ?? []) as unknown as {
    user_id: string;
    is_main: boolean;
    starts_on: string | null;
    ends_on: string | null;
    roles: { key: string; archived_at: string | null } | null;
  }[]) {
    if (!row.roles || row.roles.archived_at) continue;
    if ((row.starts_on && row.starts_on > today) || (row.ends_on && row.ends_on < today)) continue;
    held.set(row.user_id, [...(held.get(row.user_id) ?? []), row.roles.key]);
  }
  return held;
}

/** `users` with `role_keys` filled in: their main role plus any cover in force today. */
export async function withHeldRoles(users: readonly AppUser[]): Promise<AppUser[]> {
  const held = await loadHeldRoleKeys(users.map((u) => u.id));
  return users.map((u) => ({ ...u, role_keys: held.get(u.id) ?? [u.role_key] }));
}

export type HeldRole = { key: string; name: string; nameTh: string | null; isMain: boolean; endsOn: string | null };

/**
 * One login's roles in force today for the home screen: the main role first, then each cover with the last day it
 * counts. Same rule and same service-role read as loadHeldRoleKeys; names are for headings only, never for a check.
 */
export async function loadHeldRoles(userId: string): Promise<HeldRole[]> {
  const today = todayIso();
  const { data, error } = await createAdminClient()
    .from("user_roles")
    .select("is_main, starts_on, ends_on, roles(key, name, name_th, archived_at)")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("is_main", { ascending: false })
    .order("ends_on", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Held roles: could not read user_roles: ${error.message}`);
  const out: HeldRole[] = [];
  for (const row of (data ?? []) as unknown as {
    is_main: boolean;
    starts_on: string | null;
    ends_on: string | null;
    roles: { key: string; name: string; name_th: string | null; archived_at: string | null } | null;
  }[]) {
    if (!row.roles || row.roles.archived_at) continue;
    if ((row.starts_on && row.starts_on > today) || (row.ends_on && row.ends_on < today)) continue;
    out.push({ key: row.roles.key, name: row.roles.name, nameTh: row.roles.name_th, isMain: row.is_main, endsOn: row.ends_on });
  }
  return out;
}
