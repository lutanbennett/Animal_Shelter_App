import "server-only";

/**
 * The photo on a public animal report (0377, docs/decisions/2026-11-14-report-animal-photo.md). The ONLY place the
 * public's file is read, checked and cleaned. Every limit here runs on the server: a stranger does not use our form.
 *
 * The type is read from the file's own first bytes (never its name or the browser's word), the picture is decoded and
 * re-encoded as a plain JPEG (so nothing that is not a picture survives, and every EXIF/GPS/device tag is dropped
 * because sharp writes no metadata unless asked), turned upright first so the strip does not lay it on its side, and
 * capped at 2000 px on the long side.
 */
export const PHOTO_MAX_RAW_BYTES = 8 * 1024 * 1024;
export const PHOTO_MAX_SIDE = 2000;
export const PHOTO_MAX_PIXELS = 50_000_000;

export type PhotoProblem = "photoType" | "photoTooBig" | "photoUnreadable";

const isJpeg = (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const isPng = (b: Uint8Array) => [0x89, 0x50, 0x4e, 0x47].every((x, i) => b[i] === x);
const isWebp = (b: Uint8Array) =>
  String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP";
export async function cleanPhoto(bytes: Uint8Array): Promise<{ ok: true; jpeg: Buffer } | { ok: false; problem: PhotoProblem }> {
  if (bytes.length > PHOTO_MAX_RAW_BYTES) return { ok: false, problem: "photoTooBig" };
  if (!(isJpeg(bytes) || isPng(bytes) || isWebp(bytes))) return { ok: false, problem: "photoType" };
  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(bytes, { limitInputPixels: PHOTO_MAX_PIXELS, failOn: "error" })
      .rotate()
      .resize({ width: PHOTO_MAX_SIDE, height: PHOTO_MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return { ok: true, jpeg };
  } catch {
    return { ok: false, problem: "photoUnreadable" };
  }
}
