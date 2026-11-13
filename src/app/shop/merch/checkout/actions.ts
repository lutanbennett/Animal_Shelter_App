"use server";

import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/get-locale";
import { localizedHref } from "@/lib/public-paths";
import { placeOrder } from "@/lib/merch/checkout";
import { MAX_QTY } from "@/lib/merch/shop";

export type OrderFormState = { error: "empty" | "unavailable" | "currency" | "failed" | "fields" | null };

const clean = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Only variant ids and quantities are taken from the cart; placeOrder re-reads every price (src/lib/merch/checkout.ts). */
export async function submitOrder(_prev: OrderFormState, form: FormData): Promise<OrderFormState> {
  let lines: { variantId: string; quantity: number }[] = [];
  try {
    const raw = JSON.parse(clean(form.get("cart"), 4000) || "[]");
    if (Array.isArray(raw)) {
      lines = raw
        .filter((l) => l && typeof l.variantId === "string" && /^[0-9a-f-]{36}$/i.test(l.variantId))
        .map((l) => ({ variantId: l.variantId as string, quantity: Math.min(MAX_QTY, Math.max(0, Math.floor(Number(l.quantity) || 0))) }));
    }
  } catch {
    lines = [];
  }

  const region = clean(form.get("region"), 12) === "overseas" ? "overseas" : "thailand";
  const buyerName = clean(form.get("name"), 200);
  const buyerEmail = clean(form.get("email"), 200);
  const shipCountry = clean(form.get("country"), 2).toUpperCase();
  const shipAddress = clean(form.get("address"), 1000);
  if (!buyerName || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail) || !/^[A-Z]{2}$/.test(shipCountry) || !shipAddress) {
    return { error: "fields" };
  }
  const method = clean(form.get("method"), 20);
  const paymentMethod = region === "thailand" ? "promptpay" : method === "wise_link" ? "wise_link" : "wise_transfer";
  const currency = region === "thailand" ? "THB" : clean(form.get("currency"), 3).toUpperCase();

  const result = await placeOrder({
    lines,
    buyerName,
    buyerEmail,
    buyerPhone: clean(form.get("phone"), 60) || null,
    shipCountry,
    shipAddress,
    region,
    currency,
    paymentMethod,
    buyerNote: clean(form.get("note"), 1000) || null,
  });
  if (!result.ok) return { error: result.error };
  redirect(localizedHref(`/shop/merch/order/${result.orderId}`, await getLocale()));
}
