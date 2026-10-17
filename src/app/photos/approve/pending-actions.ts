"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { ensureResidentPhotosFolder, getDriveClient } from "@/lib/google/drive";
import { dateToYymm, PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { loadPermissions } from "@/lib/permissions/load";
import { can } from "@/lib/permissions/can";
import { isUuid } from "@/lib/tags/links";
import { bangkokDate } from "@/lib/photos/dates";

/** A photo of one animal is in at most this many residents' folders; a group shot is a handful, not a crowd. */
const MAX_RESIDENTS = 8;

function revalidateQueue() {
  revalidatePath("/photos/approve");
  revalidatePath("/home", "layout");
}

type ResidentRow = { id: string; name: string; resident_code: string; drive_folder_id: string | null };

/**
 * Assigns a photo tagged to an enclosure to one or several residents. Assigning IS approving (the approver has
 * looked and named the animal), unless `approve` is false, which files the photo as an ordinary resident photo that
 * waits like any other and stays off the website.
 *
 * THE ORDER, and why. `assign_pending_photo()` is atomic; Drive is not (0218). The function needs the Drive id of
 * every resident's file, and a copy only has an id once it exists, so:
 *   1. a Drive copy for each resident after the first, straight into that resident's Shelter folder;
 *   2. the database call. If it fails, the copies are trashed and nothing else has changed: the photo is still
 *      waiting, still in Unsorted, still never public;
 *   3. only then the original is moved into the first resident's Shelter folder. If that fails the database is
 *      already right and the file still shows (the proxy follows the id, not the folder); the person is told the
 *      file is left in Unsorted. The reverse order could leave a resident's photo whose file had gone.
 * Nothing in 1 to 3 can make a photo public: the new rows are waiting until `approve` says otherwise, by the
 * database, which also refuses anyone who may not publish.
 */
export async function assignPendingPhoto(
  pendingId: string,
  residentIds: string[],
  approve: boolean,
): Promise<ActionResult<{ assigned: number; driveWarning?: string }>> {
  const { t } = await getT();
  const e = t.photoApproval.pending.errors;
  return runAction<{ assigned: number; driveWarning?: string }>(
    "photos.assignPending",
    t.common.somethingWentWrong,
    async () => {
      const perms = await loadPermissions();
      if (!can(perms, "photos.resident_publish")) return { ok: false, error: t.photoApproval.errors.notAllowed };
      const chosen = [...new Set(residentIds)];
      if (!isUuid(pendingId) || chosen.length === 0 || !chosen.every(isUuid)) return { ok: false, error: e.nobodyChosen };
      if (chosen.length > MAX_RESIDENTS) return { ok: false, error: e.tooMany(MAX_RESIDENTS) };

      const supabase = await createClient();
      const [{ data: pendingRows }, { data: residentRows }] = await Promise.all([
        supabase
          .from("pending_photos")
          .select("id, drive_file_id, file_name, taken_at")
          .eq("id", pendingId)
          .returns<{ id: string; drive_file_id: string; file_name: string | null; taken_at: string }[]>(),
        supabase
          .from("residents")
          .select("id, name, resident_code, drive_folder_id")
          .in("id", chosen)
          .returns<ResidentRow[]>(),
      ]);
      const pending = pendingRows?.[0];
      if (!pending) return { ok: false, error: e.gone };
      const byId = new Map((residentRows ?? []).map((r) => [r.id, r]));
      if (!chosen.every((id) => byId.has(id))) return { ok: false, error: e.residentGone };

      const drive = getDriveClient();
      const yymm = dateToYymm(bangkokDate(pending.taken_at));
      const folders: { residentId: string; uploadFolderId: string; residentFolderId: string; isNew: boolean }[] = [];
      const copies: string[] = [];
      const assignments: { resident_id: string; drive_file_id: string }[] = [];
      try {
        for (const id of chosen) {
          const resident = byId.get(id)!;
          const f = await ensureResidentPhotosFolder(drive, resident, "Shelter", yymm);
          folders.push({ residentId: id, uploadFolderId: f.uploadFolderId, residentFolderId: f.residentFolderId, isNew: f.isNewResidentFolder });
        }
        for (const [index, f] of folders.entries()) {
          if (index === 0) {
            assignments.push({ resident_id: f.residentId, drive_file_id: pending.drive_file_id });
            continue;
          }
          const copy = await drive.copyFile(pending.drive_file_id, f.uploadFolderId, pending.file_name ?? undefined);
          if (!copy.id) throw new Error("Drive made no copy.");
          copies.push(copy.id);
          assignments.push({ resident_id: f.residentId, drive_file_id: copy.id });
        }
      } catch {
        await trashAll(copies);
        return { ok: false, error: e.driveFailed };
      }

      const { error } = await supabase.rpc("assign_pending_photo", {
        p_pending_id: pendingId,
        p_assignments: assignments,
        p_approve: approve,
      });
      if (error) {
        await trashAll(copies);
        return { ok: false, error: e.assignFailed };
      }

      let driveWarning: string | undefined;
      try {
        const file = await drive.getFile(pending.drive_file_id, "id, parents");
        await drive.moveFile({
          fileId: pending.drive_file_id,
          addParents: folders[0].uploadFolderId,
          removeParents: (file.parents ?? []).join(","),
        });
      } catch {
        driveWarning = e.leftInUnsorted;
      }
      // Best effort, as everywhere: the cached folder id only speeds up the next upload.
      for (const f of folders) {
        if (f.isNew) {
          await supabase.from("residents").update({ drive_folder_id: f.residentFolderId }).eq("id", f.residentId).is("drive_folder_id", null);
        }
      }

      revalidateQueue();
      for (const id of chosen) revalidatePath(`/residents/${id}`);
      return { ok: true, assigned: chosen.length, driveWarning };
    },
  );

  async function trashAll(ids: string[]) {
    const drive = getDriveClient();
    for (const id of ids) {
      try {
        await drive.trashFile(id);
      } catch {
        /* a stray copy in a resident's folder; the answer already says nothing was assigned */
      }
    }
  }
}

/**
 * Throws a pending photo away: the row goes first, then the file is trashed in Drive (the order of Remove on a waiting
 * photo, #701). Drive's bin keeps it 30 days. If Drive then fails, the person is told the file is still there.
 */
export async function discardPendingPhoto(pendingId: string): Promise<ActionResult<{ driveWarning?: string }>> {
  const { t } = await getT();
  return runAction<{ driveWarning?: string }>("photos.discardPending", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "photos.resident_publish")) return { ok: false, error: t.photoApproval.errors.notAllowed };
    if (!isUuid(pendingId)) return { ok: false, error: t.photoApproval.pending.errors.gone };

    const supabase = await createClient();
    const { data: gone, error } = await supabase
      .from("pending_photos")
      .delete()
      .eq("id", pendingId)
      .select("drive_file_id")
      .returns<{ drive_file_id: string }[]>();
    if (error) return { ok: false, error: t.photoApproval.pending.errors.discardFailed };
    if (!gone?.[0]) return { ok: false, error: t.photoApproval.pending.errors.gone };

    let driveWarning: string | undefined;
    try {
      await getDriveClient().trashFile(gone[0].drive_file_id);
    } catch {
      driveWarning = t.photoApproval.driveLeftBehind;
    }
    revalidateQueue();
    return { ok: true, driveWarning };
  });
}

/**
 * Moves a WAITING photo to another resident: the volunteer tagged the wrong animal, and the approver can see it.
 * Only a photo that is still waiting: one already on the website is never moved from under it. The row is changed
 * first (the owner is what matters, and a wrong animal is the harm), then the Drive file is moved to the new
 * resident's Shelter folder; if that fails the photo is right in the app and its file sits in the old folder, and
 * the person is told.
 */
export async function reassignWaitingPhoto(
  attachmentId: string,
  residentId: string,
): Promise<ActionResult<{ driveWarning?: string }>> {
  const { t } = await getT();
  const e = t.photoApproval.errors;
  return runAction<{ driveWarning?: string }>("photos.reassignWaiting", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    // The database lets a login with photos.resident_manage change a waiting photo's owner; the approval page is
    // for logins that may publish. Both are asked, so the sentence comes from here and not a bare refusal.
    if (!can(perms, "photos.resident_publish") || !can(perms, "photos.resident_manage")) {
      return { ok: false, error: e.notAllowed };
    }
    if (!isUuid(attachmentId) || !isUuid(residentId)) return { ok: false, error: e.notWaiting };

    const supabase = await createClient();
    const [{ data: rows }, { data: residentRows }] = await Promise.all([
      supabase
        .from("attachments")
        .select("id, owner_id, drive_file_id, sub_folder, date_taken")
        .eq("id", attachmentId)
        .eq("owner_type", "resident")
        .is("approved_at", null)
        .returns<{ id: string; owner_id: string; drive_file_id: string; sub_folder: string | null; date_taken: string | null }[]>(),
      supabase
        .from("residents")
        .select("id, name, resident_code, drive_folder_id")
        .eq("id", residentId)
        .returns<ResidentRow[]>(),
    ]);
    const photo = rows?.[0];
    const resident = residentRows?.[0];
    if (!photo) return { ok: false, error: e.notWaiting };
    if (!resident) return { ok: false, error: t.photoApproval.pending.errors.residentGone };
    if (photo.owner_id === residentId) return { ok: true };
    const folder = (PHOTO_CATEGORIES as readonly string[]).includes(photo.sub_folder ?? "")
      ? (photo.sub_folder as PhotoCategory)
      : "Shelter";

    const drive = getDriveClient();
    let target: Awaited<ReturnType<typeof ensureResidentPhotosFolder>>;
    try {
      target = await ensureResidentPhotosFolder(
        drive,
        resident,
        folder,
        dateToYymm(photo.date_taken ?? bangkokDate(new Date().toISOString())),
      );
    } catch {
      return { ok: false, error: t.photoApproval.pending.errors.driveFailed };
    }

    const { data: updated, error } = await supabase
      .from("attachments")
      .update({ owner_id: residentId })
      .eq("id", attachmentId)
      .is("approved_at", null)
      .select("id")
      .returns<{ id: string }[]>();
    if (error || !updated?.[0]) return { ok: false, error: t.photoApproval.pending.errors.reassignFailed };

    let driveWarning: string | undefined;
    try {
      const file = await drive.getFile(photo.drive_file_id, "id, parents");
      await drive.moveFile({
        fileId: photo.drive_file_id,
        addParents: target.uploadFolderId,
        removeParents: (file.parents ?? []).join(","),
      });
    } catch {
      driveWarning = t.photoApproval.pending.errors.leftInOldFolder;
    }
    if (target.isNewResidentFolder) {
      await supabase.from("residents").update({ drive_folder_id: target.residentFolderId }).eq("id", residentId).is("drive_folder_id", null);
    }

    revalidateQueue();
    revalidatePath(`/residents/${photo.owner_id}`);
    revalidatePath(`/residents/${residentId}`);
    return { ok: true, driveWarning };
  });
}
