"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, databaseFailure, runWriteAction, type WriteMessages } from "@/lib/action-result";
import { hasTwoStep } from "@/lib/auth/two-step";
import { isProductAdmin } from "@/lib/auth/product-admin";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { createClient } from "@/lib/supabase/server";

/*
 * Add and remove a product administrator (#shmgt). The checks here are the courtesy: the database is the
 * security. 0411's policies answer is_product_admin() for insert and delete and a restrictive policy demands
 * aal2 on both, so a press that gets past these checks by a forged request is still refused there.
 * Both go through the signed-in client; no service role is used (docs/decisions/2026-11-18-product-admin-screen.md).
 */

const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** An address is one exact login: no wildcards (the database refuses them too, 0417). Returns the cleaned address or null. */
function cleanEmail(raw: string): string | null {
  const v = raw.trim();
  // The database refuses % _ * as well (a wildcard cannot become a search) and answers 22023.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

/** Whether a login has this exact address: one yes/no, product administrator at aal2 only (0417). Never a list, never a near match. */
export async function loginExists(email: string): Promise<{ ok: boolean; exists?: boolean; error?: string }> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
  if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
  const addr = cleanEmail(email);
  if (!addr) return { ok: false, error: e.badId };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("product_admin_login_exists", { p_email: addr });
  if (error) return { ok: false, error: error.code === "42501" ? e.stepUpExpired : e.badId };
  return { ok: true, exists: data === true };
}

export async function addProductAdmin(email: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.add", write(t), { id: requestId, action: "productAdmin.add", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const addr = cleanEmail(email);
    if (!addr) return { ok: false, error: e.badId };
    const { error } = await supabase.rpc("product_admin_add_by_email", { p_email: addr });
    if (error) {
      const msg = shelterError(e, error.code, e.noLoginForAddress, e.noLoginForAddress);
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.add", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function removeProductAdmin(userId: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.remove", write(t), { id: requestId, action: "productAdmin.remove", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Not a permission: it stops the list being emptied by one press. Someone else removes you.
    if (!user || user.id === userId) return { ok: false, error: e.lastOne };
    const { error } = await supabase.from("product_admins").delete().eq("user_id", userId);
    if (error) return databaseFailure("productAdmin.remove", error, t.common);
    revalidatePath("/platform");
    return { ok: true };
  });
}

/*
 * Create a shelter, map a web address to it, remove an address (#shmgt, write half; 0414). Same pattern as
 * above: the checks here are the courtesy and the functions themselves raise for anyone who is not a product
 * administrator at aal2. They are called through the signed-in client, never the service role, so auth.uid()
 * and the JWT are the product administrator's. There is no delete or rename of a shelter and no one-step
 * move of an address, because no function does either.
 */
function shelterError(
  e: Dictionary["admin"]["productAdmin"]["errors"],
  code: string | undefined,
  on23505: string,
  on22023: string,
): string | null {
  if (code === "42501") return e.stepUpExpired;
  if (code === "23505") return on23505;
  if (code === "22023") return on22023;
  return null;
}

export async function createShelter(key: string, name: string, requestId: string | null): Promise<ActionResult<{ created: string }>> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.createShelter", write(t), { id: requestId, action: "productAdmin.createShelter", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const { error } = await supabase.rpc("product_admin_create_shelter", { p_key: key.trim(), p_name: name.trim() });
    if (error) {
      const msg = shelterError(e, error.code, e.shelterExists, e.badShelter);
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.createShelter", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true, created: name.trim() };
  });
}

/*
 * Give a shelter its Admin role and link one existing login to it (#shadm, 0415). Same pattern: signed-in
 * client, and the functions raise for anyone who is not a product administrator at aal2. The role is given no
 * cards: Admin is decided by roles.is_admin. A login is only picked by account id, never created here (no
 * service role). 23505 on the link means already linked OR already has a main role elsewhere: one sentence.
 */
export async function createShelterAdminRole(shelterId: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.createAdminRole", write(t), { id: requestId, action: "productAdmin.createAdminRole", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    const { error } = await supabase.rpc("product_admin_create_shelter_admin_role", { p_shelter: shelterId });
    if (error) {
      const msg = shelterError(e, error.code, e.adminRoleExists, e.badHost);
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.createAdminRole", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function linkShelterAdmin(shelterId: string, email: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.linkAdmin", write(t), { id: requestId, action: "productAdmin.linkAdmin", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const addr = cleanEmail(email);
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    if (!addr) return { ok: false, error: e.badId };
    const { error } = await supabase.rpc("product_admin_link_shelter_admin_by_email", { p_shelter: shelterId, p_email: addr });
    if (error) {
      const msg = shelterError(e, error.code, e.loginUnavailable, e.noLoginForAddress);
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.linkAdmin", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

/** Add a shelter's starting content (seed_shelter_defaults, 0416/0417): idempotent, so a repeat press changes nothing. */
export async function seedShelterDefaults(shelterId: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.seedDefaults", write(t), { id: requestId, action: "productAdmin.seedDefaults", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    const { error } = await supabase.rpc("seed_shelter_defaults", { p_shelter: shelterId });
    if (error) {
      const msg = shelterError(e, error.code, e.badHost, e.badHost);
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.seedDefaults", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function mapShelterHost(shelterId: string, host: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.mapHost", write(t), { id: requestId, action: "productAdmin.mapHost", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    const { error } = await supabase.rpc("product_admin_map_host", { p_shelter: shelterId, p_host: host.trim() });
    if (error) {
      const msg = shelterError(e, error.code, e.hostTaken, e.badHost);
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.mapHost", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function unmapShelterHost(host: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.unmapHost", write(t), { id: requestId, action: "productAdmin.unmapHost", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const { error } = await supabase.rpc("product_admin_unmap_host", { p_host: host });
    if (error) {
      const msg = shelterError(e, error.code, e.noSuchHost, e.noSuchHost);
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.unmapHost", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}
