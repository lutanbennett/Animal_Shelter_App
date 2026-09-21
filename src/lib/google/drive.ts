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
 * Deliberately talks to the Drive REST API with plain `fetch` rather than
 * the `googleapis` SDK. The SDK's HTTP layer (gaxios, on top of Node's
 * `http`/`zlib`) doesn't work on the Cloudflare Workers runtime this app
 * deploys to — the refresh-token exchange came back corrupted there, which
 * is what forced the 2026-09-19 demo onto Vercel instead. The handful of
 * endpoints this app needs (list/create/get/download/delete) are simple
 * enough that a direct client is less code than the adapter would be, and
 * it works identically under `next dev` on Node. `googleapis` remains a
 * devDependency only for the one-off local setup scripts in scripts/.
 *
 * Required env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
 * GOOGLE_OAUTH_REFRESH_TOKEN. See .env.example.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

/**
 * Thrown for any non-2xx response from Google. `status` is the HTTP status
 * so callers can distinguish e.g. a 404 (file gone) from a 429/5xx.
 */
export class DriveApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "DriveApiError";
  }
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: string | { message?: string };
      error_description?: string;
    };
    if (typeof body.error === "string") {
      // OAuth token endpoint shape: { error, error_description }.
      return body.error_description ? `${body.error}: ${body.error_description}` : body.error;
    }
    if (body.error?.message) return body.error.message;
  } catch {
    // Non-JSON error body — fall through.
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Access tokens
// ---------------------------------------------------------------------------

/**
 * Module-level access-token cache. Google access tokens last ~1h; refreshing
 * one per request would double the latency of every Drive call and eat into
 * the token endpoint's quota for no benefit. Module state survives across
 * requests within a Workers isolate (and a Node process), and the worst case
 * on a cold start is simply one extra refresh. Concurrent callers on a cold
 * cache share a single in-flight refresh rather than each minting a token.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingRefresh: Promise<string> | null = null;

// Refresh a minute early so a token can't expire mid-request.
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

async function fetchAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
      refresh_token: requireEnv("GOOGLE_OAUTH_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new DriveApiError(
      `Google OAuth token refresh failed: ${await readErrorMessage(res, res.statusText)}`,
      res.status,
    );
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new DriveApiError("Google OAuth token refresh returned no access token.", 502);
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - TOKEN_EXPIRY_MARGIN_MS,
  };
  return data.access_token;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  if (!pendingRefresh) {
    pendingRefresh = fetchAccessToken().finally(() => {
      pendingRefresh = null;
    });
  }
  return pendingRefresh;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export type DriveFile = {
  id: string;
  name?: string;
  mimeType?: string;
  createdTime?: string;
  parents?: string[];
};

export type DriveDownload = {
  contentType: string;
  body: ArrayBuffer;
};

/**
 * Thin authenticated wrapper over the Drive v3 REST API, exposing only the
 * operations this app uses. Instances are cheap (no state beyond the shared
 * token cache above), so `getDriveClient()` per request is fine.
 */
export class DriveClient {
  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await getAccessToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      throw new DriveApiError(
        `Drive API ${init.method ?? "GET"} ${new URL(url).pathname} failed: ${await readErrorMessage(res, res.statusText)}`,
        res.status,
      );
    }
    return res;
  }

  /** `files.list` — see https://developers.google.com/drive/api/reference/rest/v3/files/list */
  async listFiles(params: {
    q: string;
    fields: string;
    orderBy?: string;
    pageSize?: number;
  }): Promise<DriveFile[]> {
    const search = new URLSearchParams({
      q: params.q,
      fields: params.fields,
      spaces: "drive",
    });
    if (params.orderBy) search.set("orderBy", params.orderBy);
    if (params.pageSize) search.set("pageSize", String(params.pageSize));

    const res = await this.request(`${DRIVE_API}/files?${search}`);
    const data = (await res.json()) as { files?: DriveFile[] };
    return data.files ?? [];
  }

  /** Metadata-only `files.create`, used for folders. */
  async createFolder(name: string, parentId: string): Promise<DriveFile> {
    const res = await this.request(`${DRIVE_API}/files?fields=id`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME_TYPE, parents: [parentId] }),
    });
    return (await res.json()) as DriveFile;
  }

  /**
   * Multipart `files.create` (metadata + content in one request), the
   * documented upload path for files under ~5MB — plenty for the photos and
   * scanned lab reports this app handles. The body is assembled as a Blob so
   * binary content is passed through untouched, with no Node `Buffer` or
   * `stream` dependency.
   */
  async uploadFile(params: {
    name: string;
    mimeType: string;
    parentId: string;
    content: Blob | ArrayBuffer | Uint8Array;
  }): Promise<DriveFile> {
    const boundary = `drive-multipart-${crypto.randomUUID()}`;
    const body = new Blob([
      `--${boundary}\r\n` +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify({ name: params.name, parents: [params.parentId] }) +
        "\r\n",
      `--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`,
      params.content as BlobPart,
      `\r\n--${boundary}--`,
    ]);

    const res = await this.request(
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id`,
      {
        method: "POST",
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
        body,
      },
    );
    return (await res.json()) as DriveFile;
  }

  /**
   * Media-only `files.update` — replaces a file's bytes, keeping its ID (and
   * so every link and stored reference to it). Used to regenerate the
   * deceased archive's summary PDF / index page in place rather than
   * littering the folder with dated copies.
   */
  async updateFileContent(params: {
    fileId: string;
    mimeType: string;
    content: Blob | ArrayBuffer | Uint8Array;
  }): Promise<DriveFile> {
    const res = await this.request(
      `${DRIVE_UPLOAD_API}/files/${encodeURIComponent(params.fileId)}?uploadType=media&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": params.mimeType },
        body: params.content as BodyInit,
      },
    );
    return (await res.json()) as DriveFile;
  }

  /**
   * Metadata `files.update` with addParents/removeParents — Drive's "move".
   * The file keeps its ID, which is why storing Drive IDs rather than paths
   * survives the deceased-archive move (requirements doc, Section 5.2).
   */
  async moveFile(params: {
    fileId: string;
    addParents: string;
    removeParents?: string;
    /** Rename in the same request — a maintenance job's folder tracks its title. */
    name?: string;
  }): Promise<DriveFile> {
    const search = new URLSearchParams({
      addParents: params.addParents,
      fields: "id, parents",
    });
    if (params.removeParents) search.set("removeParents", params.removeParents);

    const res = await this.request(
      `${DRIVE_API}/files/${encodeURIComponent(params.fileId)}?${search}`,
      params.name
        ? {
            method: "PATCH",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({ name: params.name }),
          }
        : { method: "PATCH" },
    );
    return (await res.json()) as DriveFile;
  }

  /** Metadata `files.update` changing only the name. */
  async renameFile(fileId: string, name: string): Promise<DriveFile> {
    const res = await this.request(
      `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ name }),
      },
    );
    return (await res.json()) as DriveFile;
  }

  /** `files.get` for metadata. */
  async getFile(fileId: string, fields: string): Promise<DriveFile> {
    const res = await this.request(
      `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}`,
    );
    return (await res.json()) as DriveFile;
  }

  /**
   * `files.get` with `alt=media` — the file's bytes. Unlike the old SDK
   * path, `fetch` exposes the response headers, so the content type comes
   * back from the same request rather than needing a second metadata call.
   */
  async downloadFile(fileId: string): Promise<DriveDownload> {
    const res = await this.request(
      `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`,
    );
    return {
      contentType: res.headers.get("content-type") || "application/octet-stream",
      body: await res.arrayBuffer(),
    };
  }

  /** `files.delete` — permanent, skips the trash. */
  async deleteFile(fileId: string): Promise<void> {
    await this.request(`${DRIVE_API}/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    });
  }
}

export function getDriveClient(): DriveClient {
  return new DriveClient();
}

// ---------------------------------------------------------------------------
// Folder-tree helpers
// ---------------------------------------------------------------------------

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
  drive: DriveClient,
  parentId: string,
  name: string,
): Promise<string> {
  const escapedName = name.replace(/'/g, "\\'");
  const files = await drive.listFiles({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime",
  });

  const existing = files[0]?.id;
  if (existing) return existing;

  const created = await drive.createFolder(name, parentId);
  if (!created.id) {
    throw new Error(`Failed to create Drive folder "${name}".`);
  }
  return created.id;
}

/** Top-level folder under GOOGLE_DRIVE_ROOT_FOLDER_ID holding every resident. */
const RESIDENTS_FOLDER = "Residents";

/**
 * Where a resident's folder is moved once they die — `Residents/Deceased/`,
 * the legacy convention the old Apps Script polling trigger
 * (`archiveDeceasedResidentFolders`) maintained (requirements doc, Section
 * 5.1). Staff navigate this in Drive by hand, so the name is fixed.
 */
const DECEASED_ARCHIVE_FOLDER = "Deceased";

/**
 * "<Name> (<ID>)" — the per-resident folder name staff already know.
 * Slashes can't appear in a Drive path segment, so they become hyphens.
 */
function residentFolderName(resident: { name: string; resident_code: string }): string {
  return `${resident.name.trim().replace(/\//g, "-")} (${resident.resident_code})`;
}

/**
 * Resolves the Drive folder ID for a resident's "<Name> (<ID>)" folder,
 * reusing the cached resident.drive_folder_id when present instead of
 * searching Drive by name on every call. Shared by every per-resident
 * subtree (Photos, Blood Tests, ...) so the residentFolderId-resolution
 * logic — and its cache-write-back responsibility — lives in one place.
 */
async function ensureResidentFolder(
  drive: DriveClient,
  resident: { name: string; resident_code: string; drive_folder_id: string | null },
): Promise<{ residentFolderId: string; isNewResidentFolder: boolean }> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  }

  if (resident.drive_folder_id) {
    return { residentFolderId: resident.drive_folder_id, isNewResidentFolder: false };
  }

  const residentsRootId = await findOrCreateFolder(drive, rootId, RESIDENTS_FOLDER);
  const residentFolderId = await findOrCreateFolder(
    drive,
    residentsRootId,
    residentFolderName(resident),
  );
  return { residentFolderId, isNewResidentFolder: true };
}

/**
 * Ensures Residents/<Name> (<ID>)/Photos/<Category>/<YYMM>/ exists for a
 * resident (the Category/YYMM subfolders are looked up each call — cheap,
 * and there are far fewer of them than uploads).
 */
export async function ensureResidentPhotosFolder(
  drive: DriveClient,
  resident: { name: string; resident_code: string; drive_folder_id: string | null },
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
  drive: DriveClient,
  resident: { name: string; resident_code: string; drive_folder_id: string | null },
  yyyymmdd: string,
): Promise<{ residentFolderId: string; uploadFolderId: string; isNewResidentFolder: boolean }> {
  const { residentFolderId, isNewResidentFolder } = await ensureResidentFolder(drive, resident);

  const bloodTestsFolderId = await findOrCreateFolder(drive, residentFolderId, "Blood Tests");
  const uploadFolderId = await findOrCreateFolder(drive, bloodTestsFolderId, yyyymmdd);

  return { residentFolderId, uploadFolderId, isNewResidentFolder };
}

/**
 * "<Type> <YYYYMMDD>" — the per-procedure folder name under Procedures/
 * (requirements doc, Section 5.1). Slashes can't appear in a Drive path
 * segment, so a type like "Spay / neuter" becomes "Spay - neuter".
 */
export function procedureFolderName(typeName: string, yyyymmdd: string): string {
  return `${typeName.trim().replace(/\//g, "-")} ${yyyymmdd}`;
}

/**
 * Ensures Residents/<Name> (<ID>)/Procedures/<Type> <YYYYMMDD>/ exists for
 * a resident — one folder per procedure, so an X-ray's images and the
 * discharge notes from the same day sit together, and two procedures on
 * the same date don't mix.
 */
export async function ensureResidentProcedureFolder(
  drive: DriveClient,
  resident: { name: string; resident_code: string; drive_folder_id: string | null },
  folderName: string,
): Promise<{ residentFolderId: string; uploadFolderId: string; isNewResidentFolder: boolean }> {
  const { residentFolderId, isNewResidentFolder } = await ensureResidentFolder(drive, resident);

  const proceduresFolderId = await findOrCreateFolder(drive, residentFolderId, "Procedures");
  const uploadFolderId = await findOrCreateFolder(drive, proceduresFolderId, folderName);

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
 * `content` can be the uploaded `File` itself (a Blob) — no need to buffer
 * it first.
 *
 * Note: files uploaded before this change are still "anyone with the
 * link" — revoking those permissions retroactively is a separate cleanup
 * task, not done here.
 */
export async function uploadImageToFolder(
  drive: DriveClient,
  folderId: string,
  file: { name: string; mimeType: string; content: Blob | ArrayBuffer | Uint8Array },
): Promise<string> {
  const created = await drive.uploadFile({
    name: file.name,
    mimeType: file.mimeType,
    parentId: folderId,
    content: file.content,
  });

  if (!created.id) {
    throw new Error("Failed to upload file to Drive.");
  }

  return created.id;
}

// ---------------------------------------------------------------------------
// Enclosure maintenance
// ---------------------------------------------------------------------------

/**
 * Where maintenance files live:
 *
 *   Projects/Shelter Projects/Enclosure Maintenance/<Zone>/<Enclosure>/<Status>/<M-0001 Title>/<file>
 *
 * The layout was set by the user so that staff can browse jobs in Drive by
 * where they are and what state they're in. A zone-wide job (no enclosure)
 * sits under a fixed "Zone-wide" segment in place of the enclosure name so
 * every job folder is the same depth.
 */
const MAINTENANCE_PATH = ["Projects", "Shelter Projects", "Enclosure Maintenance"];
const ZONE_WIDE_FOLDER = "Zone-wide";

/** A Drive path segment: slashes aren't allowed, and trailing space isn't kept. */
function driveSegment(name: string): string {
  return name.trim().replace(/\//g, "-") || "—";
}

/** "M-0001 Fix gate latch" — the job's own folder. */
export function maintenanceJobFolderName(job: { job_code: string; title: string }): string {
  return driveSegment(`${job.job_code} ${job.title}`);
}

export type MaintenanceFolderJob = {
  job_code: string;
  title: string;
  status: string;
  zone_name: string;
  enclosure_name: string | null;
  drive_folder_id: string | null;
};

/**
 * Makes sure the job's folder exists and sits under the right
 * .../<Zone>/<Enclosure>/<Status>/ for the job as it is *now*, moving (and
 * renaming) it if it doesn't. Called on every upload and every status
 * change, so a move that failed mid-way — Drive 5xx after the database was
 * updated — is put right by whichever comes next: the folder's current
 * parents are read from Drive rather than assumed from the old status.
 *
 * Returns `isNew` when a folder was created, so the caller can cache its ID
 * on the row the way residents.drive_folder_id is.
 */
export async function syncMaintenanceJobFolder(
  drive: DriveClient,
  job: MaintenanceFolderJob,
): Promise<{ folderId: string; isNew: boolean }> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  }

  let parentId = rootId;
  for (const segment of [
    ...MAINTENANCE_PATH,
    driveSegment(job.zone_name),
    job.enclosure_name ? driveSegment(job.enclosure_name) : ZONE_WIDE_FOLDER,
    job.status,
  ]) {
    parentId = await findOrCreateFolder(drive, parentId, segment);
  }
  const statusFolderId = parentId;
  const name = maintenanceJobFolderName(job);

  if (job.drive_folder_id) {
    let existing: DriveFile | null = null;
    try {
      existing = await drive.getFile(job.drive_folder_id, "id, name, parents");
    } catch (error) {
      // Deleted by hand in Drive: fall through and create a fresh one.
      if (!(error instanceof DriveApiError) || error.status !== 404) throw error;
    }

    if (existing) {
      const parents = existing.parents ?? [];
      const inPlace = parents.includes(statusFolderId);
      if (inPlace) {
        if (existing.name !== name) await drive.renameFile(existing.id, name);
      } else {
        await drive.moveFile({
          fileId: existing.id,
          addParents: statusFolderId,
          removeParents: parents.join(","),
          name: existing.name === name ? undefined : name,
        });
      }
      return { folderId: existing.id, isNew: false };
    }
  }

  const folderId = await findOrCreateFolder(drive, statusFolderId, name);
  return { folderId, isNew: true };
}

// ---------------------------------------------------------------------------
// Deceased archive
// ---------------------------------------------------------------------------

/**
 * Moves a resident's folder from `Residents/` to `Residents/Deceased/`,
 * creating either folder (and the resident's own, for a resident that never
 * had a file uploaded) if it doesn't exist yet.
 *
 * A Drive move re-parents the folder rather than copying it, so the folder —
 * and every file inside it — keeps its ID. Nothing stored in the database
 * needs rewriting, and every photo already on a resident page keeps
 * resolving through the image proxy after the move. That's precisely why
 * the requirements doc (Section 5.2) says to store Drive IDs, not paths.
 *
 * Safe to re-run: a folder already sitting in the archive is left alone, so
 * a retry after a half-finished archive (Drive 5xx between the move and the
 * uploads) doesn't move anything twice.
 */
export async function moveResidentFolderToDeceasedArchive(
  drive: DriveClient,
  resident: { name: string; resident_code: string; drive_folder_id: string | null },
): Promise<{ residentFolderId: string; archiveFolderId: string; alreadyArchived: boolean }> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  }

  const residentsRootId = await findOrCreateFolder(drive, rootId, RESIDENTS_FOLDER);
  const archiveFolderId = await findOrCreateFolder(
    drive,
    residentsRootId,
    DECEASED_ARCHIVE_FOLDER,
  );

  // Look in the archive before the live tree: after a partial run the folder
  // can already be archived while the database never got told, and
  // ensureResidentFolder() would happily create a second, empty folder under
  // Residents/ in that case.
  const residentFolderId =
    resident.drive_folder_id ??
    (await findFolderByName(drive, archiveFolderId, residentFolderName(resident))) ??
    (await ensureResidentFolder(drive, resident)).residentFolderId;

  const folder = await drive.getFile(residentFolderId, "id, parents");
  const parents = folder.parents ?? [];
  if (parents.includes(archiveFolderId)) {
    return { residentFolderId, archiveFolderId, alreadyArchived: true };
  }

  await drive.moveFile({
    fileId: residentFolderId,
    addParents: archiveFolderId,
    removeParents: parents.join(","),
  });

  return { residentFolderId, archiveFolderId, alreadyArchived: false };
}

/**
 * The reverse of moveResidentFolderToDeceasedArchive(), for a death
 * recorded in error: Residents/Deceased/<Name> (<ID>)/ goes back under
 * Residents/. Same ID-first, then name-in-the-archive lookup, and the same
 * no-op when the folder is already where it should be — a retry after a
 * failed run must be safe. Returns null when there is no folder to move
 * (nothing was ever uploaded for this resident and the archive never got
 * as far as creating one).
 */
export async function moveResidentFolderOutOfDeceasedArchive(
  drive: DriveClient,
  resident: { name: string; resident_code: string; drive_folder_id: string | null },
): Promise<{ residentFolderId: string; wasArchived: boolean } | null> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  }

  const residentsRootId = await findOrCreateFolder(drive, rootId, RESIDENTS_FOLDER);
  const archiveFolderId = await findFolderByName(
    drive,
    residentsRootId,
    DECEASED_ARCHIVE_FOLDER,
  );

  const residentFolderId =
    resident.drive_folder_id ??
    (archiveFolderId
      ? await findFolderByName(drive, archiveFolderId, residentFolderName(resident))
      : null);
  if (!residentFolderId) return null;

  const folder = await drive.getFile(residentFolderId, "id, parents");
  const parents = folder.parents ?? [];
  if (!archiveFolderId || !parents.includes(archiveFolderId)) {
    return { residentFolderId, wasArchived: false };
  }

  await drive.moveFile({
    fileId: residentFolderId,
    addParents: residentsRootId,
    removeParents: parents.join(","),
  });

  return { residentFolderId, wasArchived: true };
}

/** Folder ID by exact name under a parent, or null. Never creates. */
async function findFolderByName(
  drive: DriveClient,
  parentId: string,
  name: string,
): Promise<string | null> {
  const escapedName = name.replace(/'/g, "\\'");
  const files = await drive.listFiles({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime",
  });
  return files[0]?.id ?? null;
}

/**
 * Writes a generated file (the deceased summary PDF, the offline index
 * page) into a folder, replacing the previous version in place where there
 * is one so regenerating an archive doesn't leave stale duplicates beside
 * it. Matches on the recorded file ID first, then on the file name — the
 * latter covers an archive whose first attempt uploaded the file but failed
 * before the ID was recorded.
 */
export async function upsertGeneratedFile(
  drive: DriveClient,
  folderId: string,
  file: {
    name: string;
    mimeType: string;
    content: Blob | ArrayBuffer | Uint8Array;
    existingFileId?: string | null;
  },
): Promise<string> {
  const existingId =
    file.existingFileId ?? (await findFileByName(drive, folderId, file.name));

  if (existingId) {
    try {
      await drive.updateFileContent({
        fileId: existingId,
        mimeType: file.mimeType,
        content: file.content,
      });
      return existingId;
    } catch (error) {
      // A recorded ID can point at a file someone deleted in Drive by hand.
      // Fall through to a fresh upload rather than failing the archive.
      if (!(error instanceof DriveApiError) || error.status !== 404) throw error;
    }
  }

  const created = await drive.uploadFile({
    name: file.name,
    mimeType: file.mimeType,
    parentId: folderId,
    content: file.content,
  });
  if (!created.id) {
    throw new Error(`Failed to upload "${file.name}" to Drive.`);
  }
  return created.id;
}

/** Non-folder file ID by exact name under a parent, or null. */
async function findFileByName(
  drive: DriveClient,
  parentId: string,
  name: string,
): Promise<string | null> {
  const escapedName = name.replace(/'/g, "\\'");
  const files = await drive.listFiles({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType != '${FOLDER_MIME_TYPE}' and trashed = false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime",
  });
  return files[0]?.id ?? null;
}

export { driveImageUrl } from "./drive-client";

// ---------------------------------------------------------------------------
// Project folders
// ---------------------------------------------------------------------------

/**
 * Where project files live:
 *
 *   Projects/<Category>/<user folder>/<user folder…>/<file>
 *
 * The Drive tree mirrors the project_folders tree exactly — the user's
 * requirement is that staff can browse Drive and the app and see the same
 * folders. A category's folder ("Projects/Shelter Projects") is found by
 * name, never recreated, because maintenance already keeps its jobs under
 * Projects/Shelter Projects/Enclosure Maintenance/ (syncMaintenanceJobFolder).
 */
const PROJECTS_FOLDER = "Projects";

/** The Drive segment for a project folder — its name, made Drive-safe. */
export function projectFolderSegment(name: string): string {
  return driveSegment(name);
}

/**
 * A project folder with the chain of ancestors above it, root first
 * (category … parent). Each carries its cached Drive ID so a resolved
 * ancestor costs no Drive calls.
 */
export type ProjectFolderChain = {
  id: string;
  name: string;
  drive_folder_id: string | null;
}[];

/**
 * Ensures the Drive folder for the *last* entry in `chain` exists at
 * Projects/<each ancestor>/…, creating any missing level on the way down.
 * Returns the Drive IDs of every level that had none cached, so the caller
 * can write them back to the rows (each is a one-time lookup otherwise).
 *
 * A cached ID is trusted without a Drive round-trip — a Drive move or
 * rename keeps a folder's ID. A folder deleted by hand shows up as a 404
 * on the next upload; the caller (src/lib/projects/drive-sync.ts) clears
 * the cached ID and calls this again so the level is re-found by name.
 */
export async function ensureProjectFolderPath(
  drive: DriveClient,
  chain: ProjectFolderChain,
): Promise<{ folderId: string; resolvedIds: Map<string, string> }> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  }

  const resolvedIds = new Map<string, string>();
  let parentId = await findOrCreateFolder(drive, rootId, PROJECTS_FOLDER);

  for (const level of chain) {
    if (level.drive_folder_id) {
      parentId = level.drive_folder_id;
      continue;
    }
    parentId = await findOrCreateFolder(drive, parentId, projectFolderSegment(level.name));
    resolvedIds.set(level.id, parentId);
  }

  return { folderId: parentId, resolvedIds };
}

/**
 * Renames a project folder's Drive folder to match its row. A folder that
 * has never been synced (no cached ID) needs nothing — it will be created
 * under its current name on the first upload.
 */
export async function renameProjectDriveFolder(
  drive: DriveClient,
  driveFolderId: string,
  name: string,
): Promise<void> {
  await drive.renameFile(driveFolderId, projectFolderSegment(name));
}

/**
 * Moves a project folder's Drive folder under its new parent's Drive
 * folder. The folder keeps its ID, so nothing recorded against it (the
 * files inside, the cached ID on its own row) changes.
 */
export async function moveProjectDriveFolder(
  drive: DriveClient,
  driveFolderId: string,
  newParentDriveFolderId: string,
): Promise<void> {
  const existing = await drive.getFile(driveFolderId, "id, parents");
  const parents = existing.parents ?? [];
  if (parents.includes(newParentDriveFolderId)) return;
  await drive.moveFile({
    fileId: driveFolderId,
    addParents: newParentDriveFolderId,
    removeParents: parents.join(","),
  });
}
