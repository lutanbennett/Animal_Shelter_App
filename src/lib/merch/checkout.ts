import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { RATES_THB_PER_UNIT, MAX_QTY, type CartLine } from "./shop";

export type PlaceOrderInput = {
  lines: CartLine[];
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  shipCountry: string;
  shipAddress: string;
  region: "thailand" | "overseas";
  currency: string;
  paymentMethod: "promptpay" | "wise_transfer" | "wise_link";
  buyerNote: string | null;
};

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: "empty" | "unavailable" | "currency" | "failed" };

type VariantRow = {
  id: string;
  size: string | null;
  colour: string | null;
  shelter_stock: number;
  shown: boolean;
  product: {
    name: string;
    price_thb: number;
    postage_thailand_thb: number;
    postage_overseas_thb: number;
    supplier_id: string | null;
    shown: boolean;
    archived_at: string | null;
  } | null;
};

/**
 * The checkout (docs/merch-shop.md, "Checkout"). Service role: no base table is open to anon, and the buyer is
 * signed out. THE GUARD is that nothing from the browser is trusted but variant ids and quantities: every price,
 * postage figure, name and source is re-read here from the real tables, and a hidden, archived or unavailable
 * variant is refused. Recorded in docs/hard-coded-security-registry.json.
 *
 * Not one database transaction: supabase-js cannot hold one across calls and a transaction function needs a
 * migration this stream may not carry. Instead each step is undone if a later one fails (stock put back, the order
 * deleted; its parts and items cascade), and the stock decrement is conditional on the value just read, so a race
 * refuses the loser rather than overselling.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const lines = new Map<string, number>();
  for (const l of input.lines) {
    const q = Math.floor(l.quantity);
    if (!(q > 0)) continue;
    lines.set(l.variantId, Math.min(MAX_QTY, (lines.get(l.variantId) ?? 0) + q));
  }
  if (lines.size === 0) return { ok: false, error: "empty" };

  let rate: number | null = null;
  if (input.currency !== "THB") {
    rate = RATES_THB_PER_UNIT[input.currency] ?? null;
    if (input.region !== "overseas" || rate === null) return { ok: false, error: "currency" };
  } else if (input.region === "overseas" && input.paymentMethod === "promptpay") {
    return { ok: false, error: "currency" };
  }

  const db = createAdminClient();
  const restore: { id: string; qty: number }[] = [];
  const giveBack = async () => {
    for (const r of restore) {
      for (let i = 0; i < 5; i++) {
        const { data } = await db.from("merch_variants").select("shelter_stock").eq("id", r.id).single();
        if (!data) break;
        const { data: done } = await db
          .from("merch_variants")
          .update({ shelter_stock: data.shelter_stock + r.qty })
          .eq("id", r.id)
          .eq("shelter_stock", data.shelter_stock)
          .select("id");
        if (done && done.length) break;
      }
    }
  };

  try {
    // 1. Re-read every variant through the real tables.
    const { data: rows, error } = await db
      .from("merch_variants")
      .select("id, size, colour, shelter_stock, shown, product:merch_products(name, price_thb, postage_thailand_thb, postage_overseas_thb, supplier_id, shown, archived_at)")
      .in("id", [...lines.keys()])
      .returns<VariantRow[]>();
    if (error) return { ok: false, error: "failed" };
    const byId = new Map((rows ?? []).map((r) => [r.id, r]));

    type Planned = { v: VariantRow; qty: number; source: string };
    const planned: Planned[] = [];
    for (const [id, qty] of lines) {
      const v = byId.get(id);
      const p = v?.product;
      if (!v || !p || !v.shown || !p.shown || p.archived_at) return { ok: false, error: "unavailable" };
      // 2. The shelter if its shelf holds enough, else the product's supplier, else refuse the line.
      if (v.shelter_stock >= qty) planned.push({ v, qty, source: "shelter" });
      else if (p.supplier_id) planned.push({ v, qty, source: p.supplier_id });
      else return { ok: false, error: "unavailable" };
    }

    // 3. Take shelter stock; the equality on the value just read refuses a race, and the >= 0 check is the backstop.
    for (const pl of planned.filter((x) => x.source === "shelter")) {
      const { data: done, error: e } = await db
        .from("merch_variants")
        .update({ shelter_stock: pl.v.shelter_stock - pl.qty })
        .eq("id", pl.v.id)
        .eq("shelter_stock", pl.v.shelter_stock)
        .select("id");
      if (e || !done || done.length === 0) {
        await giveBack();
        return { ok: false, error: "unavailable" };
      }
      restore.push({ id: pl.v.id, qty: pl.qty });
    }

    // 5. Totals from the database's own figures.
    let subtotal = 0;
    let postage = 0;
    for (const pl of planned) {
      const p = pl.v.product!;
      subtotal += pl.qty * Number(p.price_thb);
      postage += pl.qty * Number(input.region === "thailand" ? p.postage_thailand_thb : p.postage_overseas_thb);
    }
    const total = Math.round((subtotal + postage) * 100) / 100;
    // 6. Overseas: quoted in the buyer's own currency at the dated rate the buyer is shown.
    const charged = rate ? Math.round((total / rate) * 100) / 100 : total;

    // 4. The order, its parts (one per supplier, one for the shelter) and the items with their copies.
    const { data: order, error: oe } = await db
      .from("merch_orders")
      .insert({
        buyer_name: input.buyerName,
        buyer_email: input.buyerEmail,
        buyer_phone: input.buyerPhone,
        ship_country: input.shipCountry,
        ship_address: input.shipAddress,
        region: input.region,
        currency: input.currency,
        exchange_rate: rate,
        subtotal_thb: subtotal,
        postage_thb: postage,
        total_thb: total,
        total_charged: charged,
        payment_method: input.paymentMethod,
        buyer_note: input.buyerNote,
      })
      .select("id")
      .single();
    if (oe || !order) {
      await giveBack();
      return { ok: false, error: "failed" };
    }
    const undo = async () => {
      await db.from("merch_orders").delete().eq("id", order.id);
      await giveBack();
    };
    const sources = [...new Set(planned.map((p) => p.source))];
    const partIds = new Map<string, string>();
    for (const s of sources) {
      const { data: part, error: pe } = await db
        .from("merch_order_parts")
        .insert(s === "shelter" ? { order_id: order.id, fulfilment: "shelter" } : { order_id: order.id, fulfilment: "supplier", supplier_id: s })
        .select("id")
        .single();
      if (pe || !part) {
        await undo();
        return { ok: false, error: "failed" };
      }
      partIds.set(s, part.id);
    }
    const { error: ie } = await db.from("merch_order_items").insert(
      planned.map((pl) => ({
        part_id: partIds.get(pl.source)!,
        variant_id: pl.v.id,
        product_name: pl.v.product!.name,
        size: pl.v.size,
        colour: pl.v.colour,
        unit_price_thb: pl.v.product!.price_thb,
        quantity: pl.qty,
      })),
    );
    if (ie) {
      await undo();
      return { ok: false, error: "failed" };
    }
    return { ok: true, orderId: order.id };
  } catch {
    await giveBack();
    return { ok: false, error: "failed" };
  }
}

export type OrderView = {
  order_no: string;
  region: "thailand" | "overseas";
  currency: string;
  exchange_rate: number | null;
  subtotal_thb: number;
  postage_thb: number;
  total_thb: number;
  total_charged: number;
  payment_method: string;
  payment_state: "awaiting" | "paid" | "cancelled";
  created_at: string;
  parts: {
    id: string;
    fulfilment: string;
    status: string;
    carrier: string | null;
    tracking_number: string | null;
    items: { product_name: string; size: string | null; colour: string | null; quantity: number; unit_price_thb: number }[];
  }[];
};

/**
 * The status page's read: by the order's unguessable id, status and tracking only. Name, address, email and phone
 * are not selected, so they cannot reach the page. Service role for the same reason as placeOrder; the id (a v4
 * uuid) is the guard.
 */
export async function loadOrderView(id: string): Promise<OrderView | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const db = createAdminClient();
  const { data, error } = await db
    .from("merch_orders")
    .select(
      "order_no, region, currency, exchange_rate, subtotal_thb, postage_thb, total_thb, total_charged, payment_method, payment_state, created_at, parts:merch_order_parts(id, fulfilment, status, carrier, tracking_number, items:merch_order_items(product_name, size, colour, quantity, unit_price_thb))",
    )
    .eq("id", id)
    .maybeSingle<OrderView>();
  if (error) throw new Error(`Merchandise: could not read the order: ${error.message}`);
  return data;
}
