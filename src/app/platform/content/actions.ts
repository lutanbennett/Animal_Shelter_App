"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, databaseFailure, runWriteAction, type WriteMessages } from "@/lib/action-result";
import { hasTwoStep } from "@/lib/auth/two-step";
import { isProductAdmin } from "@/lib/auth/product-admin";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { createClient } from "@/lib/supabase/server";
import { driveRootFolderId } from "@/lib/shelter-settings";
import { confirmUploaded, findOrCreateFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { driveErrorMessage } from "@/lib/google/drive-errors";
import { MAX_UPLOAD_BYTES, WEBSITE_IMAGE_MIME_TYPES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { PRODUCT_PAGE_RE, PRODUCT_KEY_RE } from "@/lib/site/product-content";

/*
 * The product site's words and photos (#pcmsx, console half). The checks here are the courtesy: both database functions
 * (0441) require is_product_admin() AND aal2 themselves, and are called through the SIGNED-IN client, never the service
 * role, so a forged request is refused there. Who may use this is a list of people, not a card (Lutan, 2026-11-18).
 */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

export type ContentLine = { page: string; key: string; en: string; th: string };

async function gate(t: Dictionary): Promise<string | null> {
  const e = t.admin.productAdmin.errors;
  if (!(await isProductAdmin())) return e.notProductAdmin;
  if (!(await hasTwoStep())) return e.needsTwoStep;
  return null;
}

function shapeError(t: Dictionary, line: { page: string; key: string }): string | null {
  const c = t.admin.productAdmin.content.errors;
  if (!PRODUCT_PAGE_RE.test(line.page)) return c.badPage;
  if (!PRODUCT_KEY_RE.test(line.key)) return c.badKey;
  return null;
}

function revalidateProductPages() {
  revalidatePath("/platform/content");
  revalidatePath("/platform/about");
  revalidatePath("/platform/features/[slug]", "page");
}

/** Saves the lines that changed, English and Thai together, in one atomic call. A line carries no drive_file_id, so a stored photo is kept. */
export async function saveProductContent(lines: ContentLine[], requestId: string | null): Promise<ActionResult<{ count: number }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("productContent.save", write(t), { id: requestId, action: "productContent.save", db: supabase }, async () => {
    const no = await gate(t);
    if (no) return { ok: false, error: no };
    for (const l of lines) {
      const bad = shapeError(t, l);
      if (bad) return { ok: false, error: bad };
    }
    const rows = lines.map((l) => ({ page: l.page, key: l.key, en: l.en, th: l.th }));
    const { data, error } = await supabase.rpc("product_admin_set_platform_content", { p_rows: rows });
    if (error) return databaseFailure("productContent.save", error, t.common);
    revalidateProductPages();
    return { ok: true, count: typeof data === "number" ? data : rows.length };
  });
}

export async function deleteProductContent(page: string, key: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("productContent.delete", write(t), { id: requestId, action: "productContent.delete", db: supabase }, async () => {
    const no = await gate(t);
    if (no) return { ok: false, error: no };
    const bad = shapeError(t, { page, key });
    if (bad) return { ok: false, error: bad };
    const { error } = await supabase.rpc("product_admin_delete_platform_content", { p_page: page, p_key: key });
    if (error) return databaseFailure("productContent.delete", error, t.common);
    revalidateProductPages();
    return { ok: true };
  });
}

async function uploadToProductFolder(file: File, t: Dictionary): Promise<string> {
  const w = t.admin.website.errors;
  if (!WEBSITE_IMAGE_MIME_TYPES.has(file.type)) throw new Error(w.unsupportedFileType(file.type || "unknown"));
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(w.fileTooLarge);
  // The type above is the browser's guess; the bytes decide (file-signature.ts).
  const mimeType = await checkFileSignature(file, WEBSITE_IMAGE_MIME_TYPES);
  if (!mimeType) throw new Error(t.uploads.notReadable(file.name, formatNames(WEBSITE_IMAGE_MIME_TYPES)));
  const rootId = await driveRootFolderId();
  if (!rootId) throw new Error(w.driveNotConfigured);
  const drive = getDriveClient();
  const folderId = await findOrCreateFolder(drive, rootId, "Product site");
  const fileId = await uploadImageToFolder(drive, folderId, { name: file.name, mimeType, content: file });
  try {
    await confirmUploaded(drive, fileId, file.size);
  } catch (err) {
    console.error("Product site upload did not land whole:", err);
    await trashQuietly(fileId);
    throw new Error(t.admin.productAdmin.content.errors.uploadFailed);
  }
  return fileId;
}

/** Drive's trash keeps a file 30 days, so a bad replacement can be undone (the same call the Website console makes). */
async function trashQuietly(fileId: string) {
  try {
    await getDriveClient().trashFile(fileId);
  } catch {
    // An orphaned Drive file is a minor cleanup issue, not worth failing the action.
  }
}

/** Sets a line's photo. The line's own words (the alt text) travel with it so a new line is created whole. FormData: page, key, en, th, file. */
export async function uploadProductPhoto(formData: FormData): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("productContent.photo", write(t), { id: writeRequestIdFrom(formData), action: "productContent.photo", db: supabase }, async () => {
    const no = await gate(t);
    if (no) return { ok: false, error: no };
    const page = String(formData.get("page") ?? "");
    const key = String(formData.get("key") ?? "");
    const bad = shapeError(t, { page, key });
    if (bad) return { ok: false, error: bad };
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: t.admin.productAdmin.content.errors.noFile };

    const { data: current } = await supabase
      .from("public_platform_content")
      .select("drive_file_id")
      .eq("page", page)
      .eq("key", key)
      .limit(1)
      .returns<{ drive_file_id: string | null }[]>();

    let driveFileId: string;
    try {
      driveFileId = await uploadToProductFolder(file, t);
    } catch (err) {
      return { ok: false, error: await driveErrorMessage(err, t.admin.productAdmin.content.errors.uploadFailed) };
    }
    const row = { page, key, en: String(formData.get("en") ?? ""), th: String(formData.get("th") ?? ""), drive_file_id: driveFileId };
    const { error } = await supabase.rpc("product_admin_set_platform_content", { p_rows: [row] });
    if (error) {
      await trashQuietly(driveFileId);
      return databaseFailure("productContent.photo", error, t.common);
    }
    const previous = current?.[0]?.drive_file_id;
    if (previous) await trashQuietly(previous);
    revalidateProductPages();
    return { ok: true };
  });
}

/** Clears a line's photo (the line and its alt text stay). */
export async function removeProductPhoto(page: string, key: string, en: string, th: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("productContent.photoRemove", write(t), { id: requestId, action: "productContent.photoRemove", db: supabase }, async () => {
    const no = await gate(t);
    if (no) return { ok: false, error: no };
    const bad = shapeError(t, { page, key });
    if (bad) return { ok: false, error: bad };
    const { data: current } = await supabase.from("public_platform_content").select("drive_file_id").eq("page", page).eq("key", key).limit(1).returns<{ drive_file_id: string | null }[]>();
    const { error } = await supabase.rpc("product_admin_set_platform_content", { p_rows: [{ page, key, en, th, drive_file_id: "" }] });
    if (error) return databaseFailure("productContent.photoRemove", error, t.common);
    const previous = current?.[0]?.drive_file_id;
    if (previous) await trashQuietly(previous);
    revalidateProductPages();
    return { ok: true };
  });
}
