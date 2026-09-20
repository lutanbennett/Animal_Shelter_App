import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DriveApiError,
  ensureProjectFolderPath,
  getDriveClient,
  moveProjectDriveFolder,
  renameProjectDriveFolder,
  type DriveClient,
  type ProjectFolderChain,
} from "@/lib/google/drive";

type ChainRow = {
  id: string;
  name: string;
  parent_folder_id: string | null;
  drive_folder_id: string | null;
};

/** The folder and its ancestors, root (category) first. */
async function loadChain(supabase: SupabaseClient, folderId: string): Promise<ProjectFolderChain> {
  const chain: ProjectFolderChain = [];
  let cursor: string | null = folderId;
  for (let depth = 0; cursor && depth < 32; depth += 1) {
    const result: { data: ChainRow[] | null } = await supabase
      .from("project_folders")
      .select("id, name, parent_folder_id, drive_folder_id")
      .eq("id", cursor)
      .limit(1)
      .returns<ChainRow[]>();
    const row = result.data?.[0];
    if (!row) throw new Error("Project folder not found.");
    chain.unshift({ id: row.id, name: row.name, drive_folder_id: row.drive_folder_id });
    cursor = row.parent_folder_id;
  }
  return chain;
}

/**
 * Writes newly-resolved Drive IDs back to their rows. Best effort: a
 * volunteer's upload can't update project_folders (RLS), so their first
 * upload into a fresh folder leaves the cache empty and the next staff
 * write fills it — the folder is found by name in the meantime.
 */
async function cacheDriveIds(supabase: SupabaseClient, resolved: Map<string, string>) {
  for (const [id, driveFolderId] of resolved) {
    await supabase.from("project_folders").update({ drive_folder_id: driveFolderId }).eq("id", id);
  }
}

/**
 * The Drive folder a project folder's files go in, creating the path
 * Projects/<Category>/<…>/ as needed. Cached IDs are trusted; if the
 * target's cached folder turns out to have been deleted by hand in Drive,
 * the cache for it is cleared and the path re-resolved by name once.
 */
export async function ensureProjectDriveFolder(
  supabase: SupabaseClient,
  drive: DriveClient,
  folderId: string,
): Promise<string> {
  const chain = await loadChain(supabase, folderId);
  const { folderId: driveFolderId, resolvedIds } = await ensureProjectFolderPath(drive, chain);
  await cacheDriveIds(supabase, resolvedIds);

  const target = chain[chain.length - 1];
  if (!target.drive_folder_id) return driveFolderId;

  // A cached target: confirm it still exists before uploading into it.
  try {
    await drive.getFile(driveFolderId, "id");
    return driveFolderId;
  } catch (error) {
    if (!(error instanceof DriveApiError) || error.status !== 404) throw error;
  }

  const retry = await ensureProjectFolderPath(drive, [
    ...chain.slice(0, -1),
    { ...target, drive_folder_id: null },
  ]);
  await cacheDriveIds(supabase, retry.resolvedIds);
  return retry.folderId;
}

/**
 * After a rename: rename the Drive folder to match. Returns a warning
 * rather than throwing — the row is already saved and is the source of
 * truth; Drive catches up on the next sync.
 */
export async function syncProjectFolderRename(
  supabase: SupabaseClient,
  folderId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("project_folders")
    .select("id, name, parent_folder_id, drive_folder_id")
    .eq("id", folderId)
    .limit(1)
    .returns<ChainRow[]>();
  const row = data?.[0];
  if (!row?.drive_folder_id) return null;

  try {
    await renameProjectDriveFolder(getDriveClient(), row.drive_folder_id, row.name);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Could not rename the Drive folder.";
  }
}

/**
 * After a move: put the Drive folder under the new parent's Drive folder
 * (creating the parent's path if it has never been synced). A folder that
 * has never had a file has no Drive folder and nothing to move.
 */
export async function syncProjectFolderMove(
  supabase: SupabaseClient,
  folderId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("project_folders")
    .select("id, name, parent_folder_id, drive_folder_id")
    .eq("id", folderId)
    .limit(1)
    .returns<ChainRow[]>();
  const row = data?.[0];
  if (!row?.drive_folder_id || !row.parent_folder_id) return null;

  try {
    const drive = getDriveClient();
    const parentDriveId = await ensureProjectDriveFolder(supabase, drive, row.parent_folder_id);
    await moveProjectDriveFolder(drive, row.drive_folder_id, parentDriveId);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Could not move the Drive folder.";
  }
}

/**
 * After deleting an (empty) folder row: remove its Drive folder too, if
 * one was ever created. Only empty folders can be deleted from the app,
 * so this never removes files.
 */
export async function deleteProjectDriveFolder(driveFolderId: string | null): Promise<string | null> {
  if (!driveFolderId) return null;
  try {
    await getDriveClient().deleteFile(driveFolderId);
    return null;
  } catch (error) {
    if (error instanceof DriveApiError && error.status === 404) return null;
    return error instanceof Error ? error.message : "Could not delete the Drive folder.";
  }
}
