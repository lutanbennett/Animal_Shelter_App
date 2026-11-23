"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, databaseFailure, runWriteAction, type WriteMessages } from "@/lib/action-result";
import { hasTwoStep } from "@/lib/auth/two-step";
import { isProductAdmin } from "@/lib/auth/product-admin";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { createClient } from "@/lib/supabase/server";
import { createAuthLogin, deleteAuthLogin } from "@/lib/platform/create-login";

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
  if (error) return { ok: false, error: error.code === "42501" ? e.refused("the login check") : e.badId };
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
      const msg = shelterError(e, error.code, e.noLoginForAddress, e.noLoginForAddress, "adding that product administrator");
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
  what: string,
): string | null {
  // 42501 is the database refusing, not necessarily an expired second step: say what was refused (#msgtp).
  if (code === "42501") return e.refused(what);
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
      const msg = shelterError(e, error.code, e.shelterExists, e.badShelter, "creating the shelter");
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
      const msg = shelterError(e, error.code, e.adminRoleExists, e.badHost, "giving the shelter an Admin role");
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
      const msg = shelterError(e, error.code, e.loginUnavailable, e.noLoginForAddress, "linking that login");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.linkAdmin", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

/*
 * Create a shelter's FIRST login and link it as its Admin (#flogn, 0425). The database is the gate: product_admin_permit_first_login
 * (signed-in client, PADMIN and aal2) answers only for a shelter whose Admin role has no login yet and an address no login has, and records it.
 * Only after that does the service role create the login, with a temporary password shown once (stored replay: a refusal). Admin gets no cards.
 * If the link fails the new login is deleted again, so nothing orphaned is left.
 */
export async function createShelterAdminLogin(
  shelterId: string,
  email: string,
  requestId: string | null,
): Promise<ActionResult<{ temporaryPassword: string; email: string }>> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction(
    "productAdmin.createAdminLogin",
    write(t),
    { id: requestId, action: "productAdmin.createAdminLogin", db: supabase },
    async () => {
      if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
      if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
      const addr = cleanEmail(email);
      if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
      if (!addr) return { ok: false, error: e.badId };
      const permit = await supabase.rpc("product_admin_permit_first_login", { p_shelter: shelterId, p_email: addr });
      if (permit.error) {
        const msg = shelterError(e, permit.error.code, e.firstLoginRefused, e.firstLoginRefused, "creating that login");
        return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.createAdminLogin", permit.error, t.common);
      }
      const created = await createAuthLogin(addr);
      if ("error" in created) {
        if (created.error.code === "email_exists") return { ok: false, error: e.firstLoginRefused };
        return databaseFailure("productAdmin.createAdminLogin", new Error("createUser failed: " + (created.error.code ?? "unknown")), t.common);
      }
      const linked = await supabase.rpc("product_admin_link_shelter_admin_by_email", { p_shelter: shelterId, p_email: addr });
      if (linked.error) {
        await deleteAuthLogin(created.id);
        return databaseFailure("productAdmin.createAdminLogin", linked.error, t.common);
      }
      revalidatePath("/platform");
      return { ok: true, temporaryPassword: created.temporaryPassword, email: addr };
    },
    { storedAs: () => ({ ok: false, error: e.secretShownOnce }) },
  );
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
      const msg = shelterError(e, error.code, e.badHost, e.badHost, "adding the starting content");
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
      const msg = shelterError(e, error.code, e.hostTaken, e.badHost, "adding that web address");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.mapHost", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

/** Open, lock or switch off one shelter's website (product_admin_set_shelter_site, 0436; #wbopn). The deployment's PUBLIC_SITE floor still wins when more closed. */
export async function setShelterSite(shelterId: string, site: "open" | "locked" | "off", requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.setSite", write(t), { id: requestId, action: "productAdmin.setSite", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId) || (site !== "open" && site !== "locked" && site !== "off")) return { ok: false, error: e.badHost };
    const { error } = await supabase.rpc("product_admin_set_shelter_site", { p_shelter: shelterId, p_site: site });
    if (error) {
      const msg = shelterError(e, error.code, e.badHost, e.badHost, "changing the website");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.setSite", error, t.common);
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
      const msg = shelterError(e, error.code, e.noSuchHost, e.noSuchHost, "removing that web address");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.unmapHost", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

/**
 * Set a shelter's receipt series and the issuer printed on its receipts (product_admin_set_shelter_receipts, 0416; #rcpfm).
 * The series is capital letters and cannot change once set (the database answers 23505). The issuer block is the same for both
 * receipt countries (TH, US) and carries no registration or statement lines: a receipt must not claim a status nobody has
 * entered (src/lib/donations/issuer.ts), so those stay empty until a person adds them.
 */
export async function setShelterNames(shelterId: string, displayName: string, shortName: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.setNames", write(t), { id: requestId, action: "productAdmin.setNames", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    const full = displayName.trim();
    const short = shortName.trim();
    if (full === "" || short === "" || full.length > 120 || short.length > 60) return { ok: false, error: e.badNames };
    const { error } = await supabase.rpc("product_admin_set_shelter_names", { p_shelter: shelterId, p_display_name: full, p_short_name: short });
    if (error) {
      const msg = shelterError(e, error.code, e.badNames, e.badNames, "saving the names");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.setNames", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function setShelterReceipts(
  shelterId: string,
  series: string,
  issuerName: string,
  addressLines: string,
  requestId: string | null,
): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.setReceipts", write(t), { id: requestId, action: "productAdmin.setReceipts", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    const s = series.trim().toUpperCase();
    const name = issuerName.trim();
    const lines = addressLines.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!/^[A-Z]+$/.test(s) || name === "" || lines.length === 0) return { ok: false, error: e.badReceipts };
    const block = { name, addressLines: lines, registrationLines: [], statementLines: [] };
    const { error } = await supabase.rpc("product_admin_set_shelter_receipts", { p_shelter: shelterId, p_series: s, p_issuers: { TH: block, US: block } });
    if (error) {
      const msg = shelterError(e, error.code, e.receiptSeriesTaken, e.badReceipts, "saving the receipt numbers");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.setReceipts", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

/*
 * Account holder, archive and primary address (0428, #pacon). Same pattern: the signed-in client, and the functions raise for anyone who is not
 * a product administrator at aal2. Archiving touches only archived_at: nothing is deleted, and both doors (website and staff) close in the
 * resolver, effective within a minute.
 */
export async function setShelterAccountHolder(
  shelterId: string,
  name: string,
  email: string,
  phone: string,
  location: string,
  requestId: string | null,
): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.setAccountHolder", write(t), { id: requestId, action: "productAdmin.setAccountHolder", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    if (name.trim() === "") return { ok: false, error: e.badAccountHolder };
    if (email.trim() !== "" && !cleanEmail(email)) return { ok: false, error: e.badId };
    const { error } = await supabase.rpc("product_admin_set_shelter_account_holder", {
      p_shelter: shelterId,
      p_name: name.trim(),
      p_email: email.trim(),
      p_phone: phone.trim(),
      p_location: location.trim(),
    });
    if (error) {
      const msg = shelterError(e, error.code, e.badAccountHolder, e.badAccountHolder, "saving the account holder");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.setAccountHolder", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function setShelterArchived(shelterId: string, archived: boolean, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.setArchived", write(t), { id: requestId, action: "productAdmin.setArchived", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    const { error } = await supabase.rpc("product_admin_set_shelter_archived", { p_shelter: shelterId, p_archived: archived });
    if (error) {
      const msg = shelterError(e, error.code, e.badHost, e.badHost, archived ? "closing the shelter" : "reopening the shelter");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.setArchived", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

export async function setShelterPrimaryHost(shelterId: string, host: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.setPrimaryHost", write(t), { id: requestId, action: "productAdmin.setPrimaryHost", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(shelterId)) return { ok: false, error: e.badHost };
    const { error } = await supabase.rpc("product_admin_set_primary_host", { p_shelter: shelterId, p_host: host.trim() });
    if (error) {
      const msg = shelterError(e, error.code, e.badHost, e.badHost, "choosing the website");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.setPrimaryHost", error, t.common);
    }
    revalidatePath("/platform");
    return { ok: true };
  });
}

/*
 * The enquiry queue (#shsup, last half; 0427 table, 0428 carry). Same pattern: signed-in client, product administrator plus aal2.
 * The status change is a plain update the table's own policies gate (is_product_admin() and a restrictive aal2); a refused update
 * changes ZERO rows rather than raising, so the affected row is read back and none means refused. Only an open enquiry (new or
 * contacted) can move, which is the same rule product_admin_carry_enquiry applies for declined.
 */
export async function setEnquiryStatus(
  enquiryId: string,
  status: "contacted" | "declined",
  note: string,
  requestId: string | null,
): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const q = t.admin.productAdmin.enquiries;
  const supabase = await createClient();
  return runWriteAction("productAdmin.setEnquiryStatus", write(t), { id: requestId, action: "productAdmin.setEnquiryStatus", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(enquiryId)) return { ok: false, error: q.carryNoEnquiry };
    const trimmed = note.trim().slice(0, 2000);
    const { data, error } = await supabase
      .from("shelter_enquiries")
      .update({ status, status_note: trimmed === "" ? null : trimmed, status_at: new Date().toISOString() })
      .eq("id", enquiryId)
      .in("status", ["new", "contacted"])
      .select("id");
    if (error) {
      const msg = shelterError(e, error.code, q.refusedStatus, q.refusedStatus, "changing the enquiry");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.setEnquiryStatus", error, t.common);
    }
    if (!data || data.length === 0) return { ok: false, error: q.refusedStatus };
    revalidatePath("/platform");
    return { ok: true };
  });
}

/**
 * Create a shelter from an enquiry: product_admin_create_shelter, then product_admin_carry_enquiry on the id it returned, so the
 * contact arrives without being retyped. The two are separate calls (no transaction by design). If the second fails the shelter exists
 * and the enquiry is still 'new'; the answer says exactly that. The carried values are READ BACK from the shelter, not assumed.
 */
export async function createShelterFromEnquiry(
  enquiryId: string,
  key: string,
  name: string,
  requestId: string | null,
): Promise<ActionResult<{ created: string; carried: { name: string; email: string; phone: string; location: string } }>> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const q = t.admin.productAdmin.enquiries;
  const supabase = await createClient();
  return runWriteAction("productAdmin.createFromEnquiry", write(t), { id: requestId, action: "productAdmin.createFromEnquiry", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    if (!UUID.test(enquiryId)) return { ok: false, error: q.carryNoEnquiry };
    const created = await supabase.rpc("product_admin_create_shelter", { p_key: key.trim(), p_name: name.trim() });
    if (created.error) {
      const msg = shelterError(e, created.error.code, e.shelterExists, e.badShelter, "creating the shelter");
      return msg ? { ok: false, error: msg } : databaseFailure("productAdmin.createFromEnquiry", created.error, t.common);
    }
    const shelterId = created.data as string;
    const carry = await supabase.rpc("product_admin_carry_enquiry", { p_shelter: shelterId, p_enquiry: enquiryId });
    if (carry.error) {
      const why =
        carry.error.code === "42501"
          ? e.refused("carrying the contact over")
          : /declined/.test(carry.error.message ?? "")
            ? q.carryDeclined
            : /another shelter/.test(carry.error.message ?? "")
              ? q.carryTaken
              : /different enquiry/.test(carry.error.message ?? "")
                ? q.carryOther
                : /no such enquiry/.test(carry.error.message ?? "")
                  ? q.carryNoEnquiry
                  : t.common.notAccepted;
      revalidatePath("/platform");
      return { ok: false, error: q.carryFailed(name.trim(), why) };
    }
    const read = await supabase.rpc("product_admin_shelters");
    const row = ((read.data ?? []) as { id: string; account_holder_name: string | null; account_holder_email: string | null; account_holder_phone: string | null; account_holder_location: string | null }[]).find((x) => x.id === shelterId);
    revalidatePath("/platform");
    return {
      ok: true,
      created: name.trim(),
      carried: { name: row?.account_holder_name ?? "", email: row?.account_holder_email ?? "", phone: row?.account_holder_phone ?? "", location: row?.account_holder_location ?? "" },
    };
  });
}
