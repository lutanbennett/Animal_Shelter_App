"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, databaseFailure, runWriteAction, type WriteMessages } from "@/lib/action-result";
import { hasTwoStep } from "@/lib/auth/two-step";
import { isProductAdmin } from "@/lib/auth/product-admin";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { createClient } from "@/lib/supabase/server";
import { openAuthSetup } from "@/lib/platform/create-login";

/*
 * A shelter's access, as a BACKUP to its own Admin (#shsec, 0438). Add a login to one of the shelter's EXISTING roles, move a login to another
 * existing role, take a login out (archive: reversible, nothing deleted). Same pattern as actions.ts: the signed-in client, and the functions raise
 * for anyone who is not a product administrator at aal2. There is no action here, and no function behind one, that creates a role, edits a role or
 * touches a card: giving an existing role grants exactly the cards it already holds. Every change is audited by user_roles' own trigger as the
 * product administrator (auth.uid()) and the shelter (the row's shelter_id). A change that would leave the shelter with no live Admin login is
 * refused by the database (23514).
 */

const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanEmail(raw: string): string | null {
  const v = raw.trim();
  return /^[^\s@%_*]+@[^\s@%_*]+\.[^\s@%_*]+$/.test(v) ? v : null;
}

export type AccessLogin = { userId: string; email: string | null; roleKey: string; roleName: string; isAdmin: boolean; archived: boolean };
export type AccessRole = { key: string; name: string; isAdmin: boolean };

function accessError(t: Dictionary, code: string | undefined, what: string): string | null {
  const a = t.admin.productAdmin.access;
  if (code === "42501") return t.admin.productAdmin.errors.refused(what);
  if (code === "23514") return a.lockOut;
  if (code === "23505") return a.alreadyHere;
  if (code === "22023") return a.notFound;
  return null;
}

export async function shelterAccessList(shelterId: string): Promise<ActionResult<{ roles: AccessRole[]; logins: AccessLogin[] }>> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
  if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
  if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
  const supabase = await createClient();
  const [roles, access] = await Promise.all([
    supabase.rpc("product_admin_shelter_roles", { p_shelter: shelterId }),
    supabase.rpc("product_admin_shelter_access", { p_shelter: shelterId }),
  ]);
  const failed = roles.error ?? access.error;
  if (failed) {
    const msg = accessError(t, failed.code, "reading the shelter's access");
    return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.accessList", failed, t.common);
  }
  type R = { key: string; name: string; is_admin: boolean };
  type L = { user_id: string; email: string | null; role_key: string; role_name: string; is_admin: boolean; is_main: boolean; archived_at: string | null };
  return {
    ok: true,
    roles: ((roles.data ?? []) as R[]).map((r) => ({ key: r.key, name: r.name, isAdmin: r.is_admin })),
    logins: ((access.data ?? []) as L[])
      .filter((l) => l.is_main)
      .map((l) => ({ userId: l.user_id, email: l.email, roleKey: l.role_key, roleName: l.role_name, isAdmin: l.is_admin, archived: l.archived_at !== null })),
  };
}

/** Best effort, after the database accepted it: a login given the shelter's Admin role may enrol an authenticator, as the shelter's own Security page does. */
async function openSetupIfAdminRole(shelterId: string, userId: string, roleKey: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("product_admin_shelter_roles", { p_shelter: shelterId });
  const role = ((data ?? []) as { key: string; is_admin: boolean }[]).find((r) => r.key === roleKey);
  if (role?.is_admin) await openAuthSetup(userId);
}

export async function shelterAccessAdd(shelterId: string, email: string, roleKey: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.accessAdd", write(t), { id: requestId, action: "productAdmin.accessAdd", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const addr = cleanEmail(email);
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    if (!addr || roleKey.trim() === "") return { ok: false, error: e.badId };
    const { data, error } = await supabase.rpc("product_admin_access_add", { p_shelter: shelterId, p_email: addr, p_role_key: roleKey });
    if (error) {
      const msg = accessError(t, error.code, "adding that login");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.accessAdd", error, t.common);
    }
    await openSetupIfAdminRole(shelterId, data as string, roleKey);
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function shelterAccessSetRole(shelterId: string, userId: string, roleKey: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.accessSetRole", write(t), { id: requestId, action: "productAdmin.accessSetRole", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId) || !UUID.test(userId)) return { ok: false, error: e.badHost };
    const { error } = await supabase.rpc("product_admin_access_set_role", { p_shelter: shelterId, p_user: userId, p_role_key: roleKey });
    if (error) {
      const msg = accessError(t, error.code, "changing that role");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.accessSetRole", error, t.common);
    }
    await openSetupIfAdminRole(shelterId, userId, roleKey);
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function shelterAccessRemove(shelterId: string, userId: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.accessRemove", write(t), { id: requestId, action: "productAdmin.accessRemove", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId) || !UUID.test(userId)) return { ok: false, error: e.badHost };
    const { error } = await supabase.rpc("product_admin_access_remove", { p_shelter: shelterId, p_user: userId });
    if (error) {
      const msg = accessError(t, error.code, "taking that login out");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.accessRemove", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}
