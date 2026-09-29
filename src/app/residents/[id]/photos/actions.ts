"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { ensureResidentPhotosFolder, getDriveClient } from "@/lib/google/drive";
import { driveErrorMessage } from "@/lib/google/drive-errors";
import {
  PHOTO_CATEGORIES,
  dateToYymm,
  photoCategoriesForRole,
  type PhotoCategory,
} from "@/lib/google/drive-client";
import { refreshDeceasedArchiveIfNeeded } from "@/lib/archive/refresh-deceased-archive";
import { getT } from "@/lib/i18n/get-t";
import { assertPhotoWriteAccess } from "@/lib/auth/require-role";
import { setResidentProfilePhoto } from "@/lib/residents/profile-photo";
import { todayIso } from "@/lib/format";

export type PhotoActionState = ActionResult;

function revalidateResident(residentId: string) {
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/photos`);
}

export async function setProfilePhoto(
  residentId: string,
  driveFileId: string,
): Promise<PhotoActionState> {
  const { t } = await getT();
  return runAction<{}>("residents.setProfilePhoto", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();
    const refused = await setResidentProfilePhoto(supabase, t, residentId, driveFileId);
    if (refused) return { ok: false, error: refused.error };

    // The summary PDF carries the profile photo (0052 keeps photos open).
    await refreshDeceasedArchiveIfNeeded(supabase, residentId);
    revalidateResident(residentId);
    return { ok: true };
  });
}

export async function deletePhoto(
  residentId: string,
  attachmentId: string,
): Promise<PhotoActionState> {
  const { t } = await getT();
  return runAction<{}>("residents.deletePhoto", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();
    const { data: driveFileId, error } = await supabase.rpc(
      "delete_resident_photo",
      { p_attachment_id: attachmentId },
    );

    if (error) {
      return { ok: false, error: error.message };
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
    return { ok: true };
  });
}

/**
 * Refiles a photo taken at the shelter into a different PHOTO_CATEGORIES
 * folder (backlog, "Move a resident photo to a different folder when it was
 * filed wrongly", 2026-09-27) — the fix for a photo 0101 couldn't catch: one
 * recorded Shelter when it is really Medical, and so still public.
 *
 * Drive moves first; the row is only updated once that succeeds. Reversed,
 * a failed Drive move after the DB already said Medical would leave the
 * photo hidden from the public views (harmless) but sitting in the old
 * folder for anyone browsing Drive directly — this order keeps Drive and
 * the database from disagreeing about where the file lives at all, and if
 * the DB write is the half that fails, Drive is already right and nothing
 * about the site's public state has changed: retrying just the save fixes
 * it (docs/decisions.md, 2026-09-28).
 */
export async function movePhotoToFolder(
  residentId: string,
  attachmentId: string,
  targetCategory: PhotoCategory,
): Promise<PhotoActionState> {
  const { t } = await getT();
  return runAction<{}>("residents.movePhotoToFolder", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();

    let role: string;
    try {
      role = await assertPhotoWriteAccess();
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : t.photos.errors.notAuthorized };
    }

    if (!PHOTO_CATEGORIES.includes(targetCategory)) {
      return { ok: false, error: t.photos.errors.notMovable };
    }

    // A role with one folder (a vet: Medical) may only move a photo INTO it,
    // never out of it — the same restriction the upload route enforces.
    const categories = photoCategoriesForRole(role);
    const onlyFolder = categories.length === 1 ? categories[0] : null;
    if (onlyFolder && targetCategory !== onlyFolder) {
      return { ok: false, error: t.photos.errors.onlyFolder(onlyFolder) };
    }

    const [{ data: attachmentRows }, { data: residentRows }] = await Promise.all([
      supabase
        .from("attachments")
        .select("id, drive_file_id, sub_folder, date_taken")
        .eq("id", attachmentId)
        .eq("owner_type", "resident")
        .eq("owner_id", residentId)
        .returns<
          { id: string; drive_file_id: string; sub_folder: string | null; date_taken: string | null }[]
        >(),
      supabase
        .from("residents")
        .select("id, name, resident_code, drive_folder_id, profile_photo_drive_file_id")
        .eq("id", residentId)
        .limit(1)
        .returns<
          {
            id: string;
            name: string;
            resident_code: string;
            drive_folder_id: string | null;
            profile_photo_drive_file_id: string | null;
          }[]
        >(),
    ]);

    const attachment = attachmentRows?.[0];
    const resident = residentRows?.[0];
    if (!attachment || !resident) {
      return { ok: false, error: t.photos.errors.notFound };
    }

    // Adoption-update photos are filed under a <YYYYMMDD> folder, not a
    // PHOTO_CATEGORIES one, and are out of scope — as is a no-op "move" to
    // the folder it's already in.
    if (
      !PHOTO_CATEGORIES.includes((attachment.sub_folder ?? "") as PhotoCategory) ||
      attachment.sub_folder === targetCategory
    ) {
      return { ok: false, error: t.photos.errors.notMovable };
    }

    // Same rule as setResidentProfilePhoto: a Medical photo is never the
    // profile photo, so moving the current profile photo into Medical is
    // refused rather than silently clearing it.
    if (targetCategory === "Medical" && attachment.drive_file_id === resident.profile_photo_drive_file_id) {
      return { ok: false, error: t.photos.errors.medicalProfileMove };
    }

    const drive = getDriveClient();
    const dateTaken = attachment.date_taken ?? todayIso();

    let uploadFolderId: string;
    let residentFolderId: string;
    let isNewResidentFolder: boolean;
    try {
      ({ residentFolderId, uploadFolderId, isNewResidentFolder } = await ensureResidentPhotosFolder(
        drive,
        resident,
        targetCategory,
        dateToYymm(dateTaken),
      ));

      const file = await drive.getFile(attachment.drive_file_id, "id, parents");
      await drive.moveFile({
        fileId: attachment.drive_file_id,
        addParents: uploadFolderId,
        removeParents: (file.parents ?? []).join(","),
      });
    } catch (err) {
      return { ok: false, error: await driveErrorMessage(err, t.photos.errors.moveFailed) };
    }

    if (isNewResidentFolder) {
      // Best effort: the move itself already succeeded, and this is only the
      // cached folder-id lookup that speeds up the next upload.
      await supabase.from("residents").update({ drive_folder_id: residentFolderId }).eq("id", residentId);
    }

    // The Drive file has already moved; from here on a failure leaves Drive
    // and the database disagreeing about the folder, not the public site
    // about-turning, so the message says exactly that rather than a generic
    // save error.
    const { error: updateError } = await supabase
      .from("attachments")
      .update({ sub_folder: targetCategory })
      .eq("id", attachmentId);

    if (updateError) {
      return { ok: false, error: t.photos.errors.moveIncomplete };
    }

    await refreshDeceasedArchiveIfNeeded(supabase, residentId);
    revalidateResident(residentId);
    return { ok: true };
  });
}
