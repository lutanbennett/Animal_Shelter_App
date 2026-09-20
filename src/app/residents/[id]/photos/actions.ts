"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";

export type PhotoActionState = { error: string } | undefined;

function revalidateResident(residentId: string) {
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/photos`);
}

export async function setProfilePhoto(
  residentId: string,
  driveFileId: string,
): Promise<PhotoActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_resident_profile_photo", {
    p_resident_id: residentId,
    p_drive_file_id: driveFileId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateResident(residentId);
}

export async function deletePhoto(
  residentId: string,
  attachmentId: string,
): Promise<PhotoActionState> {
  const supabase = await createClient();
  const { data: driveFileId, error } = await supabase.rpc(
    "delete_resident_photo",
    { p_attachment_id: attachmentId },
  );

  if (error) {
    return { error: error.message };
  }

  if (driveFileId) {
    try {
      await getDriveClient().deleteFile(driveFileId);
    } catch {
      // The DB record is already gone; an orphaned Drive file is a minor
      // cleanup issue, not worth failing the user-facing action over.
    }
  }

  revalidateResident(residentId);
}
