"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { parseBahtAmount, todayIso } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { runAction, type ActionResult } from "@/lib/action-result";

export type BillDetails = { amount: string; date: string; note: string };

/** Management's only (maintenance.bills); the database asks the same question, this is the polite refusal. */
async function mayBill(): Promise<boolean> {
  const perms = await loadPermissions();
  return !!perms && perms.scopes.clinical !== "own_clinic" && can(perms, "maintenance.bills");
}

function revalidate(jobId: string) {
  revalidatePath(`/maintenance/${jobId}`);
  revalidatePath("/maintenance");
  revalidatePath("/bills");
}

/**
 * Creates a bill on a job: the row first (the amount lives here), then the page uploads the photo
 * against its id. A bill needs an amount, because the job's actual cost is the sum of them.
 */
export async function addJobBill(jobId: string, input: BillDetails): Promise<ActionResult<{ billId: string }>> {
  const { t } = await getT();
  const e = t.maintenance.bills.errors;
  return runAction<{ billId: string }>("maintenance.addJobBill", t.common.somethingWentWrong, async () => {
    if (!(await mayBill())) return { ok: false, error: e.notAuthorized };
    const amount = parseBahtAmount(input.amount);
    if (!amount.ok || amount.value == null) return { ok: false, error: e.amountInvalid };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("maintenance_bills")
      .insert({
        maintenance_id: jobId,
        amount: amount.value,
        bill_date: input.date || todayIso(),
        note: input.note.trim() || null,
      })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return { ok: false, error: e.failed };
    revalidate(jobId);
    return { ok: true, billId: data.id };
  });
}

/** Removes a bill and its photo rows; the files stay in Drive's Bills folder, as for an inbox card. */
export async function deleteJobBill(jobId: string, billId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.maintenance.bills.errors;
  return runAction("maintenance.deleteJobBill", t.common.somethingWentWrong, async () => {
    if (!(await mayBill())) return { ok: false, error: e.notAuthorized };
    const supabase = await createClient();
    const { error: photoError } = await supabase
      .from("attachments")
      .delete()
      .eq("owner_type", "maintenance_bill")
      .eq("owner_id", billId);
    if (photoError) return { ok: false, error: e.failed };
    const { error, count } = await supabase
      .from("maintenance_bills")
      .delete({ count: "exact" })
      .eq("id", billId)
      .eq("maintenance_id", jobId);
    if (error) return { ok: false, error: e.failed };
    if (!count) return { ok: false, error: e.gone };
    revalidate(jobId);
    return { ok: true };
  });
}
