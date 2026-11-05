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
 * Approves event photos (0314). Same stamp, same refusal as a resident's: attachments_approval_stamp (0312) records who
 * and when and refuses a login that may not approve.
 */
export async function approveEventPhotos(ids: string[], requestId: string): Promise<ActionResult<{ approved: number }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ approved: number }>("photos.approveEvent", write(t), { id: requestId, action: "photos.approveEvent", db: supabase }, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "photos.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };
    const chosen = [...new Set(ids)];
    if (chosen.length === 0) return { ok: false, error: t.photoApproval.errors.nothingChosen };
    if (chosen.length > MAX_BATCH) return { ok: false, error: t.photoApproval.errors.tooMany(MAX_BATCH) };

    const { data, error } = await supabase
      .from("attachments")
      .update({ approved_at: new Date().toISOString() })
      .in("id", chosen)
      .eq("owner_type", "event")
      .is("approved_at", null)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return { ok: false, error: t.photoApproval.events.approveFailed };

    revalidateQueue();
    revalidatePath("/management/events", "layout");
    return { ok: true, approved: data?.length ?? 0 };
  });
}

/** Removes an event photo that is still waiting; a stale page can never remove one already approved. Drive's bin keeps it 30 days. */
export async function removeWaitingEventPhoto(attachmentId: string, requestId: string): Promise<ActionResult<{ driveWarning?: string }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ driveWarning?: string }>("photos.removeWaitingEvent", write(t), { id: requestId, action: "photos.removeWaitingEvent", db: supabase }, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "photos.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };

    const { data: waiting } = await supabase
      .from("attachments")
      .select("id, drive_file_id")
      .eq("id", attachmentId)
      .eq("owner_type", "event")
      .is("approved_at", null)
      .returns<{ id: string; drive_file_id: string }[]>();
    const row = waiting?.[0];
    if (!row) return { ok: false, error: t.photoApproval.events.notWaiting };

    // The gallery row cascades from the attachment.
    const { error } = await supabase.from("attachments").delete().eq("id", row.id).eq("owner_type", "event").is("approved_at", null);
    if (error) return { ok: false, error: t.photoApproval.events.removeFailed };

    let driveWarning: string | undefined;
    try {
      await getDriveClient().trashFile(row.drive_file_id);
    } catch {
      driveWarning = t.photoApproval.driveLeftBehind;
    }
    revalidateQueue();
    revalidatePath("/management/events", "layout");
    return { ok: true, driveWarning };
  });
}

/** Approves waiting project photos (0316). Asks photos.approve, as can_approve_photos() does in the database. */
export async function approveProjectPhotos(ids: string[], requestId: string): Promise<ActionResult<{ approved: number }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ approved: number }>("photos.approveProject", write(t), { id: requestId, action: "photos.approveProject", db: supabase }, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "photos.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };
    const chosen = [...new Set(ids)];
    if (chosen.length === 0) return { ok: false, error: t.photoApproval.errors.nothingChosen };
    if (chosen.length > MAX_BATCH) return { ok: false, error: t.photoApproval.errors.tooMany(MAX_BATCH) };

    const { data, error } = await supabase
      .from("attachments")
      .update({ approved_at: new Date().toISOString() })
      .in("id", chosen)
      .eq("owner_type", "project")
      .is("approved_at", null)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return { ok: false, error: t.photoApproval.projects.approveFailed };

    revalidateQueue();
    revalidatePath("/projects", "layout");
    return { ok: true, approved: data?.length ?? 0 };
  });
}

/** Removes a project photo that is still waiting; a stale page can never remove one already approved. Drive's bin keeps it 30 days. */
export async function removeWaitingProjectPhoto(attachmentId: string, requestId: string): Promise<ActionResult<{ driveWarning?: string }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ driveWarning?: string }>("photos.removeWaitingProject", write(t), { id: requestId, action: "photos.removeWaitingProject", db: supabase }, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "photos.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };

    const { data: waiting } = await supabase
      .from("attachments")
      .select("id, drive_file_id")
      .eq("id", attachmentId)
      .eq("owner_type", "project")
      .is("approved_at", null)
      .returns<{ id: string; drive_file_id: string }[]>();
    const row = waiting?.[0];
    if (!row) return { ok: false, error: t.photoApproval.projects.notWaiting };

        const { error } = await supabase.from("attachments").delete().eq("id", row.id).eq("owner_type", "project").is("approved_at", null);
    if (error) return { ok: false, error: t.photoApproval.projects.removeFailed };

    let driveWarning: string | undefined;
    try {
      await getDriveClient().trashFile(row.drive_file_id);
    } catch {
      driveWarning = t.photoApproval.driveLeftBehind;
    }
    revalidateQueue();
    revalidatePath("/projects", "layout");
    return { ok: true, driveWarning };
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

/**
 * Answers "Private only" for the photos named (0318): looked at and refused, so the photo leaves every queue and never
 * reaches the website. Works for the three kinds that ride attachments (resident, event, project). Asks photos.approve,
 * as can_approve_photos() does in the database; the trigger stamps who and when and clears a Public ok if there was one.
 * `private_only_at` is the only column written (`approval` is generated from it).
 */
export async function markPhotosPrivateOnly(
  ids: string[],
  kind: "resident" | "event" | "project",
  requestId: string,
): Promise<ActionResult<{ marked: number }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ marked: number }>("photos.privateOnly", write(t), { id: requestId, action: "photos.privateOnly", db: supabase }, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "photos.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };
    const chosen = [...new Set(ids)];
    if (chosen.length === 0) return { ok: false, error: t.photoApproval.errors.nothingChosen };
    if (chosen.length > MAX_BATCH) return { ok: false, error: t.photoApproval.errors.tooMany(MAX_BATCH) };

    // Only a photo still waiting: a stale page can never take one already on the website off it by this route.
    const { data, error } = await supabase
      .from("attachments")
      .update({ private_only_at: new Date().toISOString() })
      .in("id", chosen)
      .eq("owner_type", kind)
      .is("approved_at", null)
      .is("private_only_at", null)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return { ok: false, error: t.photoApproval.privateOnlyFailed };

    revalidateQueue();
    if (kind === "event") revalidatePath("/management/events", "layout");
    if (kind === "project") revalidatePath("/projects", "layout");
    return { ok: true, marked: data?.length ?? 0 };
  });
}
