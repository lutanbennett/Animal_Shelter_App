"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { parseBahtAmount } from "@/lib/format";
import {
  canRecordDelivery,
  parseDeliveryQuantity,
  receivedAtFor,
  type DeliveryKind,
  type DeliveryTiming,
} from "@/lib/management/stock-receipts";

export type DeliveryInput = {
  kind: DeliveryKind;
  itemId: string;
  /** In the item's own unit, as typed. */
  quantity: string;
  /** YYYY-MM-DD, the shelter day it arrived. */
  date: string;
  /** Only asked for on a day the item was counted. */
  timing: DeliveryTiming | null;
  supplierId: string;
  cost: string;
  note: string;
};

export type DeliveryResult = { ok: true } | { ok: false; error: string };

function revalidateStockPages() {
  revalidatePath("/deliveries");
  revalidatePath("/management/stock-usage");
  revalidatePath("/management/medications");
  revalidatePath("/management/diets");
}

/**
 * Inserts one stock_receipts row. unit and recorded_by are stamped by the
 * 0096 trigger from the item and the session, never sent from here; the
 * delivery does not touch stock_on_hand (a delivery is not a count).
 *
 * Returns rather than throws, for the stocktake sheet's reason: the form
 * shows this wording, not a production server-action error.
 */
export async function recordDelivery(input: DeliveryInput): Promise<DeliveryResult> {
  const { t } = await getT();
  const e = t.deliveries.errors;
  const supabase = await createClient();

  const { data: role } = await supabase.rpc("current_user_role");
  if (!canRecordDelivery(role)) return { ok: false, error: e.notAuthorized };

  if (input.kind !== "medication" && input.kind !== "diet") return { ok: false, error: e.itemRequired };
  if (!input.itemId) return { ok: false, error: e.itemRequired };
  const quantity = parseDeliveryQuantity(input.quantity);
  if (!quantity.ok) return { ok: false, error: e.quantityInvalid };
  const cost = parseBahtAmount(input.cost);
  if (!cost.ok) return { ok: false, error: e.costInvalid };

  const idColumn = input.kind === "medication" ? "medication_id" : "diet_type_id";
  const { data: counts, error: countsError } = await supabase
    .from("stock_counts")
    .select("counted_at")
    .eq(idColumn, input.itemId)
    .returns<{ counted_at: string }[]>();
  if (countsError) return { ok: false, error: `${e.failed}: ${countsError.message}` };

  const timing = input.timing === "before" || input.timing === "after" ? input.timing : null;
  const at = receivedAtFor(input.date, (counts ?? []).map((c) => c.counted_at), timing);
  if (!at.ok) return { ok: false, error: e[at.reason] };

  const note = input.note.trim();
  const { error } = await supabase.from("stock_receipts").insert({
    item_kind: input.kind === "medication" ? "medication" : "diet_type",
    [idColumn]: input.itemId,
    quantity: quantity.value,
    ...(at.value ? { received_at: at.value } : {}),
    supplier_contact_id: input.supplierId || null,
    cost: cost.value,
    note: note || null,
  });
  if (error) return { ok: false, error: `${e.failed}: ${error.message}` };

  revalidateStockPages();
  return { ok: true };
}

/** A delivery typed wrong is deleted and recorded again (0096 allows both). */
export async function deleteDelivery(id: string): Promise<DeliveryResult> {
  const { t } = await getT();
  const e = t.deliveries.errors;
  const supabase = await createClient();

  const { data: role } = await supabase.rpc("current_user_role");
  if (!canRecordDelivery(role)) return { ok: false, error: e.notAuthorized };

  const { error, count } = await supabase
    .from("stock_receipts")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) return { ok: false, error: `${e.failed}: ${error.message}` };
  if (!count) return { ok: false, error: e.gone };

  revalidateStockPages();
  return { ok: true };
}
