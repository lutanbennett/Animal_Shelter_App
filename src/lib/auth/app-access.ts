import type { SupabaseClient } from "@supabase/supabase-js";
import { entersApp, parsePermissions } from "@/lib/permissions/can";
import { isPublicPath } from "@/lib/public-paths";
import { DEFAULT_SIGNED_IN_PATH } from "./next-path";

/**
 * Whether a login is in the app is entersApp() on its permissions, read through my_permissions(): Admin, or a role
 * that holds at least one card's access. No column switches a role on or off. Everything else a session can be — signed
 * out, archived or never given a role (null here), or `public_viewer` (0085) — sees the public website and
 * nothing more. This replaced APP_ACCESS_ROLES / hasAppAccess, a list of enum values that still named
 * `staff` (retired by 0173) and knew a configured role only by the enum it borrows
 * (docs/decisions/2026-10-11-perm-role-lists.md).
 */
export type SessionRole = { key: string; entersApp: boolean };

/** The signed-in login's role: its key, and whether it opens the app. Null when signed out or without a live role. */
export async function loadSessionRole(supabase: SupabaseClient): Promise<SessionRole | null> {
  const { data } = await supabase.rpc("my_permissions");
  const perms = parsePermissions(data);
  return perms ? { key: perms.role.key, entersApp: entersApp(perms) } : null;
}

/**
 * Where a sign-in lands. App users go where `next` says, else the app's home
 * (/home, their who-does-what tiles; a doctor too, since 2026-10-18 — it was
 * sent to Appointments by role key, a page its cells did not open). A public
 * viewer lands on the home page — or on `next` when that is a public page, so
 * a resident card scanned on the locked site still opens after sign-in.
 */
export function signedInLandingPath(role: SessionRole | null, next: string | null): string {
  if (role?.entersApp) return next ?? DEFAULT_SIGNED_IN_PATH;
  if (next && isPublicPath(new URL(next, "http://x").pathname)) return next;
  return "/";
}
