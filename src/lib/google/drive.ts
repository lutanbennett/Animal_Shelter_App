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

/**
 * Resolves the Drive folder ID for a resident's "<Name> (<ID>)" folder,
 * reusing the cached resident.drive_folder_id when present instead of
 * searching Drive by name on every call. Shared by every per-resident
 * subtree (Photos, Blood Tests, ...) so the residentFolderId-resolution
 * logic — and its cache-write-back responsibility — lives in one place.
 */
async function ensureResidentFolder(
  drive: DriveClient,
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
  drive: DriveClient,
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
  drive: DriveClient,
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

export { driveImageUrl } from "./drive-client";
