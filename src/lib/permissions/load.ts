import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { parsePermissions, type Permissions } from "./can";

/**
 * The signed-in person's permissions: one my_permissions() call per request
 * (memoised with cache(), so the menu, the page and an action's guard share
 * it). Null when signed out or when the login has no live role, which can()
 * answers no to. This is the live lookup (§10, L9): the same tables
 * has_permission() reads, so a changed cell or an archived person takes
 * effect on the next request, with no token to go stale.
 */
export const loadPermissions = cache(async (): Promise<Permissions | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_permissions");
  if (error) return null;
  return parsePermissions(data);
});
