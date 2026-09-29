"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";

export type BloodTestActionState = ActionResult;

export async function deleteBloodTestAttachment(
  residentId: string,
  attachmentId: string,
): Promise<BloodTestActionState> {
  const { t } = await getT();
  return runAction("residents.deleteBloodTestAttachment", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();

    const { data: attachment, error: selectError } = await supabase
      .from("attachments")
      .select("id, drive_file_id")
      .eq("id", attachmentId)
      .eq("owner_type", "blood_test")
      .limit(1)
      .returns<{ id: string; drive_file_id: string }[]>();

    const attachmentRow = attachment?.[0];
    if (selectError || !attachmentRow) {
      return { ok: false, error: selectError?.message ?? "Attachment not found." };
    }

    const { error: deleteError } = await supabase
      .from("attachments")
      .delete()
      .eq("id", attachmentId);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }

    try {
      await getDriveClient().deleteFile(attachmentRow.drive_file_id);
    } catch {
      // The DB record is already gone; an orphaned Drive file is a minor
      // cleanup issue, not worth failing the user-facing action over (same
      // tradeoff as deletePhoto in residents/[id]/photos/actions.ts).
    }

    revalidatePath(`/residents/${residentId}`);
    revalidatePath(`/residents/${residentId}/blood-tests`);
    return { ok: true };
  });
}
