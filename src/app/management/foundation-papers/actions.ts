"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { writeRequestIdFrom } from "@/lib/write-requests";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature } from "@/lib/uploads/file-signature";
import { confirmUploaded, findOrCreateFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { activityFor, isPaperCategory, monthToFirstDay, MONTHLY_CATEGORIES } from "@/lib/foundation/papers";

const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

/**
 * The foundation's papers (0362). File: the bytes to a Foundation papers folder under the shelter's Drive root, then the row. Remove: the row, then
 * the Drive file. Each asks can() for a sentence and the activity the paper's CATEGORY belongs to (activityFor), the one the database's policies
 * ask, so a login holding only Foundation papers is refused an ID copy here and again by the policy. The file is never public: it is read only
 * through /api/documents/<id>, which asks can_see_drive_file().
 */
const FOLDER = "Foundation papers";
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]);

async function trashQuietly(fileId: string) {
  try {
    await getDriveClient().trashFile(fileId);
  } catch (err) {
    console.error("Foundation papers: could not trash a Drive file", fileId, err);
  }
}

export async function fileFoundationPaper(formData: FormData): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.foundationPapers.errors;
  return runWriteAction("foundation.file", write(t), { id: writeRequestIdFrom(formData), action: "foundation.file", db: await createClient() }, async () => {
    const category = String(formData.get("category") ?? "");
    if (!isPaperCategory(category)) return { ok: false, error: e.badCategory };
    if (!can(await loadPermissions(), activityFor(category), "edit")) return { ok: false, error: e.notAllowed };

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { ok: false, error: e.noTitle };
    const monthly = MONTHLY_CATEGORIES.includes(category);
    const period = monthly ? monthToFirstDay(String(formData.get("month") ?? "")) : null;
    if (monthly && !period) return { ok: false, error: e.noMonth };
    const note = String(formData.get("note") ?? "").trim() || null;

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: e.noFile };
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: e.fileTooLarge };
    // The browser's type is a guess from the name; the bytes decide.
    const mimeType = await checkFileSignature(file, ACCEPTED);
    if (!mimeType) return { ok: false, error: e.unsupportedFileType };

    const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootId) return { ok: false, error: e.driveNotConfigured };

    let fileId: string;
    try {
      const drive = getDriveClient();
      const folderId = await findOrCreateFolder(drive, rootId, FOLDER);
      fileId = await uploadImageToFolder(drive, folderId, { name: file.name, mimeType, content: file });
      await confirmUploaded(drive, fileId, file.size);
    } catch (err) {
      console.error("Foundation paper upload failed:", err);
      return { ok: false, error: e.uploadFailed };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("foundation_documents")
      .insert({ category, title, period, note, drive_file_id: fileId, file_name: file.name, content_type: mimeType });
    if (error) {
      await trashQuietly(fileId);
      return { ok: false, error: e.saveFailed };
    }
    revalidatePath("/management/foundation-papers", "layout");
    return { ok: true };
  });
}

export async function removeFoundationPaper(id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.foundationPapers.errors;
  return runWriteAction("foundation.remove", write(t), { id: requestId, action: "foundation.remove", db: await createClient() }, async () => {
    const supabase = await createClient();
    // Read the row as the caller: RLS answers for the category, so a login without the card finds nothing.
    const { data: row } = await supabase.from("foundation_documents").select("category, drive_file_id").eq("id", id).maybeSingle<{ category: string; drive_file_id: string }>();
    if (!row || !isPaperCategory(row.category)) return { ok: false, error: e.removeFailed };
    if (!can(await loadPermissions(), activityFor(row.category), "edit")) return { ok: false, error: e.notAllowed };
    const { error, count } = await supabase.from("foundation_documents").delete({ count: "exact" }).eq("id", id);
    if (error || count !== 1) return { ok: false, error: e.removeFailed };
    await trashQuietly(row.drive_file_id);
    revalidatePath("/management/foundation-papers", "layout");
    return { ok: true };
  });
}
