"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";

export type BloodTestActionState = ActionResult;

export async function deleteBloodTestAttachment(
  residentId: string,
  attachmentId: string,
  requestId: string,
): Promise<BloodTestActionState> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction(
    "residents.deleteBloodTestAttachment",
    { somethingWentWrong: t.common.somethingWentWrong, saveUnknown: t.common.saveUnknown, reloadToSave: t.common.reloadToSave },
    { id: requestId, action: "residents.deleteBloodTestAttachment", db: supabase },
    async () => {
    if (!can(await loadPermissions(), "medical.blood_tests")) return { ok: false, error: t.common.notAllowed };
    const { data: attachment, error: selectError } = await supabase
      .from("attachments")
      .select("id, drive_file_id")
      .eq("id", attachmentId)
      .eq("owner_type", "blood_test")
      .limit(1)
      .returns<{ id: string; drive_file_id: string }[]>();

    const attachmentRow = attachment?.[0];
    if (selectError || !attachmentRow) {
      return { ok: false, error: selectError?.message ?? (await getT()).t.uploads.errors.attachmentNotFound };
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
      // tradeoff as deletePhoto in residents/[id]/photos/actions.ts).
    }

    revalidatePath(`/residents/${residentId}`);
    revalidatePath(`/residents/${residentId}/blood-tests`);
    return { ok: true };
    },
  );
}

const MAX_RESULT = 4000;

/**
 * Corrects the result text of a blood test on a resident who has died. 0320 permits an UPDATE that changes only
 * `results` (and `drive_file_id`) on blood_tests once the record is closed, so this sends exactly `{ results }`.
 * The activity is the one blood_tests_update_perm asks (0264_inert_security_leftovers.sql:94), the same one the
 * attach/remove actions above ask. The row is matched on the text it was read with so two people cannot overwrite
 * each other; a refused update matches no row and is reported as not allowed.
 */
export async function editClosedBloodTestResult(
  residentId: string,
  bloodTestId: string,
  results: string,
  requestId: string,
): Promise<BloodTestActionState> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction(
    "residents.editClosedBloodTestResult",
    { somethingWentWrong: t.common.somethingWentWrong, saveUnknown: t.common.saveUnknown, reloadToSave: t.common.reloadToSave },
    { id: requestId, action: "residents.editClosedBloodTestResult", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.blood_tests")) return { ok: false, error: t.common.notAllowed };
      const text = results.trim();
      if (text.length > MAX_RESULT) return { ok: false, error: t.bloodTests.correctResultTooLong(MAX_RESULT) };

      const { data: state } = await supabase
        .from("resident_current_state")
        .select("is_deceased")
        .eq("resident_id", residentId)
        .limit(1)
        .returns<{ is_deceased: boolean }[]>();
      if (!state?.[0]?.is_deceased) return { ok: false, error: t.closedRecordNote.errors.notClosed };

      const { data: current, error: readError } = await supabase
        .from("blood_tests")
        .select("results")
        .eq("id", bloodTestId)
        .eq("resident_id", residentId)
        .limit(1)
        .returns<{ results: string | null }[]>();
      if (readError) return { ok: false, error: readError.message };
      if (!current?.[0]) return { ok: false, error: t.common.notAllowed };
      const before = current[0].results;

      let update = supabase
        .from("blood_tests")
        .update({ results: text === "" ? null : text })
        .eq("id", bloodTestId)
        .eq("resident_id", residentId);
      update = before === null ? update.is("results", null) : update.eq("results", before);
      const { data, error } = await update.select("id");
      if (error) return { ok: false, error: error.message };
      if (!data?.length) return { ok: false, error: t.closedRecordNote.errors.changed };

      revalidatePath(`/residents/${residentId}`);
      revalidatePath(`/residents/${residentId}/blood-tests`);
      return { ok: true };
    },
  );
}
