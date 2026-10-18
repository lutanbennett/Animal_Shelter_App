import type { SupabaseClient } from "@supabase/supabase-js";
import { parsePermissions } from "@/lib/permissions/can";
import { isPublicPath } from "@/lib/public-paths";
import { DEFAULT_SIGNED_IN_PATH } from "./next-path";

/**
 * Whether a role opens the app is the role's own `opens_app` (roles, 0132), read through my_permissions():
 * the same answer private.has_app_access() gives the database. Everything else a session can be — signed
 * out, archived or never given a role (null here), or `public_viewer` (0085) — sees the public website and
 * nothing more. This replaced APP_ACCESS_ROLES / hasAppAccess, a list of enum values that still named
 * `staff` (retired by 0173) and knew a configured role only by the enum it borrows
 * (docs/decisions/2026-10-11-perm-role-lists.md).
 */
export type SessionRole = { key: string; opensApp: boolean };

/**
 * A login for testing the locked UAT/test sites as a visitor: it signs in,
 * which gets it past `PUBLIC_SITE: "locked"`, and then sees only the
 * public pages (docs/decisions.md, 2026-09-25).
 */
export const PUBLIC_VIEWER_ROLE = "public_viewer";

/** The signed-in login's role: its key, and whether it opens the app. Null when signed out or without a live role. */
export async function loadSessionRole(supabase: SupabaseClient): Promise<SessionRole | null> {
  const { data } = await supabase.rpc("my_permissions");
  const perms = parsePermissions(data);
  return perms ? { key: perms.role.key, opensApp: perms.role.opensApp } : null;
}

/**
 * Where a sign-in lands. App users go where `next` says, else the app's home
 * (/home, their who-does-what tiles; a doctor too, since 2026-10-18 — it was
 * sent to Appointments by role key, a page its cells did not open). A public
 * viewer lands on the home page — or on `next` when that is a public page, so
 * a resident card scanned on the locked site still opens after sign-in.
 */
export function signedInLandingPath(role: SessionRole | null, next: string | null): string {
  if (role?.opensApp) return next ?? DEFAULT_SIGNED_IN_PATH;
  if (next && isPublicPath(new URL(next, "http://x").pathname)) return next;
  return "/";
}
