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

/**
 * The checkout (docs/merch-shop.md, "Checkout"). Service role: no base table is open to anon, and the buyer is
 * signed out. THE GUARD is that nothing from the browser is trusted but variant ids and quantities: every price,
 * postage figure, name and source is re-read here from the real tables, and a hidden, archived or unavailable
 * variant is refused. Recorded in docs/hard-coded-security-registry.json.
 *
 * The write is ONE database transaction, place_merch_order() (0373, security invoker, service_role only): stock is taken
 * with a row lock, so a race refuses the loser rather than overselling, and an interrupted write rolls back whole.
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

  // One database transaction (0373): the order, its parts and items and the stock decrement all happen or none does.
  // The function re-reads every price, postage figure, name and source itself; only ids and quantities go in.
  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("place_merch_order", {
      p_lines: [...lines].map(([variant_id, quantity]) => ({ variant_id, quantity })),
      p_buyer_name: input.buyerName,
      p_buyer_email: input.buyerEmail,
      p_buyer_phone: input.buyerPhone,
      p_ship_country: input.shipCountry,
      p_ship_address: input.shipAddress,
      p_region: input.region,
      p_currency: input.currency,
      p_exchange_rate: rate,
      p_payment_method: input.paymentMethod,
      p_buyer_note: input.buyerNote,
    });
    if (error || !data) return { ok: false, error: "failed" };
    const res = data as { ok: boolean; order_id?: string; error?: "empty" | "unavailable" };
    if (res.ok && res.order_id) return { ok: true, orderId: res.order_id };
    return { ok: false, error: res.error === "empty" || res.error === "unavailable" ? res.error : "failed" };
  } catch {
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
