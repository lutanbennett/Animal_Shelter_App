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

/**
 * One person in this shelter: their main role (the one the console changes), any additional roles they hold here (shown, never edited from the
 * console: they are the shelter's own Security page's), and how many OTHER shelters they hold a live main role at. A count, never names (#acwho).
 */
export type AccessLogin = {
  userId: string;
  email: string | null;
  roleKey: string;
  roleName: string;
  isAdmin: boolean;
  archived: boolean;
  extraRoles: { name: string; archived: boolean }[];
  otherShelters: number;
};
/** What an Add did: a login new to this shelter, a login already here moved to the chosen role (or brought back), or already here with it. */
export type AddOutcome = "new" | "reRoled" | "unchanged";
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
  const [roles, access, elsewhere] = await Promise.all([
    supabase.rpc("product_admin_shelter_roles", { p_shelter: shelterId }),
    supabase.rpc("product_admin_shelter_access", { p_shelter: shelterId }),
    supabase.rpc("product_admin_access_elsewhere", { p_shelter: shelterId }),
  ]);
  const failed = roles.error ?? access.error ?? elsewhere.error;
  if (failed) {
    const msg = accessError(t, failed.code, "reading the shelter's access");
    return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.accessList", failed, t.common);
  }
  type R = { key: string; name: string; is_admin: boolean };
  type L = { user_id: string; email: string | null; role_key: string; role_name: string; is_admin: boolean; is_main: boolean; archived_at: string | null };
  const rows = (access.data ?? []) as L[];
  const counts = new Map(((elsewhere.data ?? []) as { user_id: string; other_shelters: number }[]).map((e) => [e.user_id, e.other_shelters]));
  return {
    ok: true,
    roles: ((roles.data ?? []) as R[]).map((r) => ({ key: r.key, name: r.name, isAdmin: r.is_admin })),
    // One entry per person, keyed on their main row; additional roles (is_main = false) are grouped under it rather than dropped (#acwho).
    logins: rows
      .filter((l) => l.is_main)
      .map((l) => ({
        userId: l.user_id,
        email: l.email,
        roleKey: l.role_key,
        roleName: l.role_name,
        isAdmin: l.is_admin,
        archived: l.archived_at !== null,
        extraRoles: rows.filter((x) => !x.is_main && x.user_id === l.user_id).map((x) => ({ name: x.role_name, archived: x.archived_at !== null })),
        otherShelters: counts.get(l.user_id) ?? 0,
      })),
  };
}

/** Best effort, after the database accepted it: a login given the shelter's Admin role may enrol an authenticator, as the shelter's own Security page does. */
async function openSetupIfAdminRole(shelterId: string, userId: string, roleKey: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("product_admin_shelter_roles", { p_shelter: shelterId });
  const role = ((data ?? []) as { key: string; is_admin: boolean }[]).find((r) => r.key === roleKey);
  if (role?.is_admin) await openAuthSetup(userId);
}

export async function shelterAccessAdd(
  shelterId: string,
  email: string,
  roleKey: string,
  requestId: string | null,
): Promise<ActionResult<{ outcome: AddOutcome; otherShelters: number }>> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.accessAdd", write(t), { id: requestId, action: "productAdmin.accessAdd", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const addr = cleanEmail(email);
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    if (!addr || roleKey.trim() === "") return { ok: false, error: e.badId };
    // Read this shelter's main row for the address first, so the result can say which of the three things happened. The function itself
    // inserts or re-roles (0443); a product administrator is the only writer here, so the read and the write do not race in practice.
    const before = await supabase.rpc("product_admin_shelter_access", { p_shelter: shelterId });
    type Row = { email: string | null; role_key: string; is_main: boolean; archived_at: string | null };
    const prior = ((before.data ?? []) as Row[]).find((r) => r.is_main && (r.email ?? "").toLowerCase() === addr.toLowerCase());
    const outcome: AddOutcome = !prior ? "new" : prior.role_key === roleKey && prior.archived_at === null ? "unchanged" : "reRoled";
    const { data, error } = await supabase.rpc("product_admin_access_add", { p_shelter: shelterId, p_email: addr, p_role_key: roleKey });
    if (error) {
      const msg = accessError(t, error.code, "adding that login");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.accessAdd", error, t.common);
    }
    await openSetupIfAdminRole(shelterId, data as string, roleKey);
    const others = await supabase.rpc("product_admin_access_elsewhere", { p_shelter: shelterId });
    const otherShelters = ((others.data ?? []) as { user_id: string; other_shelters: number }[]).find((o) => o.user_id === data)?.other_shelters ?? 0;
    revalidatePath("/platform");
    return { ok: true, outcome, otherShelters };
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
