"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";

export type ProcedureActionState = { error: string } | undefined;

export async function deleteProcedureAttachment(
  residentId: string,
  attachmentId: string,
): Promise<ProcedureActionState> {
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
    return { error: selectError?.message ?? "Attachment not found." };
  }

  const { error: deleteError } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  try {
    await getDriveClient().deleteFile(attachmentRow.drive_file_id);
  } catch {
    // The DB record is already gone; an orphaned Drive file is a minor
    // cleanup issue, not worth failing the user-facing action over (same
    // tradeoff as deleteBloodTestAttachment).
  }

  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/procedures`);
}
