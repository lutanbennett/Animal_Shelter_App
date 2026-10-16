"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { resolveDeliveryLines, type DeliveryLineInput } from "@/lib/management/delivery-lines";
import { loadConversions } from "@/lib/units-server";
import {
  receivedAtFor,
  type DeliveryKind,
  type DeliveryTiming,
} from "@/lib/management/stock-receipts";

export type DeliveryInput = {
  kind: DeliveryKind;
  itemId: string;
  /** Size, how many and cost, one per line; a unit is one of the item conversions by name, blank = the base unit. */
  lines: DeliveryLineInput[];
  /** YYYY-MM-DD, the shelter day it arrived. */
  date: string;
  /** Only asked for on a day the item was counted. */
  timing: DeliveryTiming | null;
  supplierId: string;
  note: string;
};

export type DeliveryResult = { ok: true; id?: string } | { ok: false; error: string };

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

  if (!can(await loadPermissions(), "stock.delivery")) return { ok: false, error: e.notAuthorized };

  if (input.kind !== "medication" && input.kind !== "diet") return { ok: false, error: e.itemRequired };
  if (!input.itemId) return { ok: false, error: e.itemRequired };
  // The factor is stamped from the conversion as it is NOW and stored with the
  // row (entered, 0118); history never looks it up again.
  const itemKind = input.kind === "medication" ? "medication" : "diet";
  const conversions = await loadConversions(supabase, itemKind, [input.itemId]);
  if (conversions.error) return { ok: false, error: `${e.failed}: ${conversions.error}` };
  const baseUnit = await supabase
    .from(itemKind === "medication" ? "stock_medications" : "stock_diet_types")
    .select(itemKind === "medication" ? "unit:dose_unit" : "unit")
    .eq("id", input.itemId)
    .maybeSingle<{ unit: string }>();
  const resolved = resolveDeliveryLines(
    Array.isArray(input.lines) ? input.lines : [],
    conversions.data[input.itemId] ?? [],
    baseUnit.data ? [baseUnit.data.unit] : [],
  );
  if (!resolved.ok) {
    const error =
      resolved.reason === "unknownUnit" ? t.units.errors.unknownUnit
      : resolved.reason === "costInvalid" ? e.costInvalid
      : resolved.reason === "costIncomplete" ? e.costIncomplete
      : e.quantityInvalid;
    return { ok: false, error };
  }
  if (!(resolved.base > 0)) return { ok: false, error: e.quantityInvalid };

  const idColumn = input.kind === "medication" ? "medication_id" : "diet_type_id";
  const { data: counts, error: countsError } = await supabase
    .from("stock_counts")
    .select("counted_at")
    .neq("source", "correction")
    .eq(idColumn, input.itemId)
    .returns<{ counted_at: string }[]>();
  if (countsError) return { ok: false, error: `${e.failed}: ${countsError.message}` };

  const timing = input.timing === "before" || input.timing === "after" ? input.timing : null;
  const at = receivedAtFor(input.date, (counts ?? []).map((c) => c.counted_at), timing);
  if (!at.ok) return { ok: false, error: e[at.reason] };

  const note = input.note.trim();
  const { data: inserted, error } = await supabase.from("stock_receipts").insert({
    item_kind: input.kind === "medication" ? "medication" : "diet_type",
    [idColumn]: input.itemId,
    quantity: resolved.base,
    entered: resolved.entered,
    ...(at.value ? { received_at: at.value } : {}),
    supplier_contact_id: input.supplierId || null,
    cost: resolved.cost,
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

  if (!can(await loadPermissions(), "stock.delivery")) return { ok: false, error: e.notAuthorized };

  const { error, count } = await supabase
    .from("stock_receipts")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) return { ok: false, error: `${e.failed}: ${error.message}` };
  if (!count) return { ok: false, error: e.gone };

  revalidateStockPages();
  return { ok: true };
}
