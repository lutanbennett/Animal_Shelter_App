"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";

/** Removes one page of a visit's doctor's report. Only ever a 'report' row: a bill is never removed from here. */
export async function removeVisitReport(visitId: string, attachmentId: string, formData: FormData): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<object>(
    "clinicVisits.removeReport",
    { somethingWentWrong: t.common.somethingWentWrong, saveUnknown: t.common.saveUnknown, reloadToSave: t.common.reloadToSave },
    { id: writeRequestIdFrom(formData), action: "clinicVisits.removeReport", db: supabase },
    async () => {
    if (!can(await loadPermissions(), "medical.visits", "edit")) return { ok: false, error: t.common.notAllowed };
    const { data: found } = await supabase
      .from("attachments")
      .select("id, drive_file_id")
      .eq("id", attachmentId)
      .eq("owner_type", "clinic_visit")
      .eq("owner_id", visitId)
      .eq("purpose", "report")
      .limit(1)
      .returns<{ id: string; drive_file_id: string }[]>();
    const row = found?.[0];
    if (!row) return { ok: false, error: t.vetVisits.record.reports.removeFailed };

    // A refused delete under RLS matches no row and raises no error; the count is the proof.
    const { data: deleted, error } = await supabase.from("attachments").delete().eq("id", attachmentId).select("id");
    if (error) return { ok: false, error: error.message };
    if (deleted?.length !== 1) return { ok: false, error: t.common.notAllowedToDeleteFile };

    try {
      await getDriveClient().trashFile(row.drive_file_id);
    } catch {
      // The record is gone; an orphaned Drive file is a minor cleanup, not a failure of the action.
    }
    revalidatePath(`/clinic-visits/${visitId}`);
    return { ok: true };
    },
  );
}
