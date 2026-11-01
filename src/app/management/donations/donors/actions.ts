"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runWriteAction, type ActionRefusal, type ActionResult, type WriteMessages } from "@/lib/action-result";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { checkSupporter, SUPPORTER_COLUMNS, type SupporterFields, type SupporterRow } from "@/lib/donations/supporters";

/**
 * Donors (0244). Every action asks donation.receipt first; RLS (supporters_perm)
 * asks the same cell, so this is the friendly refusal, not the protection.
 * Results, never throws (src/lib/action-result.ts).
 */

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateDonors(id?: string) {
  revalidatePath("/management/donations/donors");
  if (id) revalidatePath(`/management/donations/donors/${id}`);
}

/** Adds a donor. Also used inline from the donation form, which gets the new row back. */
export async function createSupporter(fields: SupporterFields, requestId: string): Promise<ActionResult<{ supporter: SupporterRow }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("donors.create", write(t), { id: requestId, action: "donors.create", db: supabase }, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return refuse(t.common.notAllowed);
    const checked = checkSupporter(fields);
    if (!checked.ok) return refuse(t.donations.donors.errors[checked.problem]);
    const { data, error } = await supabase.from("supporters").insert(checked.supporter).select(SUPPORTER_COLUMNS).single<SupporterRow>();
    if (error) return databaseFailure("donors.create", error, t.common);
    revalidateDonors();
    return { ok: true, supporter: data };
  });
}

export async function updateSupporter(id: string, fields: SupporterFields, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("donors.update", write(t), { id: requestId, action: "donors.update", db: supabase }, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return refuse(t.common.notAllowed);
    if (!UUID.test(id)) return refuse(t.donations.donors.errors.notFound);
    const checked = checkSupporter(fields);
    if (!checked.ok) return refuse(t.donations.donors.errors[checked.problem]);
    const { data, error } = await supabase.from("supporters").update(checked.supporter).eq("id", id).select("id").maybeSingle();
    if (error) return databaseFailure("donors.update", error, t.common);
    if (!data) return refuse(t.donations.donors.errors.notFound);
    revalidateDonors(id);
    return { ok: true };
  });
}

/** Soft-archive (or bring back). Gifts keep their link and their history. */
export async function setSupporterArchived(id: string, archived: boolean, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("donors.archive", write(t), { id: requestId, action: "donors.archive", db: supabase }, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return refuse(t.common.notAllowed);
    if (!UUID.test(id)) return refuse(t.donations.donors.errors.notFound);
    const { data, error } = await supabase
      .from("supporters")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return databaseFailure("donors.archive", error, t.common);
    if (!data) return refuse(t.donations.donors.errors.notFound);
    revalidateDonors(id);
    return { ok: true };
  });
}
