import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCardKey, type CardKey } from "@/lib/permissions/cards";
import { parsePermissions, type Permissions } from "@/lib/permissions/can";
import type { Locale } from "@/lib/i18n/locales";
import type { RoleCards, RoleGroup } from "@/lib/home/tiles";

/**
 * The roles Admin can open the home of, and one role's permissions to draw it with.
 *
 * Both read `roles` and `role_permissions`, which RLS (0132) lets Admin read and nobody else:
 * so a caller who is not Admin gets nothing back from here even if a page forgot to check.
 * The pages check as well, and refuse; this is the second lock, not the first.
 */
export type HomeRole = { key: string; name: string; nameTh: string | null };

/** Every live role that opens the app, but Admin: Admin's own homes are Settings and the others. */
export async function listHomeRoles(supabase: SupabaseClient): Promise<HomeRole[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("key, name, name_th, kind")
    .is("archived_at", null)
    .neq("kind", "fixed")
    .order("kind")
    .order("name");
  // No roles would read as "nobody can be previewed", not as a failed read (docs/decisions/2026-10-11-silent-empty-reads.md).
  if (error) throw new Error(`Home roles: could not read roles: ${error.message}`);
  const roles = (data ?? []).map((r) => ({ key: r.key as string, name: r.name as string, nameTh: (r.name_th as string | null) ?? null }));
  // The shelter's own roles in the order a manager reaches for them: Management first.
  return roles.sort((a, b) => Number(b.key === "management") - Number(a.key === "management"));
}

/** What `my_permissions()` would say for someone holding this role, or null if there is no such live role. */
export async function loadRolePermissions(supabase: SupabaseClient, roleKey: string): Promise<Permissions | null> {
  const { data: role } = await supabase
    .from("roles")
    .select("id, key, name, name_th, kind, home_path")
    .eq("key", roleKey)
    .is("archived_at", null)
    .maybeSingle();
  if (!role) return null;
  const { data: cells } = await supabase.from("role_permissions").select("activity, level").eq("role_id", role.id);
  return parsePermissions({
    role: { key: role.key, name: role.name, name_th: role.name_th, kind: role.kind, home_path: role.home_path },
    is_admin: role.key === "admin",
    permissions: Object.fromEntries((cells ?? []).map((c) => [c.activity, c.level])),
  });
}

/** The cards and groups of each of these roles (a login may hold several, 0196), by role key. */
export async function loadCardsByRole(roleKeys: readonly string[], locale: Locale): Promise<Record<string, RoleCards>> {
  const keys = [...new Set(roleKeys)];
  return Object.fromEntries(await Promise.all(keys.map(async (key) => [key, await loadRoleCards(key, locale)] as const)));
}

type GroupRow = { id: string; name: string; name_th: string | null; icon: string; position: number };
const groupLabel = (g: GroupRow, locale: Locale) => (locale === "th" && g.name_th) || g.name;

/**
 * The cards a role has, in the order its home shows them, and its groups (0241) with the cards in each. role_cards and
 * role_groups are Admin-only to read (0194, 0241), but a role's own people need their own home, so this reads them with
 * the service role, for one role key already settled by the caller (the signed-in person's own role, or the role Admin
 * is previewing). Nothing else of either table leaves here.
 */
export async function loadRoleCards(roleKey: string, locale: Locale): Promise<RoleCards> {
  const admin = createAdminClient();
  const { data: role } = await admin.from("roles").select("id").eq("key", roleKey).maybeSingle();
  if (!role) return { cards: [], groups: [] };
  const [{ data, error }, { data: groupRows, error: groupError }] = await Promise.all([
    admin.from("role_cards").select("card, group_id").eq("role_id", role.id).order("position").returns<{ card: string; group_id: string | null }[]>(),
    admin.from("role_groups").select("id, name, name_th, icon, position").eq("role_id", role.id).order("position").order("name").returns<GroupRow[]>(),
  ]);
  if (error) throw new Error(`Home cards: could not read role_cards: ${error.message}`);
  if (groupError) throw new Error(`Home cards: could not read role_groups: ${groupError.message}`);
  const rows = (data ?? []).filter((r) => isCardKey(r.card)) as { card: CardKey; group_id: string | null }[];
  const groups: RoleGroup[] = (groupRows ?? []).map((g) => ({
    id: g.id,
    label: groupLabel(g, locale),
    icon: g.icon,
    cards: rows.filter((r) => r.group_id === g.id).map((r) => r.card),
  }));
  return { cards: rows.map((r) => r.card), groups };
}

/**
 * One group and the key of the role it belongs to, for the group's own page; null if there is no such group. Read with
 * the service role for the same reason as above; the page decides whether the reader may see it.
 */
export async function loadGroup(id: string, locale: Locale): Promise<{ roleKey: string; group: RoleGroup } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const admin = createAdminClient();
  const { data: g } = await admin
    .from("role_groups")
    .select("id, name, name_th, icon, position, roles!inner(key)")
    .eq("id", id)
    .maybeSingle<GroupRow & { roles: { key: string } }>();
  if (!g) return null;
  const home = await loadRoleCards(g.roles.key, locale);
  const group = home.groups.find((x) => x.id === id);
  return group ? { roleKey: g.roles.key, group } : null;
}
