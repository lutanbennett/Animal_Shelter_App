import "server-only";

/**
 * The Pi's disk cache of sized public photos (docs/decisions/
 * 2026-10-01-public-photo-sizing.md).
 *
 * `<PHOTO_CACHE_DIR>/<fileId>/<width>.jpg|png`, written by the photo route
 * after Drive has produced a rendition and only for a file
 * `is_public_drive_file` approved. It is an optimisation and nothing more:
 *  - Off unless PHOTO_CACHE_DIR is set, which only the Pi's service unit
 *    does. The Worker (the fallback when the tunnel is down) and `next dev`
 *    have no such variable and no disk, so every function here is a no-op
 *    there and the route goes to Drive exactly as before.
 *  - Every operation swallows its own errors. A full disk, a permissions
 *    slip or an emptied folder costs one Drive round trip, never a failed
 *    request.
 *  - Disposable: not backed up, safe to delete at any time, size-capped
 *    with oldest-written-first eviction. Drive stays the source of truth.
 *
 * A Drive file id never changes its bytes (a replaced photo is a new
 * upload with a new id), so there is nothing to refresh; deleting or
 * trashing a file purges its folder (drive.ts) and anything that slips past
 * is evicted by age. Whether a cached photo may still be *served* is the
 * route's question, asked of the database before this is read.
 */

const DEFAULT_MAX_MB = 1024;
// Sweep at most this often, or sooner once this much has been written.
const SWEEP_EVERY_MS = 10 * 60 * 1000;
const SWEEP_AFTER_BYTES = 64 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png" };
const CONTENT_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png" };

let lastSweep = 0;
let writtenSinceSweep = 0;

function cacheDir(): string | null {
  const dir = process.env.PHOTO_CACHE_DIR?.trim();
  return dir ? dir : null;
}

export function photoCacheMaxBytes(): number {
  const mb = Number(process.env.PHOTO_CACHE_MAX_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_MAX_MB) * 1024 * 1024;
}

async function loadFs() {
  const [fs, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  return { fs, path };
}

export type CachedPhoto = { contentType: string; body: Buffer };

export async function readCachedPhoto(fileId: string, width: number): Promise<CachedPhoto | null> {
  const dir = cacheDir();
  if (!dir) return null;
  try {
    const { fs, path } = await loadFs();
    for (const ext of Object.keys(CONTENT_TYPES)) {
      try {
        const body = await fs.readFile(path.join(dir, fileId, `${width}.${ext}`));
        return { contentType: CONTENT_TYPES[ext], body };
      } catch {
        // Not this extension.
      }
    }
  } catch {
    // No filesystem (a Worker), or an unreadable folder: act as a miss.
  }
  return null;
}

export async function writeCachedPhoto(
  fileId: string,
  width: number,
  contentType: string,
  body: ArrayBuffer,
): Promise<void> {
  const dir = cacheDir();
  const ext = EXTENSIONS[contentType.split(";")[0].trim().toLowerCase()];
  if (!dir || !ext) return;
  try {
    const { fs, path } = await loadFs();
    const folder = path.join(dir, fileId);
    await fs.mkdir(folder, { recursive: true });
    const target = path.join(folder, `${width}.${ext}`);
    const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temp, Buffer.from(body));
    await fs.rename(temp, target);

    writtenSinceSweep += body.byteLength;
    if (writtenSinceSweep >= SWEEP_AFTER_BYTES || Date.now() - lastSweep >= SWEEP_EVERY_MS) {
      void sweepPhotoCache();
    }
  } catch {
    // Disposable: a failed write is a future miss.
  }
}

/** Remove every cached size of a file. Best effort; a no-op off the Pi. */
export async function purgeCachedPhoto(fileId: string): Promise<void> {
  const dir = cacheDir();
  if (!dir || !/^[A-Za-z0-9_-]{10,100}$/.test(fileId)) return;
  try {
    const { fs, path } = await loadFs();
    await fs.rm(path.join(dir, fileId), { recursive: true, force: true });
  } catch {
    // Nothing to purge, or no filesystem.
  }
}

/**
 * Delete the oldest-written files until the folder is under 90% of the cap
 * (the headroom keeps the next write from triggering another sweep).
 */
export async function sweepPhotoCache(): Promise<void> {
  const dir = cacheDir();
  if (!dir) return;
  lastSweep = Date.now();
  writtenSinceSweep = 0;
  try {
    const { fs, path } = await loadFs();
    const files: { file: string; size: number; mtime: number }[] = [];
    for (const folder of await fs.readdir(dir, { withFileTypes: true })) {
      if (!folder.isDirectory()) continue;
      for (const name of await fs.readdir(path.join(dir, folder.name))) {
        const file = path.join(dir, folder.name, name);
        try {
          const stat = await fs.stat(file);
          files.push({ file, size: stat.size, mtime: stat.mtimeMs });
        } catch {
          // Removed under us.
        }
      }
    }
    let total = files.reduce((sum, f) => sum + f.size, 0);
    const cap = photoCacheMaxBytes();
    if (total <= cap) return;
    files.sort((a, b) => a.mtime - b.mtime);
    for (const f of files) {
      if (total <= cap * 0.9) break;
      await fs.rm(f.file, { force: true });
      total -= f.size;
      // Drop the file's folder once empty; rmdir refuses a non-empty one.
      await fs.rmdir(path.dirname(f.file)).catch(() => {});
    }
  } catch {
    // Try again at the next sweep.
  }
}
