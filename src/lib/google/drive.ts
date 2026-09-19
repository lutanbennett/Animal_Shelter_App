import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

/**
 * Google Drive access for the shelter's Google account.
 *
 * The requirements doc (Section 5.2) assumed a Google Workspace service
 * account with domain-wide delegation. The shelter's storage is a personal
 * Gmail account (lannacareforanimals@gmail.com in production; a dev account
 * during development — see docs/decisions.md), and domain-wide delegation
 * doesn't exist for personal accounts. Instead, this uses OAuth2 with a
 * refresh token obtained once (via the standard OAuth consent flow, run
 * manually against that Google account) and stored as an env var — the
 * server then acts as that account indefinitely without further per-user
 * OAuth friction.
 *
 * Required env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
 * GOOGLE_OAUTH_REFRESH_TOKEN. See .env.example.
 */
function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );

  client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  return client;
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getOAuthClient() });
}

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

/**
 * Finds a folder by exact name under a parent, creating it if it doesn't
 * exist. Used to build out the Residents/<Name> (<ID>)/Photos/ tree without
 * duplicating folders on repeated calls.
 *
 * If more than one match exists (e.g. two concurrent requests both created
 * one before either could see the other's), deterministically picks the
 * oldest rather than creating yet another — self-healing against races
 * instead of compounding them. The main defense against the race itself is
 * upstream (the upload UI sends files one at a time), since this
 * check-then-create can't be made fully atomic against Drive.
 */
export async function findOrCreateFolder(
  drive: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<string> {
  const escapedName = name.replace(/'/g, "\\'");
  const { data } = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime",
    spaces: "drive",
  });

  const existing = data.files?.[0]?.id;
  if (existing) return existing;

  const { data: created } = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME_TYPE,
      parents: [parentId],
    },
    fields: "id",
  });

  if (!created.id) {
    throw new Error(`Failed to create Drive folder "${name}".`);
  }
  return created.id;
}

/**
 * Resolves the Drive folder ID for a resident's "<Name> (<ID>)" folder,
 * reusing the cached resident.drive_folder_id when present instead of
 * searching Drive by name on every call. Shared by every per-resident
 * subtree (Photos, Blood Tests, ...) so the residentFolderId-resolution
 * logic — and its cache-write-back responsibility — lives in one place.
 */
async function ensureResidentFolder(
  drive: drive_v3.Drive,
  resident: { name: string; animal_code: string; drive_folder_id: string | null },
): Promise<{ residentFolderId: string; isNewResidentFolder: boolean }> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  }

  if (resident.drive_folder_id) {
    return { residentFolderId: resident.drive_folder_id, isNewResidentFolder: false };
  }

  const residentsRootId = await findOrCreateFolder(drive, rootId, "Residents");
  const folderName = `${resident.name.trim().replace(/\//g, "-")} (${resident.animal_code})`;
  const residentFolderId = await findOrCreateFolder(drive, residentsRootId, folderName);
  return { residentFolderId, isNewResidentFolder: true };
}

/**
 * Ensures Residents/<Name> (<ID>)/Photos/<Category>/<YYMM>/ exists for a
 * resident (the Category/YYMM subfolders are looked up each call — cheap,
 * and there are far fewer of them than uploads).
 */
export async function ensureResidentPhotosFolder(
  drive: drive_v3.Drive,
  resident: { name: string; animal_code: string; drive_folder_id: string | null },
  category: string,
  yymm: string,
): Promise<{ residentFolderId: string; uploadFolderId: string; isNewResidentFolder: boolean }> {
  const { residentFolderId, isNewResidentFolder } = await ensureResidentFolder(drive, resident);

  const photosFolderId = await findOrCreateFolder(drive, residentFolderId, "Photos");
  const categoryFolderId = await findOrCreateFolder(drive, photosFolderId, category);
  const uploadFolderId = await findOrCreateFolder(drive, categoryFolderId, yymm);

  return { residentFolderId, uploadFolderId, isNewResidentFolder };
}

/**
 * Ensures Residents/<Name> (<ID>)/Blood Tests/<YYYYMMDD>/ exists for a
 * resident — one folder per test date (not per month, unlike Photos),
 * matching the legacy Drive convention documented in the requirements doc
 * (Section 5.1) so a multi-page lab report uploaded in one batch lands
 * together.
 */
export async function ensureResidentBloodTestFolder(
  drive: drive_v3.Drive,
  resident: { name: string; animal_code: string; drive_folder_id: string | null },
  yyyymmdd: string,
): Promise<{ residentFolderId: string; uploadFolderId: string; isNewResidentFolder: boolean }> {
  const { residentFolderId, isNewResidentFolder } = await ensureResidentFolder(drive, resident);

  const bloodTestsFolderId = await findOrCreateFolder(drive, residentFolderId, "Blood Tests");
  const uploadFolderId = await findOrCreateFolder(drive, bloodTestsFolderId, yyyymmdd);

  return { residentFolderId, uploadFolderId, isNewResidentFolder };
}

/**
 * Uploads a file into a folder. Deliberately does NOT grant "anyone with
 * the link" access the way earlier versions of this function did — photos
 * are now only ever served through this app's own image proxy
 * (src/app/api/photos/[fileId]/route.ts, via driveImageUrl() in
 * drive-client.ts), which reads them with this same OAuth client. Keeping
 * files un-shared closes off the direct drive.google.com/thumbnail URL as
 * an access path entirely, so it can't be hit in a way that bypasses the
 * proxy's caching and re-trips Drive's undocumented per-file throttle (see
 * docs/decisions.md).
 *
 * Note: files uploaded before this change are still "anyone with the
 * link" — revoking those permissions retroactively is a separate cleanup
 * task, not done here.
 */
export async function uploadImageToFolder(
  drive: drive_v3.Drive,
  folderId: string,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<string> {
  const { data } = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [folderId],
    },
    media: {
      mimeType: file.mimeType,
      body: Readable.from(file.buffer),
    },
    fields: "id",
  });

  if (!data.id) {
    throw new Error("Failed to upload file to Drive.");
  }

  return data.id;
}

export { driveImageUrl } from "./drive-client";
