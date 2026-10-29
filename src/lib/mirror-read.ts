import "server-only";

/**
 * Read path onto the Pi's Drive mirror (scripts/pi/drive-mirror.mjs; docs/decisions/2026-10-29-pi-file-cache.md).
 *
 * The mirror copies the app's Drive tree to the encrypted drive: `<MIRROR_DEST>/<shelter>/<Drive path>`, with
 * `<MIRROR_DEST>/_mirror/state.json` mapping each Drive file id to `{ path, modifiedTime, gone? }`. This
 * module looks a file up by id in that index and returns its bytes. It is a cache, not a primary:
 *  - Off unless MIRROR_DEST is set, which only the Pi's service unit does. The Worker and `next dev` have
 *    no such variable, so every function here returns null and the caller goes to Drive as before.
 *  - It decides nothing about who may see a file. The caller has asked the database first; this holds bytes.
 *  - Every operation swallows its own errors. No index, an unmounted drive, a file gone from the disk, a
 *    path that leaves the mirror: all are a miss, costing one Drive round trip and never a failed request.
 *  - Read only: nothing here writes to the mirror, and nothing outside MIRROR_DEST is read.
 */

const SHELTER_DEFAULT = "lanna";
// What a mirrored file may be served as. Anything else is a miss (Drive then decides, as before).
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

type Entry = { path: string; modifiedTime?: string; gone?: string };
let indexCache: { mtimeMs: number; size: number; map: Record<string, Entry> } | null = null;

function mirrorDest(): string | null {
  const dir = process.env.MIRROR_DEST?.trim();
  return dir ? dir : null;
}

async function loadFs() {
  const [fs, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  return { fs, path };
}

export type MirroredFile = { contentType: string; body: Buffer };

export async function readMirroredFile(fileId: string): Promise<MirroredFile | null> {
  const dest = mirrorDest();
  if (!dest) return null;
  try {
    const { fs, path } = await loadFs();
    const statePath = path.join(dest, "_mirror", "state.json");
    const stat = await fs.stat(statePath);
    if (!indexCache || indexCache.mtimeMs !== stat.mtimeMs || indexCache.size !== stat.size) {
      indexCache = { mtimeMs: stat.mtimeMs, size: stat.size, map: JSON.parse(await fs.readFile(statePath, "utf8")) };
    }
    const entry = Object.prototype.hasOwnProperty.call(indexCache.map, fileId) ? indexCache.map[fileId] : null;
    if (!entry || typeof entry.path !== "string" || entry.gone) return null;

    const contentType = TYPES[path.extname(entry.path).toLowerCase()];
    if (!contentType) return null;

    const root = path.resolve(dest, process.env.MIRROR_SHELTER?.trim() || SHELTER_DEFAULT);
    const full = path.resolve(root, entry.path.replace(/^[\\/]+/, ""));
    if (!full.startsWith(root + path.sep)) return null;
    return { contentType, body: await fs.readFile(full) };
  } catch {
    // No index, nothing mounted, no filesystem (a Worker) or an unreadable file: a miss.
    return null;
  }
}

/** A mirrored original, shrunk to `width` for a sized request; null on any failure (the caller asks Drive). */
export async function resizeMirrored(
  file: MirroredFile,
  width: number,
  webp: boolean,
): Promise<MirroredFile | null> {
  if (!file.contentType.startsWith("image/") || file.contentType === "image/gif") return null;
  try {
    const sharp = (await import("sharp")).default;
    const pipeline = sharp(file.body, { failOn: "none" }).rotate().resize({ width, withoutEnlargement: true });
    return webp
      ? { contentType: "image/webp", body: await pipeline.webp({ quality: 80 }).toBuffer() }
      : { contentType: "image/jpeg", body: await pipeline.jpeg({ quality: 82 }).toBuffer() };
  } catch {
    return null;
  }
}
