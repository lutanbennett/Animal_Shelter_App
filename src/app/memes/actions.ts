"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { confirmUploaded, findOrCreateFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { checkMemeFields, checkPostUrl, parseTags, MEME_NOTE_MAX, type MemeFields } from "@/lib/memes/form";
import { isPlatform } from "@/lib/memes/platforms";
import { resolveSource } from "@/lib/memes/source-server";
import { isSourceKind, type SourceKind } from "@/lib/memes/sources";

/**
 * The meme library's writes (0223). Every one asks can() for a sentence; the database asks has_permission() for the
 * rule, so a stale page or a hand-made request is refused there too. The image goes to a Memes folder under the
 * shelter's Drive root (created here on first use: the schema PR made none) and is never public: the photo route
 * serves it only to a session that can select the memes row. docs/decisions/2026-10-18-meme-library-app.md.
 */

const MEME_FOLDER = "Memes";
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateMeme(id?: string, residentIds: readonly string[] = []) {
  revalidatePath("/memes");
  if (id) revalidatePath(`/memes/${id}`);
  for (const r of residentIds) revalidatePath(`/residents/${r}`);
}

function readFields(formData: FormData): MemeFields {
  const text = (name: string) => (formData.get(name) as string | null) ?? "";
  return {
    title: text("title"),
    captionEn: text("captionEn"),
    captionTh: text("captionTh"),
    tags: text("tags"),
    residentIds: formData.getAll("residentIds").filter((v): v is string => typeof v === "string" && UUID.test(v)),
  };
}

async function trashQuietly(fileId: string) {
  try {
    await getDriveClient().trashFile(fileId);
  } catch (err) {
    console.error("Meme upload: could not trash the orphaned file", fileId, err);
  }
}

/** Add a meme: the image to Drive, then the row and its residents. A row that fails after the upload trashes the file. */
export async function createMeme(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  const e = t.memes.form.errors;
  return runAction<{ id: string }>("memes.create", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "social.library")) return { ok: false, error: e.notAllowed };

    const fields = readFields(formData);
    const problem = checkMemeFields(fields);
    if (problem) return { ok: false, error: e[problem] };

    // A meme from the maker names the photo it was made from. That photo is checked here, on the save path, not in
    // the picker: a Medical photo is refused, and the residents tagged come from the photo, not from the request.
    const sourceFileId = (formData.get("sourceFileId") as string | null) ?? "";
    const rawKind = (formData.get("sourceKind") as string | null) ?? (sourceFileId ? "resident" : "");
    // An upload names no earlier photo; every other source is re-checked here as the caller (resolveSource).
    const sourceKind: SourceKind | null = isSourceKind(rawKind) ? rawKind : null;
    let link = { outingId: null as string | null, maintenanceId: null as string | null, projectId: null as string | null };
    if (sourceKind && sourceKind !== "upload") {
      if (!/^[A-Za-z0-9_-]{10,100}$/.test(sourceFileId)) return { ok: false, error: e.sourceNotFound };
      const source = await resolveSource(await createClient(), perms, sourceKind, sourceFileId);
      if (!source.ok) {
        return {
          ok: false,
          error: source.reason === "medical" ? e.sourceMedical : source.reason === "notApproved" ? e.sourceNotApproved : source.reason === "notAllowed" ? e.sourceNotAllowed : e.sourceNotFound,
        };
      }
      fields.residentIds = [...new Set([...fields.residentIds, ...source.residentIds])];
      link = source;
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: e.noFile };
    if (!IMAGE_MIME_TYPES.has(file.type)) return { ok: false, error: e.unsupportedFileType(file.type || "unknown") };
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: e.fileTooLarge };
    // The browser's type is a guess from the name; the bytes decide (file-signature.ts).
    const mimeType = await checkFileSignature(file, IMAGE_MIME_TYPES);
    if (!mimeType) return { ok: false, error: t.uploads.notReadable(file.name, formatNames(IMAGE_MIME_TYPES)) };

    const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootId) return { ok: false, error: e.driveNotConfigured };

    let fileId: string;
    try {
      const drive = getDriveClient();
      const folderId = await findOrCreateFolder(drive, rootId, MEME_FOLDER);
      fileId = await uploadImageToFolder(drive, folderId, { name: file.name, mimeType, content: file });
      await confirmUploaded(drive, fileId, file.size);
    } catch (err) {
      console.error("Meme upload failed:", err);
      return { ok: false, error: e.uploadFailed };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("memes")
      .insert({
        drive_file_id: fileId,
        file_name: file.name,
        title: fields.title.trim(),
        caption_en: fields.captionEn.trim() || null,
        caption_th: fields.captionTh.trim() || null,
        tags: parseTags(fields.tags),
      })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) {
      console.error("Meme insert failed:", error);
      await trashQuietly(fileId);
      return { ok: false, error: e.saveFailed };
    }

    if (fields.residentIds.length > 0) {
      const { error: linkError } = await supabase
        .from("meme_residents")
        .insert(fields.residentIds.map((resident_id) => ({ meme_id: data.id, resident_id })));
      // The meme is saved; a failed link is reported, not undone, so the person edits rather than uploads again.
      if (linkError) console.error("Meme residents insert failed:", linkError);
    }

    revalidateMeme(data.id, fields.residentIds);
    return { ok: true, id: data.id };
  });
}

/** Change the words, tags and residents. The image stays: a different picture is a different meme. */
export async function updateMeme(id: string, formData: FormData): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.memes.form.errors;
  return runAction("memes.update", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "social.library")) return { ok: false, error: e.notAllowed };
    if (!UUID.test(id)) return { ok: false, error: e.notFound };

    const fields = readFields(formData);
    const problem = checkMemeFields(fields);
    if (problem) return { ok: false, error: e[problem] };

    const supabase = await createClient();
    const { data: before } = await supabase
      .from("meme_residents")
      .select("resident_id")
      .eq("meme_id", id)
      .returns<{ resident_id: string }[]>();
    const { data, error } = await supabase
      .from("memes")
      .update({
        title: fields.title.trim(),
        caption_en: fields.captionEn.trim() || null,
        caption_th: fields.captionTh.trim() || null,
        tags: parseTags(fields.tags),
      })
      .eq("id", id)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return { ok: false, error: e.saveFailed };
    if (!data?.[0]) return { ok: false, error: e.notFound };

    const wanted = new Set(fields.residentIds);
    const had = new Set((before ?? []).map((r) => r.resident_id));
    const toRemove = [...had].filter((r) => !wanted.has(r));
    const toAdd = [...wanted].filter((r) => !had.has(r));
    if (toRemove.length > 0) {
      const { error: removeError } = await supabase.from("meme_residents").delete().eq("meme_id", id).in("resident_id", toRemove);
      if (removeError) return { ok: false, error: e.saveFailed };
    }
    if (toAdd.length > 0) {
      const { error: addError } = await supabase.from("meme_residents").insert(toAdd.map((resident_id) => ({ meme_id: id, resident_id })));
      if (addError) return { ok: false, error: e.saveFailed };
    }

    revalidateMeme(id, [...had, ...wanted]);
    return { ok: true };
  });
}

/** Archive (or bring back) a meme: `archived` flips, nothing is deleted, and its shares stay. */
export async function setMemeArchived(id: string, archived: boolean): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.memes.form.errors;
  return runAction("memes.archive", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "social.library")) return { ok: false, error: e.notAllowed };
    if (!UUID.test(id)) return { ok: false, error: e.notFound };
    const supabase = await createClient();
    const [{ data, error }, { data: links }] = await Promise.all([
      supabase.from("memes").update({ archived }).eq("id", id).select("id").returns<{ id: string }[]>(),
      supabase.from("meme_residents").select("resident_id").eq("meme_id", id).returns<{ resident_id: string }[]>(),
    ]);
    if (error) return { ok: false, error: e.saveFailed };
    if (!data?.[0]) return { ok: false, error: e.notFound };
    revalidateMeme(id, (links ?? []).map((l) => l.resident_id));
    return { ok: true };
  });
}

export type ShareInput = { platform: string; sharedOn: string; postUrl: string; note: string };

/** Record where and when a meme was posted. recorded_by is stamped by the database. */
export async function recordMemeShare(memeId: string, input: ShareInput): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  const e = t.memes.share.errors;
  return runAction<{ id: string }>("memes.recordShare", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "social.library")) return { ok: false, error: t.memes.form.errors.notAllowed };
    if (!UUID.test(memeId)) return { ok: false, error: t.memes.form.errors.notFound };
    if (!isPlatform(input.platform)) return { ok: false, error: e.badPlatform };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sharedOn) || Number.isNaN(new Date(input.sharedOn).getTime())) {
      return { ok: false, error: e.badDate };
    }
    const postUrl = input.postUrl.trim();
    if (!checkPostUrl(postUrl)) return { ok: false, error: e.badLink };
    const note = input.note.trim();
    if (note.length > MEME_NOTE_MAX) return { ok: false, error: e.noteLong };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("social_shares")
      .insert({
        owner_type: "meme",
        owner_id: memeId,
        platform: input.platform,
        shared_on: input.sharedOn,
        post_url: postUrl || null,
        note: note || null,
      })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) {
      console.error("Meme share insert failed:", error);
      return { ok: false, error: t.memes.form.errors.saveFailed };
    }
    revalidateMeme(memeId);
    return { ok: true, id: data.id };
  });
}

/** Take a share record off (a mistaken entry). The post itself is untouched. */
export async function removeMemeShare(memeId: string, shareId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("memes.removeShare", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "social.library")) return { ok: false, error: t.memes.form.errors.notAllowed };
    if (!UUID.test(memeId) || !UUID.test(shareId)) return { ok: false, error: t.memes.share.errors.notFound };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("social_shares")
      .delete()
      .eq("id", shareId)
      .eq("owner_type", "meme")
      .eq("owner_id", memeId)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return { ok: false, error: t.memes.form.errors.saveFailed };
    if (!data?.[0]) return { ok: false, error: t.memes.share.errors.notFound };
    revalidateMeme(memeId);
    return { ok: true };
  });
}
