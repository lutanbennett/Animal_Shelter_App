import { createAdminClient } from "@/lib/supabase/admin";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * The live roles Who does what shows, shared by the cards page and the Details grid.
 * roles, role_permissions, role_cards and role_extras are readable by Admin alone, and Management opens these
 * pages too, so they are read with the service role after the page's guard. Nothing in them is secret: it is the
 * shelter's own role settings, which these two may see by the backlog item.
 */
export type Role = { id: string; key: string; name: string; nameTh: string | null; kind: string };

/** Management first (the Director by day); the doctor last, whose column the clinic rule decides; the rest by kind, then name. */
function columnOrder(a: Role, b: Role): number {
  const rank = (r: Role) => (r.key === "management" ? 0 : r.key === "doctor" ? 3 : r.kind === "custom" ? 1 : 2);
  return rank(a) - rank(b) || a.name.localeCompare(b.name);
}

export function roleName(role: Pick<Role, "key" | "name" | "nameTh">, t: Dictionary, locale: string): string {
  if (locale !== "th") return role.name;
  return role.nameTh ?? (t.admin.security.roles as Record<string, string>)[role.key] ?? role.name;
}

export async function loadRoles(): Promise<Role[]> {
  const { data, error } = await createAdminClient()
    .from("roles")
    .select("id, key, name, name_th, kind")
    .is("archived_at", null)
    .eq("opens_app", true)
    .neq("key", "admin");
  if (error) throw new Error(`Who does what: ${error.message}`);
  return (data ?? [])
    .map((r) => ({ id: r.id as string, key: r.key as string, name: r.name as string, nameTh: (r.name_th as string | null) ?? null, kind: r.kind as string }))
    .sort(columnOrder);
}
