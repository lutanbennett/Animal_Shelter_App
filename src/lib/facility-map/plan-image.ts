/**
 * What a facility plan image may be, and how big it is — read from the file's own bytes, never from
 * the name or the browser's guess (docs/decisions/2026-10-08-facility-map-plans-uploaded.md).
 *
 * Plain functions over bytes, no imports: the upload action and the editor's file picker both use it.
 *
 * SVG is refused rather than sanitised: a plan is a photograph or an export of a drawing, every
 * drawing program can save a PNG, and an SVG is a document that can carry script. One sentence asking
 * for a PNG costs less than a sanitiser that has to be right forever.
 */

/** About 5 MB: a 3000-pixel WebP of a hand-drawn plan is well under 1 MB. */
export const PLAN_MAX_BYTES = 5 * 1024 * 1024;

/** The longest side the editor's picker keeps; a phone photo is scaled down to this before upload. */
export const PLAN_MAX_SIDE = 3000;

/** Smaller than this on either side and a kennel is a few pixels: not a usable plan. (The committed Cat Zone crop is 145 × 210.) */
export const PLAN_MIN_SIDE = 100;

/** Larger than this and it is not a plan anyone drew (and would cost every phone that opens it). */
export const PLAN_LIMIT_SIDE = 8000;

export type PlanImageType = "image/webp" | "image/png" | "image/jpeg";

export const PLAN_EXTENSIONS: Record<PlanImageType, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export type PlanImageInfo = { type: PlanImageType; width: number; height: number };

function ascii(b: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...b.subarray(start, start + length));
}
const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const u32be = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;

function png(b: Uint8Array): PlanImageInfo | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length < 24 || !sig.every((x, i) => b[i] === x) || ascii(b, 12, 4) !== "IHDR") return null;
  return { type: "image/png", width: u32be(b, 16), height: u32be(b, 20) };
}

function webp(b: Uint8Array): PlanImageInfo | null {
  if (b.length < 30 || ascii(b, 0, 4) !== "RIFF" || ascii(b, 8, 4) !== "WEBP") return null;
  const chunk = ascii(b, 12, 4);
  if (chunk === "VP8 ") {
    // Lossy: a key frame's start code, then 14-bit width and height.
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    return { type: "image/webp", width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    if (b[20] !== 0x2f) return null;
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { type: "image/webp", width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return { type: "image/webp", width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
  }
  return null;
}

function jpeg(b: Uint8Array): PlanImageInfo | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1; // fill byte
      continue;
    }
    // Start-of-frame markers carry the size; C4 (DHT), C8 and CC (DAC) are not frames.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { type: "image/jpeg", height: u16be(b, i + 5), width: u16be(b, i + 7) };
    }
    if (marker === 0xd9 || marker === 0xda) return null; // end of image or start of scan, no frame seen
    i += 2 + u16be(b, i + 2);
  }
  return null;
}

/**
 * The file's type and pixel size, or null when it is not a WebP, PNG or JPEG whose header can be
 * read. A JPEG's frame header can sit after a large EXIF block, so pass the whole file.
 */
export function readPlanImage(bytes: Uint8Array): PlanImageInfo | null {
  const info = png(bytes) ?? webp(bytes) ?? jpeg(bytes);
  if (!info || info.width < 1 || info.height < 1) return null;
  return info;
}

export type PlanImageProblem = "type" | "tooLarge" | "tooSmall" | "tooBig";

/** Why this file cannot be a plan, or its type and size when it can. */
export function planImageProblem(bytes: Uint8Array): { problem: PlanImageProblem } | { info: PlanImageInfo } {
  if (bytes.byteLength > PLAN_MAX_BYTES) return { problem: "tooLarge" };
  const info = readPlanImage(bytes);
  if (!info) return { problem: "type" };
  if (info.width < PLAN_MIN_SIDE || info.height < PLAN_MIN_SIDE) return { problem: "tooSmall" };
  if (info.width > PLAN_LIMIT_SIDE || info.height > PLAN_LIMIT_SIDE) return { problem: "tooBig" };
  return { info };
}
