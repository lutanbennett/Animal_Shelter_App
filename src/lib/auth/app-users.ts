import type { SupabaseClient } from "@supabase/supabase-js";
import { isTestLogin } from "./test-login";

/** A row of the `app_users` view (0055, 0063): a login that holds a role. */
export type AppUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  /** The role's own key (0146): what role_can() and the rota ask about. */
  role_key: string;
  /** Every role held today, main first (held-roles.ts). Filled in by withHeldRoles(); absent means just role_key. */
  role_keys?: string[];
  /** Set when the person has left (0063): kept for past work, never offered for new. */
  archived_at: string | null;
};

const APP_USER_COLUMNS = "id, email, display_name, archived_at, role_key";

/** The name to show for a login: Google's display name, else the email. */
export function appUserLabel(user: Pick<AppUser, "email" | "display_name"> | null | undefined): string {
  if (!user) return "—";
  return user.display_name ?? user.email ?? "—";
}

/**
 * Only the name, for a picker or list that must not hand out addresses (Lutan, 2026-10-26, Recurring jobs):
 * the display name, else what comes before the @ of the email, never the address itself.
 */
export function appUserName(user: Pick<AppUser, "email" | "display_name"> | null | undefined): string {
  if (!user) return "—";
  return user.display_name ?? user.email?.split("@")[0] ?? "—";
}

/**
 * Logins a maintenance job can be assigned to: everyone with app access
 * except anyone who has been archived, or who is a test login
 * (test-login.ts). Sorted by the name that will
 * be shown.
 */
export async function loadAssignableUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("app_users")
    .select(APP_USER_COLUMNS)
    .is("archived_at", null)
    .returns<AppUser[]>();
  const users = (data ?? []).filter((u) => !isTestLogin(u)).sort((a, b) => appUserLabel(a).localeCompare(appUserLabel(b)));
  return { users, error: error?.message ?? null };
}

/** Labels for a set of login ids, for display where the view can't be embedded. */
export async function loadAppUsersById(supabase: SupabaseClient, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<string, AppUser>();
  const { data } = await supabase
    .from("app_users")
    .select(APP_USER_COLUMNS)
    .in("id", unique)
    .returns<AppUser[]>();
  return new Map((data ?? []).map((u) => [u.id, u]));
}
