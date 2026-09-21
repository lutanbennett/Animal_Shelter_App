"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";
import { getT } from "@/lib/i18n/get-t";
import {
  deleteProjectDriveFolder,
  syncProjectFolderMove,
  syncProjectFolderRename,
} from "@/lib/projects/drive-sync";

export type ProjectActionResult = {
  error?: string;
  driveWarning?: string | null;
  /** The folder the caller should now be looking at (a new folder's id). */
  folderId?: string;
};

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Postgres raises the trigger messages from 0034 ("Categories cannot be
 * renamed or moved.", …) and unique_violation for a duplicate sibling.
 * Translate the ones a user can hit; pass anything else through.
 */
async function friendlyDbError(message: string): Promise<string> {
  const { t } = await getT();
  const e = t.projects.errors;
  if (/project_folders_sibling_name_key|project_folders_root_name_key/.test(message)) {
    return e.duplicateName;
  }
  if (/own subfolder/.test(message)) return e.moveIntoSelf;
  if (/Categories cannot/.test(message)) return e.categoryLocked;
  if (/cannot contain/.test(message)) return e.slashInName;
  return message;
}

/** The pages that show a folder: itself, its parent (counts) and the root. */
function revalidateFolder(folderId: string | null, parentId: string | null) {
  revalidatePath("/projects");
  if (folderId) revalidatePath(`/projects/${folderId}`);
  if (parentId) revalidatePath(`/projects/${parentId}`);
}

export async function createProjectFolder(
  parentId: string,
  formData: FormData,
): Promise<ProjectActionResult> {
  const { t } = await getT();
  const name = str(formData, "name");
  if (!name) return { error: t.projects.errors.nameRequired };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("project_folders")
    .insert({
      // Overwritten by the trigger from the parent; a value is needed to
      // satisfy NOT NULL before the trigger runs.
      top_level_category: "Miscellaneous",
      parent_folder_id: parentId,
      name,
      name_th: str(formData, "nameTh"),
      created_by: user?.id ?? null,
    })
    .select("id")
    .limit(1)
    .returns<{ id: string }[]>();

  if (error) return { error: await friendlyDbError(error.message) };
  const row = data?.[0];
  // RLS filters rather than rejects: a volunteer's insert returns no row.
  if (!row) return { error: t.projects.errors.notAuthorized };

  revalidateFolder(row.id, parentId);
  return { folderId: row.id };
}

export async function renameProjectFolder(
  folderId: string,
  formData: FormData,
): Promise<ProjectActionResult> {
  const { t } = await getT();
  const name = str(formData, "name");
  if (!name) return { error: t.projects.errors.nameRequired };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_folders")
    .update({ name, name_th: str(formData, "nameTh") })
    .eq("id", folderId)
    .select("id, parent_folder_id")
    .returns<{ id: string; parent_folder_id: string | null }[]>();

  if (error) return { error: await friendlyDbError(error.message) };
  const row = data?.[0];
  if (!row) return { error: t.projects.errors.notAuthorized };

  const driveWarning = await syncProjectFolderRename(supabase, folderId);
  revalidateFolder(folderId, row.parent_folder_id);
  return { driveWarning };
}

/** The info card: story, date, location, public flag. */
export async function updateProjectFolderInfo(
  folderId: string,
  formData: FormData,
): Promise<ProjectActionResult> {
  const { t } = await getT();

  const projectDate = str(formData, "projectDate");
  if (projectDate && Number.isNaN(new Date(projectDate).getTime())) {
    return { error: t.projects.errors.invalidDate };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_folders")
    .update({
      summary: str(formData, "summary"),
      project_date: projectDate,
      location: str(formData, "location"),
      is_public: formData.get("isPublic") === "on",
    })
    .eq("id", folderId)
    .select("id, parent_folder_id")
    .returns<{ id: string; parent_folder_id: string | null }[]>();

  if (error) return { error: await friendlyDbError(error.message) };
  const row = data?.[0];
  if (!row) return { error: t.projects.errors.notAuthorized };

  revalidateFolder(folderId, row.parent_folder_id);
  return {};
}

export async function setProjectFolderPublic(
  folderId: string,
  isPublic: boolean,
): Promise<ProjectActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_folders")
    .update({ is_public: isPublic })
    .eq("id", folderId)
    .select("id, parent_folder_id")
    .returns<{ id: string; parent_folder_id: string | null }[]>();

  if (error) return { error: await friendlyDbError(error.message) };
  const row = data?.[0];
  if (!row) return { error: t.projects.errors.notAuthorized };

  revalidateFolder(folderId, row.parent_folder_id);
  return {};
}

export async function moveProjectFolder(
  folderId: string,
  newParentId: string,
): Promise<ProjectActionResult> {
  const { t } = await getT();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("project_folders")
    .select("parent_folder_id")
    .eq("id", folderId)
    .limit(1)
    .returns<{ parent_folder_id: string | null }[]>();
  const previousParent = before?.[0]?.parent_folder_id ?? null;
  if (previousParent === newParentId) return {};

  const { data, error } = await supabase
    .from("project_folders")
    .update({ parent_folder_id: newParentId })
    .eq("id", folderId)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) return { error: await friendlyDbError(error.message) };
  if (!data || data.length === 0) return { error: t.projects.errors.notAuthorized };

  const driveWarning = await syncProjectFolderMove(supabase, folderId);
  revalidateFolder(folderId, newParentId);
  if (previousParent) revalidatePath(`/projects/${previousParent}`);
  return { driveWarning };
}

/**
 * Only an empty folder can be deleted — no subfolders, no photos — so
 * nothing in Drive is ever removed except the (empty) folder itself.
 */
export async function deleteProjectFolder(folderId: string): Promise<ProjectActionResult> {
  const { t } = await getT();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("project_folder_summary")
    .select("id, parent_folder_id, drive_folder_id, child_count, photo_count")
    .eq("id", folderId)
    .limit(1)
    .returns<
      {
        id: string;
        parent_folder_id: string | null;
        drive_folder_id: string | null;
        child_count: number;
        photo_count: number;
      }[]
    >();
  const folder = rows?.[0];
  if (!folder) return { error: t.projects.errors.notFound };
  if (folder.child_count > 0 || folder.photo_count > 0) {
    return { error: t.projects.errors.notEmpty };
  }

  const { data, error } = await supabase
    .from("project_folders")
    .delete()
    .eq("id", folderId)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) return { error: await friendlyDbError(error.message) };
  if (!data || data.length === 0) return { error: t.projects.errors.notAuthorized };

  const driveWarning = await deleteProjectDriveFolder(folder.drive_folder_id);
  revalidateFolder(null, folder.parent_folder_id);
  return { driveWarning, folderId: folder.parent_folder_id ?? undefined };
}

export async function setProjectCoverPhoto(
  folderId: string,
  attachmentId: string | null,
): Promise<ProjectActionResult> {
  const { t } = await getT();
  const supabase = await createClient();

  if (attachmentId) {
    const { data: photo } = await supabase
      .from("attachments")
      .select("id")
      .eq("id", attachmentId)
      .eq("owner_type", "project")
      .eq("owner_id", folderId)
      .limit(1)
      .returns<{ id: string }[]>();
    if (!photo?.[0]) return { error: t.projects.errors.photoNotFound };
  }

  const { data, error } = await supabase
    .from("project_folders")
    .update({ cover_attachment_id: attachmentId })
    .eq("id", folderId)
    .select("id, parent_folder_id")
    .returns<{ id: string; parent_folder_id: string | null }[]>();

  if (error) return { error: await friendlyDbError(error.message) };
  const row = data?.[0];
  if (!row) return { error: t.projects.errors.notAuthorized };

  revalidateFolder(folderId, row.parent_folder_id);
  return {};
}

export async function updateProjectPhotoCaption(
  folderId: string,
  attachmentId: string,
  formData: FormData,
): Promise<ProjectActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .update({ caption: str(formData, "caption") })
    .eq("id", attachmentId)
    .eq("owner_type", "project")
    .eq("owner_id", folderId)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: t.projects.errors.notAuthorized };

  revalidatePath(`/projects/${folderId}`);
  return {};
}

export async function deleteProjectPhoto(
  folderId: string,
  attachmentId: string,
): Promise<ProjectActionResult> {
  const { t } = await getT();
  const supabase = await createClient();

  const { data: rows, error: selectError } = await supabase
    .from("attachments")
    .select("id, drive_file_id")
    .eq("id", attachmentId)
    .eq("owner_type", "project")
    .eq("owner_id", folderId)
    .limit(1)
    .returns<{ id: string; drive_file_id: string }[]>();

  const photo = rows?.[0];
  if (selectError || !photo) {
    return { error: selectError?.message ?? t.projects.errors.photoNotFound };
  }

  // cover_attachment_id is `on delete set null` (0034), so a deleted cover
  // simply falls back to the newest photo in the summary view.
  const { error: deleteError } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);
  if (deleteError) return { error: deleteError.message };

  try {
    await getDriveClient().deleteFile(photo.drive_file_id);
  } catch {
    // The row is gone; an orphaned Drive file is a minor cleanup, not a
    // failed action (same tradeoff as deleteMaintenanceAttachment).
  }

  const { data: folder } = await supabase
    .from("project_folders")
    .select("parent_folder_id")
    .eq("id", folderId)
    .limit(1)
    .returns<{ parent_folder_id: string | null }[]>();
  revalidateFolder(folderId, folder?.[0]?.parent_folder_id ?? null);
  return {};
}
