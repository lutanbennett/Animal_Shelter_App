"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { parseBahtAmount, todayIso } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { kindsFor, tailoringOf, type BillKind } from "@/lib/bills/kinds";
import { coversMonthDate } from "@/lib/bills/utility";

// PI FAILOVER (D): every write here goes through runWriteAction() via wrapped(), with its own action name.
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

/** premisesId and accountId are "" when none is chosen. coversMonth is a month input value ("2026-10"). */
export type UtilityDetails = { kindId: string; premisesId: string; accountId: string; amount: string; date: string; coversMonth: string; note: string };

/** Validates a utility bill and returns the row to insert, or the message to show. Asks bills.utilities, the activity the table's policy asks. */
async function utilityRow(
  input: UtilityDetails,
  t: Dictionary,
): Promise<{ row: Record<string, string | number | null> } | { error: string }> {
  const e = t.bills.errors;
  if (!can(await loadPermissions(), "bills.utilities")) return { error: e.notAuthorized };
  const amount = parseBahtAmount(input.amount);
  if (!amount.ok) return { error: e.costInvalid };
  if (amount.value == null) return { error: e.amountNeeded };
  const covers = coversMonthDate(input.coversMonth);
  if (!covers) return { error: e.monthNeeded };
  if (!input.kindId) return { error: e.kindNeeded };

  const supabase = await createClient();
  const { data } = await supabase
    .from("bill_kinds")
    .select("id, key, label, parent_id, sort, archived_at")
    .returns<{ id: string; key: string; label: string; parent_id: string | null; sort: number; archived_at: string | null }[]>();
  const kinds: BillKind[] = (data ?? []).map((k) => ({ id: k.id, key: k.key, label: k.label, parentId: k.parent_id, sort: k.sort, archived: k.archived_at != null }));
  const kind = kinds.find((k) => k.id === input.kindId);
  if (!kind || !kindsFor(await loadPermissions(), kinds).some((k) => k.id === kind.id) || tailoringOf(kind, kinds).route !== "utility") {
    return { error: e.kindNotAllowed };
  }
  return {
    row: {
      kind_id: kind.id,
      premises_id: input.premisesId || null,
      account_id: input.accountId || null,
      amount: amount.value,
      bill_date: input.date || todayIso(),
      covers_month: covers,
      note: input.note.trim() || null,
    },
  };
}

/** Records a utility bill typed in directly, with no photo. A photo can be added to it afterwards, or the bill filed from a Bills inbox card. */
export async function recordUtilityBill(input: UtilityDetails, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.recordUtilityBill", requestId, async (t) => {
    const made = await utilityRow(input, t);
    if ("error" in made) return { ok: false, error: made.error };
    const supabase = await createClient();
    const { error } = await supabase.from("utility_bills").insert(made.row);
    if (error) return { ok: false, error: `${t.bills.errors.failed}: ${error.message}` };
    revalidatePath("/bills/utilities");
    return { ok: true };
  });
}

/**
 * Files a Bills inbox card as a utility bill: the bill is made first, the card's photos change owner to it, and the card is
 * deleted. The bill is removed again if the photos then fail to move, so the card is never lost.
 */
export async function fileCardAsUtilityBill(cardId: string, input: UtilityDetails, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.fileCardAsUtilityBill", requestId, async (t) => {
    const e = t.bills.errors;
    const made = await utilityRow(input, t);
    if ("error" in made) return { ok: false, error: made.error };
    const supabase = await createClient();
    const { data: bill, error } = await supabase.from("utility_bills").insert(made.row).select("id").single<{ id: string }>();
    if (error || !bill) return { ok: false, error: `${e.failed}: ${error?.message ?? ""}` };

    const { error: moveError } = await supabase
      .from("attachments")
      .update({ owner_type: "utility_bill", owner_id: bill.id })
      .eq("owner_type", "bill_inbox")
      .eq("owner_id", cardId);
    if (moveError) {
      await supabase.from("utility_bills").delete().eq("id", bill.id);
      return { ok: false, error: `${e.failed}: ${moveError.message}` };
    }
    const { error: deleteError } = await supabase.from("bills_inbox").delete().eq("id", cardId);
    if (deleteError) return { ok: false, error: `${e.failed}: ${deleteError.message}` };
    revalidatePath("/bills");
    revalidatePath("/bills/utilities");
    revalidatePath("/home");
    return { ok: true };
  });
}
