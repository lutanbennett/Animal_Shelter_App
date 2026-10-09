"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, unexpectedFailure, type ActionResult } from "@/lib/action-result";
import {
  changedColumns,
  currentImage,
  currentTableName,
  kindOf,
  loggedTableNames,
  type AuditedTable,
  type Image,
} from "@/lib/audit/recent-changes";
import { editPlan, undoKind } from "@/lib/audit/undo";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

const refuse = (error: string) => ({ ok: false as const, error });

function revalidateFor(table: AuditedTable, image: Image) {
  revalidatePath("/admin/recent-changes");
  const residentId =
    table === "residents" ? image?.id : table === "contacts" ? null : image?.resident_id;
  if (typeof residentId === "string") revalidatePath(`/residents/${residentId}`, "layout");
  if (table === "residents") revalidatePath("/residents");
  if (table === "contacts") revalidatePath("/management/contacts");
  if (table === "clinic_visits") revalidatePath("/appointments");
  if (table === "prescriptions") revalidatePath("/management/stock-usage");
  if (table === "impact_baselines") {
    revalidatePath("/admin/website");
    revalidatePath("/");
  }
  refresh();
}

/**
 * Undoes one audit entry: an edit (the changed fields go back to what they
 * were) or a hard delete (the row is put back). Admin only; the page that
 * offers it is admin only and so is the table it reads.
 *
 * It trusts nothing from the browser but the entry's id. The images are read
 * here, with the admin's own client, and the write goes through the same
 * client, so RLS applies and the audit trigger records the undo under the
 * admin's login as an ordinary change.
 *
 * Refused unless the entry is the NEWEST change to that row. A before-image
 * is one moment; restoring it over later edits would silently discard them,
 * and restoring a deleted row's image is only the right row if nothing has
 * happened to it since. The way round is to undo the newer change first.
 */
export async function undoChange(auditId: number): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("recentChanges.undo", t.common.somethingWentWrong, async () => {
    const u = t.admin.recentChanges.undo;
    if (!Number.isSafeInteger(auditId) || auditId <= 0) return refuse(u.errors.gone);
    if (!can(await loadPermissions(), "audit.undo")) return refuse(t.admin.security.errors.adminAccessRequired);

    const writeFailure = (step: string, error: { code?: string }) => {
      if (error.code === "23505") return refuse(u.errors.slotTaken);
      if (error.code === "23503") return refuse(u.errors.parentGone);
      if (error.code === "23514") return refuse(t.common.notAccepted);
      if (error.code === "42501") return refuse(t.common.notAllowed);
      return unexpectedFailure(`recentChanges.undo.${step}`, error, t.common.somethingWentWrong);
    };

    const supabase = await createClient();
    const { data: entry } = await supabase
      .from("audit_log")
      .select("id, table_name, row_id, op, old_row, new_row")
      .eq("id", auditId)
      .maybeSingle();
    if (!entry) return refuse(u.errors.gone);

    // A row logged before 0172 names vet_appointments and its old columns: written back under the new ones.
    const table = currentTableName(entry.table_name) as AuditedTable;
    const oldRow = currentImage(entry.old_row as Image);
    const newRow = currentImage(entry.new_row as Image);
    const changed = changedColumns(oldRow, newRow);
    const what = undoKind({ table, op: entry.op, kind: kindOf(entry.op, oldRow, newRow, changed) });
    if (what !== "edit" && what !== "reinsert") return refuse(u.errors.notUndoable);

    const { data: newest } = await supabase
      .from("audit_log")
      .select("id")
      .in("table_name", loggedTableNames(table))
      .eq("row_id", entry.row_id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!newest || newest.id !== entry.id) return refuse(u.errors.later);

    if (what === "reinsert") {
      const { error } = await supabase.from(table).insert(oldRow!);
      if (error) return writeFailure("reinsert", error);
      revalidateFor(table, oldRow);
      return { ok: true };
    }

    const { set, expect } = editPlan(oldRow, newRow, changed);
    if (Object.keys(set).length === 0) return refuse(u.errors.nothingToUndo);
    let q = supabase.from(table).update(set).eq("id", entry.row_id);
    for (const [col, value] of Object.entries(expect)) {
      q = value === null ? q.is(col, null) : q.eq(col, value);
    }
    const { data, error } = await q.select("id");
    if (error) return writeFailure("edit", error);
    // Nothing matched: the row is gone, or it moved under the guard.
    if (!data?.length) return refuse(u.errors.changedSince);
    revalidateFor(table, newRow);
    return { ok: true };
  });
}
