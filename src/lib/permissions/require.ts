import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { refuse } from "@/lib/auth/require-role";
import { can, type Permissions } from "./can";
import { loadPermissions } from "./load";
import type { Level, LevelKey, YesNoKey } from "./catalogue";
import { ROUTES, canOpen } from "./routes";

/**
 * The page guard: one activity, one guard, no role name anywhere (§8).
 * Signed out → /login; not allowed → the in-app no-access page (refuse()).
 * Returns what the page needs so it does not look them up again.
 *
 *   const { supabase, perms } = await requirePermission("stock.count");
 *   const { supabase, perms } = await requirePermission("medical.weight", "read");
 *
 * A server action does not use this: a redirect from inside a form
 * submission is not a refusal anyone reads. It returns its own wording:
 *
 *   if (!can(await loadPermissions(), "stock.count")) return { ok: false, error: e.notAuthorized };
 */
export async function requirePermission(activity: YesNoKey): Promise<Guarded>;
export async function requirePermission(activity: LevelKey, level?: Level): Promise<Guarded>;
export async function requirePermission(activity: YesNoKey | LevelKey, level: Level = "edit"): Promise<Guarded> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perms = await loadPermissions();
  if (!perms || !can(perms, activity as LevelKey, level)) refuse(perms?.role.key);

  return { supabase, user, perms };
}

/**
 * The guard for a landing page (Management, Settings): a page that is a grid of the pages under
 * it, so it has no activity of its own. It opens for whoever may open at least one page under
 * `prefix` in the route registry, and the grid then shows only the tiles that person may open.
 * Signed out → /login; nothing to open → refused, as every guard here refuses.
 *
 *   const { perms } = await requireAnyPageUnder("/management");
 */
export async function requireAnyPageUnder(prefix: string): Promise<Guarded> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perms = await loadPermissions();
  if (!perms || !ROUTES.some((r) => r.path.startsWith(prefix + "/") && canOpen(perms, r))) refuse(perms?.role.key);

  return { supabase, user, perms };
}

type Guarded = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string };
  perms: Permissions;
};
