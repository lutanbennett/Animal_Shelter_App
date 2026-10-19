import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCardKey, type CardKey } from "@/lib/permissions/cards";
import { parsePermissions, type Permissions } from "@/lib/permissions/can";

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
    .eq("opens_app", true)
    .neq("key", "admin")
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
    .select("id, key, name, name_th, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails")
    .eq("key", roleKey)
    .is("archived_at", null)
    .maybeSingle();
  if (!role) return null;
  const { data: cells } = await supabase.from("role_permissions").select("activity, level").eq("role_id", role.id);
  return parsePermissions({
    role: { key: role.key, name: role.name, name_th: role.name_th, kind: role.kind, opens_app: role.opens_app, home_path: role.home_path },
    is_admin: role.key === "admin",
    scopes: {
      residents: role.scope_residents,
      clinical: role.scope_clinical,
      contacts: role.scope_contacts,
      photos: role.scope_photos,
      sees_login_emails: role.sees_login_emails,
    },
    permissions: Object.fromEntries((cells ?? []).map((c) => [c.activity, c.level])),
  });
}

/**
 * The tiles Admin chose for a role (role_home_tiles, 0225), as page paths in order. An empty list means none were chosen,
 * and the role keeps the home it derives. Admin-only under RLS, so read with the service role for one role key the caller
 * has already settled, exactly as loadRoleCards does.
 */
export async function loadRoleHomeTiles(roleKey: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: role } = await admin.from("roles").select("id").eq("key", roleKey).maybeSingle();
  if (!role) return [];
  const { data, error } = await admin.from("role_home_tiles").select("path").eq("role_id", role.id).order("position");
  if (error) throw new Error(`Home tiles: could not read role_home_tiles: ${error.message}`);
  return (data ?? []).map((r) => r.path as string);
}

export async function loadHomeTilesByRole(roleKeys: readonly string[]): Promise<Record<string, string[]>> {
  const keys = [...new Set(roleKeys)];
  return Object.fromEntries(await Promise.all(keys.map(async (key) => [key, await loadRoleHomeTiles(key)] as const)));
}

/** The cards of each of these roles (a login may hold several, 0196), by role key. */
export async function loadCardsByRole(roleKeys: readonly string[]): Promise<Record<string, CardKey[]>> {
  const keys = [...new Set(roleKeys)];
  return Object.fromEntries(await Promise.all(keys.map(async (key) => [key, await loadRoleCards(key)] as const)));
}

/**
 * The cards a role has, in the order its home shows them. role_cards is Admin-only to read (0194), but a role's
 * own people need their own home, so this reads it with the service role, for one role key already settled by the
 * caller (the signed-in person's own role, or the role Admin is previewing). Nothing else of the table leaves here.
 */
export async function loadRoleCards(roleKey: string): Promise<CardKey[]> {
  const admin = createAdminClient();
  const { data: role } = await admin.from("roles").select("id").eq("key", roleKey).maybeSingle();
  if (!role) return [];
  const { data, error } = await admin.from("role_cards").select("card").eq("role_id", role.id).order("position");
  if (error) throw new Error(`Home cards: could not read role_cards: ${error.message}`);
  return (data ?? []).map((r) => r.card as string).filter(isCardKey);
}
