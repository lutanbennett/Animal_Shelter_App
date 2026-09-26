import type { SupabaseClient } from "@supabase/supabase-js";
import { isPublicPath } from "@/lib/public-paths";
import { DEFAULT_SIGNED_IN_PATH } from "./next-path";

/**
 * The roles that open the app. Everything else a session can be — signed
 * out, archived or never given a role (current_user_role() is null for
 * both, 0063), or `public_viewer` (0085) — sees the public website and
 * nothing more. The same allow-list as private.has_app_access() in 0086,
 * so a role added later starts outside the app until someone decides
 * otherwise (docs/decisions.md, 2026-09-26).
 */
export const APP_ACCESS_ROLES = ["admin", "management", "staff", "vet", "volunteer"] as const;

/**
 * A login for testing the locked UAT/test sites as a visitor: it signs in,
 * which gets it past `PUBLIC_SITE: "locked"`, and then sees only the
 * public pages (docs/decisions.md, 2026-09-25).
 */
export const PUBLIC_VIEWER_ROLE = "public_viewer";

export function hasAppAccess(role: string | null | undefined): boolean {
  return !!role && (APP_ACCESS_ROLES as readonly string[]).includes(role);
}

export async function loadCurrentRole(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.rpc("current_user_role");
  return (data as string | null) ?? null;
}

/** Whether this request's session opens the app — false signed out. */
export async function sessionHasAppAccess(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return hasAppAccess(await loadCurrentRole(supabase));
}

/**
 * Where a sign-in lands. Staff go where `next` says, else the app's home,
 * My tasks. A public viewer lands on the home page — or on `next` when that is
 * a public page, so a resident card scanned on the locked site still opens
 * after sign-in.
 */
export function signedInLandingPath(role: string | null, next: string | null): string {
  if (hasAppAccess(role)) return next ?? DEFAULT_SIGNED_IN_PATH;
  if (next && isPublicPath(new URL(next, "http://x").pathname)) return next;
  return "/";
}
