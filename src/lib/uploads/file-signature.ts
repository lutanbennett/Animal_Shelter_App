/**
 * What a file's leading bytes say it is — checked on every upload before
 * Drive is touched, because the browser's MIME type is only a guess from
 * the file name.
 *
 * On 2026-09-25 a 3 MiB file of zero bytes named `mid3.jpg` was accepted
 * as the Website hero (it said `image/jpeg`, so every check passed), and
 * replacing the hero deleted the real photo for good. A zero-filled,
 * truncated or renamed file matches none of the signatures below, so it is
 * refused with a sentence instead of becoming a broken page.
 *
 * Plain functions over bytes, no imports: route handlers and Server
 * Actions both call it, and a client could too.
 */

/** The formats any upload path accepts, by what the bytes say. */
export type SniffedType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/heic"
  | "application/pdf";

/**
 * How much of the file is read. Images carry their signature at offset 0;
 * a PDF's `%PDF-` may legally sit anywhere in the first 1024 bytes (some
 * scanners write a preamble first).
 */
const HEAD_BYTES = 1024;

/**
 * ISO-BMFF brands that mean HEIF/HEIC — what an iPhone writes. `mif1` and
 * `msf1` are the generic HEIF image and sequence brands; some cameras use
 * them as the major brand with `heic` among the compatible ones.
 */
const HEIF_BRANDS = new Set([
  "heic", "heix", "heim", "heis",
  "hevc", "hevx", "hevm", "hevs",
  "mif1", "msf1",
]);

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((b, i) => bytes[i] === b);
}

/** The `ftyp` box's major and compatible brands, if the file opens with one. */
function isHeif(bytes: Uint8Array): boolean {
  if (bytes.length < 12 || ascii(bytes, 4, 4) !== "ftyp") return false;
  const boxSize =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const end = Math.min(boxSize, bytes.length);
  if (HEIF_BRANDS.has(ascii(bytes, 8, 4))) return true;
  // Compatible brands follow the 4-byte minor version, 4 bytes each.
  for (let offset = 16; offset + 4 <= end; offset += 4) {
    if (HEIF_BRANDS.has(ascii(bytes, offset, 4))) return true;
  }
  return false;
}

/** What the leading bytes are, or null when they are none of the accepted formats. */
export function sniffBytes(bytes: Uint8Array): SniffedType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }
  if (bytes.length >= 6 && /^GIF8[79]a$/.test(ascii(bytes, 0, 6))) return "image/gif";
  if (isHeif(bytes)) return "image/heic";
  if (ascii(bytes, 0, bytes.length).includes("%PDF-")) return "application/pdf";
  return null;
}

/** The two names browsers use for the one HEIF family. */
function family(mimeType: string): string {
  return mimeType === "image/heif" ? "image/heic" : mimeType;
}

/**
 * Checks an upload's bytes against the types its path accepts (the same
 * set its MIME check uses). Returns the MIME type to store it under — the
 * one the bytes prove, so a PNG saved as `photo.jpg` still reaches Drive
 * as a PNG — or null to refuse it.
 *
 * Deliberately forgiving about the name: a real photo with the wrong
 * extension is still a photo. What it refuses is a file whose contents
 * are not any accepted format at all.
 */
export async function checkFileSignature(
  file: Blob,
  allowed: ReadonlySet<string>,
): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, HEAD_BYTES).arrayBuffer());
  const sniffed = sniffBytes(head);
  if (!sniffed) return null;
  const accepted = [...allowed].some((type) => family(type) === sniffed);
  if (!accepted) return null;
  // Keep the browser's HEIF spelling when it names that family.
  return family(file.type) === sniffed ? file.type : sniffed;
}

/** Names of the formats in an accepted set, for the refusal message. */
export function formatNames(allowed: ReadonlySet<string>): string {
  const names: Record<string, string> = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/gif": "GIF",
    "image/heic": "HEIC",
    "application/pdf": "PDF",
  };
  return [...new Set([...allowed].map((type) => names[family(type)]).filter(Boolean))].join(", ");
}
