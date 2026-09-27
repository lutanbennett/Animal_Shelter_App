"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";
import { refreshDeceasedArchiveIfNeeded } from "@/lib/archive/refresh-deceased-archive";
import { getT } from "@/lib/i18n/get-t";
import { setResidentProfilePhoto } from "@/lib/residents/profile-photo";

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
  const { t } = await getT();
  const refused = await setResidentProfilePhoto(supabase, t, residentId, driveFileId);
  if (refused) return refused;

  // The summary PDF carries the profile photo (0052 keeps photos open).
  await refreshDeceasedArchiveIfNeeded(supabase, residentId);
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

  await refreshDeceasedArchiveIfNeeded(supabase, residentId);
  revalidateResident(residentId);
}
