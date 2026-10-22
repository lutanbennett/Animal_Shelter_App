import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * Whether the signed-in login sees the left-hand menu (NavPane), or tiles only.
 * docs/decisions/2026-10-22-role-show-menu-app.md
 *
 * Admin always does (the Director's desk view at night). Anyone else does while ANY role they hold has
 * roles.show_menu = true (0247, default true), so a login holding two roles keeps the menu until both are off.
 * roles is Admin-only under RLS, so it is read with the service role after the login is known, for the keys the
 * login's own my_permissions() returned. Nothing in it is secret. A failed read keeps the menu: tiles-only is
 * the state that needs proof, the menu is the safe one.
 */
export const showMenuForLogin = cache(async (): Promise<boolean> => {
  const perms = await loadPermissions();
  if (!perms) return true;
  if (perms.isAdmin) return true;
  const { data, error } = await createAdminClient().from("roles").select("show_menu").in("key", [...perms.roles]);
  if (error || !data || data.length === 0) return true;
  return data.some((r) => r.show_menu !== false);
});
