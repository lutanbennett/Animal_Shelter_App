"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { resolveDeliveryLines, type DeliveryLineInput } from "@/lib/management/delivery-lines";
import { resolveDescribedLine } from "@/lib/management/described-lines";
import { parseBahtAmount } from "@/lib/format";
import { loadConversions } from "@/lib/units-server";
import {
  receivedAtFor,
  type DeliveryKind,
  type DeliveryTiming,
} from "@/lib/management/stock-receipts";

// PI FAILOVER (D), 2026-11-01: every write here goes through runWriteAction() via wrapped(), which is what lets the
// Worker replay a save the Pi did not clearly answer (docs/decisions/2026-11-01-write-paths-tail-a.md). A new write
// added to this file goes through wrapped() too, with its own action name.
async function wrapped<R extends object>(
  action: string,
  requestId: string | null,
  body: (t: Dictionary) => Promise<ActionResult<R>>,
): Promise<ActionResult<R>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<R>(
    action,
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: requestId, action, db: supabase },
    () => body(t),
  );
}

export type DeliveryInput = {
  /** "described" is the Something else choice: no list item, a typed description (0308). */
  kind: DeliveryKind | "described";
  itemId: string;
  /** Only for kind "described": the words and the typed unit. The line itself is lines[0]; its unit field is not used. */
  described?: { description: string; unit: string };
  /** Size, how many and cost, one per line; a unit is one of the item conversions by name, blank = the base unit. */
  lines: DeliveryLineInput[];
  /** YYYY-MM-DD, the shelter day it arrived. Fixed once the bill is open. */
  date: string;
  /** Only asked for on a day the item was counted, and only on the first item of a bill. */
  timing: DeliveryTiming | null;
  supplierId: string;
  note: string;
  /** The bill this item goes on; null starts a new one. */
  deliveryId?: string | null;
  /** The bill total as printed on it (optional, shown against the lines but never enforced). */
  amount?: string;
  /** A card in the bills inbox the bill is recorded from: its kind, place and account are copied onto the new bill. */
  cardId?: string | null;
};

export type BillTotals = {
  amount: number | null;
  lines: number;
  unpricedLines: number;
  linesCost: number | null;
  difference: number | null;
};

export type DeliveryResult = ActionResult<{ id?: string; deliveryId?: string; totals?: BillTotals | null }>;

function revalidateStockPages() {
  revalidatePath("/deliveries");
  revalidatePath("/bills");
  revalidatePath("/management/stock-usage");
  revalidatePath("/management/medications");
  revalidatePath("/management/diets");
}

/** The bill's amount against its lines added up (stock_delivery_totals, 0308). Shown, never enforced. */
async function loadBillTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deliveryId: string,
): Promise<BillTotals | null> {
  const { data } = await supabase
    .from("stock_delivery_totals")
    .select("amount, lines, unpriced_lines, lines_cost, difference")
    .eq("delivery_id", deliveryId)
    .maybeSingle<{
      amount: number | string | null;
      lines: number | string;
      unpriced_lines: number | string;
      lines_cost: number | string | null;
      difference: number | string | null;
    }>();
  if (!data) return null;
  const num = (v: number | string | null) => (v == null ? null : Number(v));
  return {
    amount: num(data.amount),
    lines: Number(data.lines),
    unpricedLines: Number(data.unpriced_lines),
    linesCost: num(data.lines_cost),
    difference: num(data.difference),
  };
}

/**
 * Records ONE item on a bill (0308). The first item of a bill creates the stock_deliveries header (the amount, the day,
 * the supplier, and the kind / place / account of a card it came from); every later item sends the header id and joins
 * it, so the bill's photos and amount belong to all of them. unit and recorded_by are stamped by the database from the
 * item and the session, never sent from here; the header's day and supplier are copied onto every line by the same
 * stamp. A delivery does not touch stock_on_hand (a delivery is not a count), and a described line adds to no stock
 * figure at all.
 *
 * Asks stock.delivery, as the table's policies do. Returns rather than throws, for the stocktake sheet's reason: the
 * form shows this wording, not a production server-action error.
 */
export async function recordDelivery(input: DeliveryInput, requestId: string | null): Promise<DeliveryResult> {
  return wrapped<{ id?: string; deliveryId?: string; totals?: BillTotals | null }>("deliveries.recordDelivery", requestId, async (t) => {
    const e = t.deliveries.errors;
    const supabase = await createClient();

    if (!can(await loadPermissions(), "stock.delivery")) return { ok: false, error: e.notAuthorized };

    if (input.kind !== "medication" && input.kind !== "diet" && input.kind !== "described") return { ok: false, error: e.itemRequired };
    if (input.kind !== "described" && !input.itemId) return { ok: false, error: e.itemRequired };

    const amount = parseBahtAmount(input.amount ?? "");
    if (!amount.ok) return { ok: false, error: e.amountInvalid };

    // What goes in the row is worked out before anything is written, so a refusal leaves no half-made bill.
    let row: Record<string, unknown>;
    let countedAt: string[] = [];
    if (input.kind === "described") {
      const line = input.lines?.[0];
      const resolved = resolveDescribedLine({
        description: input.described?.description ?? "",
        unit: input.described?.unit ?? "",
        quantity: line?.quantity ?? "",
        cost: line?.cost ?? "",
      });
      if (!resolved.ok) {
        return {
          ok: false,
          error:
            resolved.reason === "descriptionRequired" ? e.descriptionRequired
            : resolved.reason === "unitRequired" ? e.unitRequired
            : resolved.reason === "costInvalid" ? e.costInvalid
            : e.quantityInvalid,
        };
      }
      row = { item_kind: "described", description: resolved.description, unit: resolved.unit, quantity: resolved.quantity, cost: resolved.cost };
    } else {
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
      countedAt = (counts ?? []).map((c) => c.counted_at);

      row = {
        item_kind: input.kind === "medication" ? "medication" : "diet_type",
        [idColumn]: input.itemId,
        quantity: resolved.base,
        entered: resolved.entered,
        cost: resolved.cost,
      };
    }

    const note = input.note.trim();
    let deliveryId = input.deliveryId || null;

    if (deliveryId) {
      // A later item joins the open bill: its day and supplier are the header's (the stamp copies them), so no day or
      // timing is worked out here. If the amount was changed on the form, the header follows.
      const { data: header, error: headerError } = await supabase
        .from("stock_deliveries")
        .select("id, amount")
        .eq("id", deliveryId)
        .maybeSingle<{ id: string; amount: number | string | null }>();
      if (headerError) return { ok: false, error: `${e.failed}: ${headerError.message}` };
      if (!header) return { ok: false, error: e.billGone };
      const was = header.amount == null ? null : Number(header.amount);
      if (amount.value !== was) {
        const { error } = await supabase.from("stock_deliveries").update({ amount: amount.value }).eq("id", deliveryId);
        if (error) return { ok: false, error: `${e.failed}: ${error.message}` };
      }
    } else {
      const timing = input.timing === "before" || input.timing === "after" ? input.timing : null;
      const at = receivedAtFor(input.date, countedAt, timing);
      if (!at.ok) return { ok: false, error: e[at.reason] };

      // A card the bill is recorded from lends its kind, place and account. If this login cannot read the card, that is
      // simply not copied; the bill is still recorded.
      let fromCard: { kind_id: string | null; premises_id: string | null; account_id: string | null } | null = null;
      if (input.cardId) {
        const { data } = await supabase
          .from("bills_inbox")
          .select("kind_id, premises_id, account_id")
          .eq("id", input.cardId)
          .maybeSingle<{ kind_id: string | null; premises_id: string | null; account_id: string | null }>();
        fromCard = data;
      }
      const { data: header, error: headerError } = await supabase
        .from("stock_deliveries")
        .insert({
          ...(at.value ? { received_at: at.value } : {}),
          supplier_id: input.supplierId || null,
          bill_date: input.date,
          amount: amount.value,
          kind_id: fromCard?.kind_id ?? null,
          premises_id: fromCard?.premises_id ?? null,
          account_id: fromCard?.account_id ?? null,
        })
        .select("id")
        .single<{ id: string }>();
      if (headerError || !header) return { ok: false, error: `${e.failed}: ${headerError?.message ?? ""}` };
      deliveryId = header.id;
    }

    const { data: inserted, error } = await supabase
      .from("stock_receipts")
      .insert({ ...row, delivery_id: deliveryId, supplier_id: input.supplierId || null, note: note || null })
      .select("id")
      .single<{ id: string }>();
    if (error) return { ok: false, error: `${e.failed}: ${error.message}` };

    revalidateStockPages();
    // The ids let the caller file the bill's photos on the header; without them the bill never attaches.
    return { ok: true, id: inserted?.id, deliveryId, totals: await loadBillTotals(supabase, deliveryId) };
  });
}

/** A delivery typed wrong is deleted and recorded again (0096 allows both). */
export async function deleteDelivery(id: string, requestId: string | null): Promise<ActionResult<{ id?: string }>> {
  return wrapped<{ id?: string }>("deliveries.deleteDelivery", requestId, async (t) => {
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
  });
}
