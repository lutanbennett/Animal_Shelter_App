"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { loadPermissions } from "@/lib/permissions/load";
import { can } from "@/lib/permissions/can";

/** The most one tap may approve: a page is never "everything", and a long list is looked at in pieces. */
const MAX_BATCH = 50;

/** The words runWriteAction() needs. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

function revalidateQueue() {
  revalidatePath("/photos/approve");
  revalidatePath("/home", "layout");
}

/**
 * Approves the photos named, and only those. `approved_by` is not sent: the database stamps who and when
 * (attachments_approval_stamp, 0217), and refuses a login that may not publish. The check here is for a sentence,
 * not the rule.
 */
export async function approvePhotos(ids: string[], requestId: string): Promise<ActionResult<{ approved: number }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ approved: number }>("photos.approve", write(t), { id: requestId, action: "photos.approve", db: supabase }, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "photos.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };
    const chosen = [...new Set(ids)];
    if (chosen.length === 0) return { ok: false, error: t.photoApproval.errors.nothingChosen };
    if (chosen.length > MAX_BATCH) return { ok: false, error: t.photoApproval.errors.tooMany(MAX_BATCH) };

    const { data, error } = await supabase
      .from("attachments")
      .update({ approved_at: new Date().toISOString() })
      .in("id", chosen)
      .eq("owner_type", "resident")
      .is("approved_at", null)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return { ok: false, error: t.photoApproval.errors.approveFailed };

    revalidateQueue();
    return { ok: true, approved: data?.length ?? 0 };
  });
}

/**
 * Removes a photo that is still waiting. The row goes first, then the file is trashed in Drive; the same order as
 * the resident's own Remove (residents/[id]/photos/actions.ts). If Drive then fails, the photo is gone from the app
 * and a stray file sits in the resident's Drive folder where only someone browsing Drive would meet it; the other
 * order could leave a photo in the app whose file is gone, a broken picture on a resident's page. Drive's trash
 * keeps the file for 30 days, so even a wrong tap can be undone by hand.
 *
 * It refuses a photo that is no longer waiting: a stale page must never be able to remove one that is already on
 * the website.
 */
export async function removeWaitingPhoto(attachmentId: string, requestId: string): Promise<ActionResult<{ driveWarning?: string }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ driveWarning?: string }>("photos.removeWaiting", write(t), { id: requestId, action: "photos.removeWaiting", db: supabase }, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "photos.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };

    const { data: waiting } = await supabase
      .from("attachments")
      .select("id")
      .eq("id", attachmentId)
      .eq("owner_type", "resident")
      .is("approved_at", null)
      .returns<{ id: string }[]>();
    if (!waiting?.[0]) return { ok: false, error: t.photoApproval.errors.notWaiting };

    const { data: driveFileId, error } = await supabase.rpc("delete_resident_photo", { p_attachment_id: attachmentId });
    if (error) return { ok: false, error: t.photoApproval.errors.removeFailed };

    let driveWarning: string | undefined;
    if (driveFileId) {
      try {
        await getDriveClient().trashFile(driveFileId as string);
      } catch {
        driveWarning = t.photoApproval.driveLeftBehind;
      }
    }
    revalidateQueue();
    return { ok: true, driveWarning };
  });
}
