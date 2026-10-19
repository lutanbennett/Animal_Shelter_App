"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionResult } from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { hasTwoStep } from "@/lib/auth/two-step";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { homeTilesFor, OUTSIDE_PATHS } from "@/lib/home/tiles";
import { loadRoleCards, loadRolePermissions } from "@/lib/home/roles";
import { routeFor } from "@/lib/permissions/routes";

/**
 * Settings → Who does what → Home screen: which pages a role shows as tiles, and in what order (role_home_tiles, 0225).
 * docs/decisions/2026-10-19-role-home-tiles-panel.md
 *
 * Admin only (Lutan, 2026-10-19: "whoever is in the admin group can manage tiles"): the Admin ROLE, at the
 * authenticator-app step. No role edits its own tiles, Management's included. The table's own policy says the same
 * (0225: is_admin() for every write, plus a restrictive aal2 policy on insert, update and delete), so this runs as the
 * admin's own session and the database is the enforcement; the checks here answer in words first. The change reaches
 * audit_log through the table's record_audit() trigger.
 *
 * A role's set is replaced without a SQL function (this stream has no migration): upsert every wanted page at its new
 * position, then delete the pages no longer wanted. A failure part-way leaves a superset of the old and new sets, never
 * fewer tiles than either, and the next save repairs it.
 */
type Supabase = Awaited<ReturnType<typeof createClient>>;
type Dict = Awaited<ReturnType<typeof getT>>["t"];

const OUTSIDE = new Set(OUTSIDE_PATHS);
const isHomePath = (p: string) => OUTSIDE.has(p) || !!routeFor(p);

async function guard(t: Dict, roleKey: string): Promise<{ ok: false; error: string } | { ok: true; supabase: Supabase; roleId: string }> {
  const w = t.admin.whoDoesWhat.edit;
  if (!(await hasAdminRole())) return { ok: false, error: w.adminOnly };
  if (!(await hasTwoStep())) return { ok: false, error: w.twoStepRequired };
  const supabase = await createClient();
  const { data } = await supabase
    .from("roles")
    .select("id, kind, opens_app")
    .eq("key", roleKey)
    .is("archived_at", null)
    .limit(1)
    .returns<{ id: string; kind: string; opens_app: boolean }[]>();
  const role = data?.[0];
  if (!role || role.kind === "fixed" || !role.opens_app) return { ok: false, error: w.noSuchRole };
  return { ok: true, supabase, roleId: role.id };
}

/** The role's saved tiles; when it has none yet, the home it derives today, so the first edit starts from what people see. */
async function currentPaths(supabase: Supabase, roleId: string, roleKey: string, t: Dict): Promise<string[] | null> {
  const { data, error } = await supabase.from("role_home_tiles").select("path").eq("role_id", roleId).order("position").returns<{ path: string }[]>();
  if (error) return null;
  if ((data ?? []).length > 0) return data!.map((r) => r.path);
  const perms = await loadRolePermissions(supabase, roleKey);
  if (!perms) return [];
  return homeTilesFor(perms, t, undefined, await loadRoleCards(roleKey)).map((x) => x.href);
}

async function save(supabase: Supabase, roleId: string, paths: string[], where: string, t: Dict): Promise<ActionResult> {
  const rows = paths.map((path, position) => ({ role_id: roleId, path, position }));
  if (rows.length > 0) {
    const { error } = await supabase.from("role_home_tiles").upsert(rows, { onConflict: "role_id,path" });
    if (error) return databaseFailure(where, error, t.common);
  }
  const { data: existing, error: readError } = await supabase.from("role_home_tiles").select("path").eq("role_id", roleId).returns<{ path: string }[]>();
  if (readError) return databaseFailure(where, readError, t.common);
  const gone = (existing ?? []).map((r) => r.path).filter((p) => !paths.includes(p));
  if (gone.length > 0) {
    const { error } = await supabase.from("role_home_tiles").delete().eq("role_id", roleId).in("path", gone);
    if (error) return databaseFailure(where, error, t.common);
  }
  revalidatePath("/admin/who-does-what");
  revalidatePath("/home");
  return { ok: true };
}

export async function addHomeTile(roleKey: string, path: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.addHomeTile", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    if (!isHomePath(path)) return { ok: false, error: t.common.somethingWentWrong("page") };
    const paths = await currentPaths(g.supabase, g.roleId, roleKey, t);
    if (!paths) return { ok: false, error: t.common.somethingWentWrong("tiles") };
    if (paths.includes(path)) return { ok: false, error: t.admin.whoDoesWhat.homeView.alreadyHas };
    return save(g.supabase, g.roleId, [...paths, path], "whoDoesWhat.addHomeTile", t);
  });
}

export async function removeHomeTile(roleKey: string, path: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.removeHomeTile", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    const paths = await currentPaths(g.supabase, g.roleId, roleKey, t);
    if (!paths) return { ok: false, error: t.common.somethingWentWrong("tiles") };
    // Taking away the last tile would send the role back to a derived home it did not choose; ask for the Add first.
    if (paths.length <= 1 && paths.includes(path)) return { ok: false, error: t.admin.whoDoesWhat.homeView.lastTile };
    return save(g.supabase, g.roleId, paths.filter((p) => p !== path), "whoDoesWhat.removeHomeTile", t);
  });
}

export async function moveHomeTile(roleKey: string, path: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.moveHomeTile", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    const paths = await currentPaths(g.supabase, g.roleId, roleKey, t);
    if (!paths) return { ok: false, error: t.common.somethingWentWrong("tiles") };
    const i = paths.indexOf(path);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= paths.length) return { ok: true };
    [paths[i], paths[j]] = [paths[j], paths[i]];
    return save(g.supabase, g.roleId, paths, "whoDoesWhat.moveHomeTile", t);
  });
}
