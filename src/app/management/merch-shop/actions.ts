"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * Writes for the merchandise shop's staff screens. EVERY action here asks `merch.manage` at edit, the activity
 * the six merch_* tables' own policies ask (0369), and every control on the screens is drawn only when the login
 * holds it. They run as the signed-in login, never the service role, and report by redirecting back with ?ok / ?err
 * (plain forms: nothing here needs the browser's JavaScript).
 */

const BACK = "/management/merch-shop";
const CATALOGUE = `${BACK}?tab=catalogue`;

async function guard() {
  const perms = await loadPermissions();
  if (!perms || !can(perms, "merch.manage", "edit")) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const num = (f: FormData, k: string) => {
  const s = str(f, k);
  if (s === null) return null;
  const v = Number(s);
  return Number.isFinite(v) && v >= 0 ? v : null;
};

function done(path: string, flag: "ok" | "err", code: string): never {
  revalidatePath(BACK);
  revalidatePath(path.split("?")[0]);
  redirect(`${path}${path.includes("?") ? "&" : "?"}${flag}=${code}`);
}

/** Add or change a product (id present = change). */
export async function saveProduct(formData: FormData) {
  const g = await guard();
  if (!g) return done(CATALOGUE, "err", "notAllowed");
  const name = str(formData, "name");
  const price = num(formData, "price");
  const th = num(formData, "postageThailand");
  const ov = num(formData, "postageOverseas");
  if (!name || price === null || th === null || ov === null) return done(CATALOGUE, "err", "invalid");
  const row = {
    name,
    description: str(formData, "description"),
    price_thb: price,
    postage_thailand_thb: th,
    postage_overseas_thb: ov,
    supplier_id: str(formData, "supplierId"),
    photo_drive_file_id: str(formData, "photo"),
    updated_by: g.user.id,
  };
  const id = str(formData, "id");
  const { error } = id
    ? await g.supabase.from("merch_products").update(row).eq("id", id)
    : await g.supabase.from("merch_products").insert({ ...row, created_by: g.user.id });
  if (error) return done(CATALOGUE, "err", "failed");
  return done(CATALOGUE, "ok", "saved");
}

/** Show/hide and archive/restore a product. */
export async function setProductState(formData: FormData) {
  const g = await guard();
  if (!g) return done(CATALOGUE, "err", "notAllowed");
  const id = str(formData, "id");
  const what = str(formData, "what");
  const patch =
    what === "show"
      ? { shown: true }
      : what === "hide"
        ? { shown: false }
        : what === "archive"
          ? { archived_at: new Date().toISOString(), shown: false }
          : what === "restore"
            ? { archived_at: null }
            : null;
  if (!id || !patch) return done(CATALOGUE, "err", "invalid");
  const { error } = await g.supabase.from("merch_products").update({ ...patch, updated_by: g.user.id }).eq("id", id);
  if (error) return done(CATALOGUE, "err", "failed");
  return done(CATALOGUE, "ok", "saved");
}

/** Add a variant, or set stock and show/hide on one. */
export async function saveVariant(formData: FormData) {
  const g = await guard();
  if (!g) return done(CATALOGUE, "err", "notAllowed");
  const id = str(formData, "id");
  const stockRaw = num(formData, "stock");
  if (stockRaw === null) return done(CATALOGUE, "err", "invalid");
  const stock = Math.floor(stockRaw);
  const shown = formData.get("shown") === "on";
  let error;
  if (id) {
    ({ error } = await g.supabase.from("merch_variants").update({ shelter_stock: stock, shown }).eq("id", id));
  } else {
    const productId = str(formData, "productId");
    if (!productId) return done(CATALOGUE, "err", "invalid");
    ({ error } = await g.supabase
      .from("merch_variants")
      .insert({ product_id: productId, size: str(formData, "size"), colour: str(formData, "colour"), shelter_stock: stock, shown }));
  }
  if (error) return done(CATALOGUE, "err", error.code === "23505" ? "duplicate" : "failed");
  return done(CATALOGUE, "ok", "saved");
}

/** Mark paid: awaiting -> paid, with who and when, and the bank or Wise reference. */
export async function markPaid(formData: FormData) {
  const id = str(formData, "id");
  const path = `${BACK}/order/${id}`;
  const g = await guard();
  if (!g || !id) return done(path, "err", "notAllowed");
  const { data, error } = await g.supabase
    .from("merch_orders")
    .update({ payment_state: "paid", paid_at: new Date().toISOString(), paid_by: g.user.id, payment_reference: str(formData, "reference") })
    .eq("id", id)
    .eq("payment_state", "awaiting")
    .select("id");
  if (error || !data?.length) return done(path, "err", "failed");
  return done(path, "ok", "paid");
}

/** Per-part progress, carrier and tracking. "Sent to supplier" is only ever set by the daily email, never by hand. */
export async function savePart(formData: FormData) {
  const orderId = str(formData, "orderId");
  const path = `${BACK}/order/${orderId}`;
  const g = await guard();
  const partId = str(formData, "partId");
  if (!g || !partId) return done(path, "err", "notAllowed");
  const move = str(formData, "move");
  if (move !== "keep" && move !== "shipped" && move !== "delivered") return done(path, "err", "invalid");
  const { data: part } = await g.supabase.from("merch_order_parts").select("status, fulfilment").eq("id", partId).single();
  if (!part || part.status === "cancelled") return done(path, "err", "invalid");
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { carrier: str(formData, "carrier"), tracking_number: str(formData, "tracking"), note: str(formData, "note") };
  if (move === "shipped") Object.assign(patch, { status: "shipped", shipped_at: now });
  if (move === "delivered") Object.assign(patch, { status: "delivered", delivered_at: now });
  const { error } = await g.supabase.from("merch_order_parts").update(patch).eq("id", partId);
  if (error) return done(path, "err", "failed");
  return done(path, "ok", "saved");
}

export async function saveOrderNote(formData: FormData) {
  const id = str(formData, "id");
  const path = `${BACK}/order/${id}`;
  const g = await guard();
  if (!g || !id) return done(path, "err", "notAllowed");
  const { error } = await g.supabase.from("merch_orders").update({ staff_note: str(formData, "note") }).eq("id", id);
  if (error) return done(path, "err", "failed");
  return done(path, "ok", "saved");
}

/** Cancel an unpaid order: its parts are cancelled and what it took from the shelf goes back. */
export async function cancelOrder(formData: FormData) {
  const id = str(formData, "id");
  const path = `${BACK}/order/${id}`;
  const g = await guard();
  if (!g || !id) return done(path, "err", "notAllowed");
  const { data: cancelled, error } = await g.supabase
    .from("merch_orders")
    .update({ payment_state: "cancelled" })
    .eq("id", id)
    .eq("payment_state", "awaiting")
    .select("id");
  if (error || !cancelled?.length) return done(path, "err", "failed");
  const { data: parts } = await g.supabase.from("merch_order_parts").select("id, fulfilment").eq("order_id", id);
  const shelterParts = (parts ?? []).filter((p) => p.fulfilment === "shelter").map((p) => p.id as string);
  if (shelterParts.length) {
    const { data: items } = await g.supabase.from("merch_order_items").select("variant_id, quantity").in("part_id", shelterParts);
    for (const it of items ?? []) {
      if (!it.variant_id) continue;
      // Put the stock back; the equality on the value just read refuses a race, so retry a few times.
      for (let i = 0; i < 5; i++) {
        const { data: v } = await g.supabase.from("merch_variants").select("shelter_stock").eq("id", it.variant_id).single();
        if (!v) break;
        const { data: ok } = await g.supabase
          .from("merch_variants")
          .update({ shelter_stock: v.shelter_stock + it.quantity })
          .eq("id", it.variant_id)
          .eq("shelter_stock", v.shelter_stock)
          .select("id");
        if (ok?.length) break;
      }
    }
  }
  await g.supabase.from("merch_order_parts").update({ status: "cancelled" }).eq("order_id", id).neq("status", "delivered");
  return done(path, "ok", "cancelled");
}
