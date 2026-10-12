"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { parseBahtAmount } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { canUseBills } from "@/lib/bills/access";
import type { ActionResult } from "@/lib/action-result";

export type CardDetails = { amount: string; date: string; note: string };
export type MatchKind = "stock_receipt" | "clinic_visit";

function revalidateBills() {
  revalidatePath("/bills");
  revalidatePath("/deliveries");
  revalidatePath("/home");
}

/** Whether this login may attach a bill to this kind of thing, the question the database asks too. */
async function mayMatch(kind: MatchKind): Promise<boolean> {
  const perms = await loadPermissions();
  return kind === "stock_receipt" ? can(perms, "stock.delivery") : can(perms, "medical.visits", "edit");
}

/** Saves what was typed on a card without matching it, so a half-done card keeps its figures. */
export async function saveCard(cardId: string, input: CardDetails): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.bills.errors;
  if (!canUseBills(await loadPermissions())) return { ok: false, error: e.notAuthorized };
  const amount = parseBahtAmount(input.amount);
  if (!amount.ok) return { ok: false, error: e.costInvalid };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("bills_inbox")
    .update({ amount: amount.value, bill_date: input.date || null, note: input.note.trim() || null }, { count: "exact" })
    .eq("id", cardId);
  if (error) return { ok: false, error: `${e.failed}: ${error.message}` };
  if (!count) return { ok: false, error: e.gone };
  revalidateBills();
  return { ok: true };
}

/**
 * Matches a card to a delivery or a clinic visit: the typed cost goes into that record's own cost
 * (stock_receipts.cost / clinic_visits.cost, there is no second amount column), the card's photos
 * change owner to it, and the card is deleted, so the waiting count is just the rows left.
 * The cost is written first: if the photos then fail to move, the card is still there to retry.
 */
export async function matchBill(
  cardId: string,
  kind: MatchKind,
  targetId: string,
  input: CardDetails,
): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.bills.errors;
  if (!(await mayMatch(kind))) return { ok: false, error: e.notAuthorized };
  const amount = parseBahtAmount(input.amount);
  if (!amount.ok) return { ok: false, error: e.costInvalid };

  const supabase = await createClient();
  if (amount.value != null) {
    const { error, count } = await supabase
      .from(kind === "stock_receipt" ? "stock_receipts" : "clinic_visits")
      .update({ cost: amount.value }, { count: "exact" })
      .eq("id", targetId);
    if (error) return { ok: false, error: `${e.failed}: ${error.message}` };
    if (!count) return { ok: false, error: e.targetGone };
  }

  return moveCardTo(cardId, kind, targetId);
}

/** Moves the card's photos onto the record and deletes the card. Used by matchBill and by "record a new delivery from this bill". */
async function moveCardTo(cardId: string, kind: MatchKind, targetId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.bills.errors;
  const supabase = await createClient();

  const { error: moveError } = await supabase
    .from("attachments")
    .update({ owner_type: kind, owner_id: targetId })
    .eq("owner_type", "bill_inbox")
    .eq("owner_id", cardId);
  if (moveError) return { ok: false, error: `${e.failed}: ${moveError.message}` };

  const { error: deleteError } = await supabase.from("bills_inbox").delete().eq("id", cardId);
  if (deleteError) return { ok: false, error: `${e.failed}: ${deleteError.message}` };

  revalidateBills();
  return { ok: true };
}

/** A new delivery was recorded from a card (Record a delivery, opened from the card): file the card's photos on it. */
export async function attachCardToDelivery(cardId: string, receiptId: string): Promise<ActionResult> {
  const { t } = await getT();
  if (!(await mayMatch("stock_receipt"))) return { ok: false, error: t.bills.errors.notAuthorized };
  return moveCardTo(cardId, "stock_receipt", receiptId);
}

/** A bill photographed by mistake. The photos' rows go with the card; the files stay in Drive's Bills folder. */
export async function deleteCard(cardId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.bills.errors;
  if (!canUseBills(await loadPermissions())) return { ok: false, error: e.notAuthorized };

  const supabase = await createClient();
  const { error: photoError } = await supabase
    .from("attachments")
    .delete()
    .eq("owner_type", "bill_inbox")
    .eq("owner_id", cardId);
  if (photoError) return { ok: false, error: `${e.failed}: ${photoError.message}` };

  const { error, count } = await supabase.from("bills_inbox").delete({ count: "exact" }).eq("id", cardId);
  if (error) return { ok: false, error: `${e.failed}: ${error.message}` };
  if (!count) return { ok: false, error: e.gone };
  revalidateBills();
  return { ok: true };
}
