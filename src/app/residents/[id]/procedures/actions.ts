"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";

export type ProcedureActionState = ActionResult;

export async function deleteProcedureAttachment(
  residentId: string,
  attachmentId: string,
): Promise<ProcedureActionState> {
  const { t } = await getT();
  return runAction("residents.deleteProcedureAttachment", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();

    const { data: attachment, error: selectError } = await supabase
      .from("attachments")
      .select("id, drive_file_id")
      .eq("id", attachmentId)
      .eq("owner_type", "procedure")
      .limit(1)
      .returns<{ id: string; drive_file_id: string }[]>();

    const attachmentRow = attachment?.[0];
    if (selectError || !attachmentRow) {
      return { ok: false, error: selectError?.message ?? "Attachment not found." };
    }

    // Under RLS a refused delete matches no row and raises no error, so the
    // row count is the only proof it went; without it the Drive file below
    // would be trashed while the record survives.
    const { data: deletedRows, error: deleteError } = await supabase
      .from("attachments")
      .delete()
      .eq("id", attachmentId)
      .select("id");

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }
    if (deletedRows?.length !== 1) {
      return { ok: false, error: t.common.notAllowedToDeleteFile };
    }

    try {
      await getDriveClient().trashFile(attachmentRow.drive_file_id);
    } catch {
      // The DB record is already gone; an orphaned Drive file is a minor
      // cleanup issue, not worth failing the user-facing action over (same
      // tradeoff as deleteBloodTestAttachment).
    }

    revalidatePath(`/residents/${residentId}`);
    revalidatePath(`/residents/${residentId}/procedures`);
    return { ok: true };
  });
}
