import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * Browser half of a video upload (docs/decisions/2026-10-20-videos-uploaded-straight-to-drive.md): ask the app to
 * open a Drive resumable session, send the file to Drive in chunks, then tell the app the new file id.
 *
 * Chunks are a multiple of 256 KiB, as Drive requires for every chunk but the last. After a dropped connection
 * (or a 5xx) the upload asks Drive how many bytes it holds and carries on from there, so a clip sent over a
 * weak connection on site does not start again from nothing.
 */

const CHUNK_BYTES = 8 * 1024 * 1024; // 32 x 256 KiB
const MAX_RETRIES_IN_A_ROW = 6;

export type VideoUploadResult = { error?: string };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** How many bytes Drive says it holds, from a 308 response's Range header ("bytes=0-12345"). */
function bytesHeld(res: Response): number {
  const range = res.headers.get("range");
  const match = range ? /bytes=0-(\d+)/.exec(range) : null;
  return match ? Number(match[1]) + 1 : 0;
}

/** Length of a video in milliseconds, read from its metadata; null when the browser cannot tell. */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      done(Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration * 1000) : null);
    video.onerror = () => done(null);
    setTimeout(() => done(null), 5000);
    video.src = url;
  });
}

export async function uploadResidentVideo(
  t: Dictionary,
  residentId: string,
  file: File,
  fields: { dateTaken: string; category: string },
  onProgress: (percent: number) => void,
  onRetrying: (retrying: boolean) => void,
): Promise<VideoUploadResult> {
  const messages = t.photos.videos.errors;
  const base = `/api/residents/${residentId}/videos`;

  async function post(path: string, payload: unknown) {
    const res = await fetch(`${base}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, json };
  }

  try {
    const started = await post("start", {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      category: fields.category,
      dateTaken: fields.dateTaken,
    });
    if (!started.ok) return { error: typeof started.json.error === "string" ? started.json.error : messages.failed };
    const { uploadId, uploadUrl } = started.json as { uploadId: string; uploadUrl: string };

    let offset = 0;
    let failures = 0;
    let driveFileId: string | null = null;
    while (driveFileId === null) {
      const end = Math.min(offset + CHUNK_BYTES, file.size);
      let res: Response | null = null;
      try {
        res = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Range": `bytes ${offset}-${end - 1}/${file.size}` },
          body: file.slice(offset, end),
        });
      } catch {
        res = null; // dropped connection
      }

      if (res && (res.status === 200 || res.status === 201)) {
        driveFileId = ((await res.json()) as { id: string }).id;
        onProgress(100);
      } else if (res && res.status === 308) {
        failures = 0;
        onRetrying(false);
        // A chunk Drive accepted whole is held whole, even if the browser may not read its Range header.
        offset = res.headers.get("range") ? bytesHeld(res) : end;
        onProgress(Math.round((offset / file.size) * 100));
      } else if (res === null || res.status >= 500 || res.status === 429) {
        failures += 1;
        if (failures > MAX_RETRIES_IN_A_ROW) return { error: messages.failed };
        onRetrying(true);
        await sleep(Math.min(1000 * 2 ** failures, 20000));
        // Ask Drive where it got to; if even that fails the loop tries again.
        try {
          const probe = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Range": `bytes */${file.size}` } });
          if (probe.status === 308) offset = bytesHeld(probe);
          else if (probe.status === 200 || probe.status === 201) {
            driveFileId = ((await probe.json()) as { id: string }).id;
          }
        } catch {
          // still offline: next lap
        }
      } else {
        return { error: messages.failed };
      }
    }

    onRetrying(false);
    const durationMs = await readVideoDuration(file);
    const finished = await post("finish", { uploadId, driveFileId, dateTaken: fields.dateTaken, durationMs });
    if (!finished.ok) return { error: typeof finished.json.error === "string" ? finished.json.error : messages.failed };
    return {};
  } catch {
    return { error: t.photos.uploader.networkError };
  }
}
