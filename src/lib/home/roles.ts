import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  const { data } = await supabase
    .from("roles")
    .select("key, name, name_th, kind")
    .is("archived_at", null)
    .eq("opens_app", true)
    .neq("key", "admin")
    .order("kind")
    .order("name");
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
