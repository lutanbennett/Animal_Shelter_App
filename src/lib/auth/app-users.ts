import type { SupabaseClient } from "@supabase/supabase-js";

/** A row of the `app_users` view (0055): a login that holds a role. */
export type AppUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
};

/** The name to show for a login: Google's display name, else the email. */
export function appUserLabel(user: Pick<AppUser, "email" | "display_name"> | null | undefined): string {
  if (!user) return "—";
  return user.display_name ?? user.email ?? "—";
}

/**
 * Logins a maintenance job can be assigned to: everyone who actions
 * jobs. Vets are left out — they don't fix fences — and so is anyone
 * without a role. Sorted by the name that will be shown.
 */
export async function loadAssignableUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("app_users")
    .select("id, email, display_name, role")
    .in("role", ["admin", "management", "staff", "volunteer"])
    .returns<AppUser[]>();
  const users = (data ?? []).sort((a, b) => appUserLabel(a).localeCompare(appUserLabel(b)));
  return { users, error: error?.message ?? null };
}

/** Labels for a set of login ids, for display where the view can't be embedded. */
export async function loadAppUsersById(supabase: SupabaseClient, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<string, AppUser>();
  const { data } = await supabase
    .from("app_users")
    .select("id, email, display_name, role")
    .in("id", unique)
    .returns<AppUser[]>();
  return new Map((data ?? []).map((u) => [u.id, u]));
}
