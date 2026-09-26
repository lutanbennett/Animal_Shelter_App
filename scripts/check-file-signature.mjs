#!/usr/bin/env node
/**
 * Checks src/lib/uploads/file-signature.ts against small hand-built files:
 * each accepted format passes and is stored under the type its bytes prove,
 * and the file that caused the 2026-09-25 incident — 3 MiB of zero bytes
 * named mid3.jpg — is refused, along with other things that are not what
 * their name says.
 *
 *   node scripts/check-file-signature.mjs
 *
 * No database, no Drive: imports the helper directly (Node strips its
 * types). Exits 1 if any case is wrong.
 */
import {
  checkFileSignature,
  formatNames,
  sniffBytes,
} from "../src/lib/uploads/file-signature.ts";

const WEBSITE = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const ATTACHMENTS = new Set([...WEBSITE, "application/pdf"]);
const PROJECTS = new Set([...ATTACHMENTS, "image/gif"]);

const bytes = (...parts) =>
  new Uint8Array(
    parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)),
  );
const pad = (head, length = 64) => {
  const out = new Uint8Array(Math.max(length, head.length));
  out.set(head);
  return out;
};
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

const JPEG = pad(bytes([0xff, 0xd8, 0xff, 0xe0], "\0\x10JFIF"));
const PNG = pad(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const WEBP = pad(bytes("RIFF", u32(1000), "WEBPVP8 "));
const GIF = pad(bytes("GIF89a"));
const HEIC = pad(bytes(u32(24), "ftypheic", u32(0), "mif1heic"));
const HEIF_MIF1 = pad(bytes(u32(24), "ftypmif1", u32(0), "mif1heic"));
const MP4 = pad(bytes(u32(24), "ftypisom", u32(0), "isomavc1"));
const PDF = pad(bytes("%PDF-1.7\n"));
const PDF_PREAMBLE = pad(bytes("\n\n junk from a scanner \n%PDF-1.4\n"));
const ZEROS = new Uint8Array(3 * 1024 * 1024);
const TEXT = pad(bytes("hello, this is not a photo"));

const file = (data, name, type) => new File([data], name, { type });

const cases = [
  // [label, file, allowed set, expected stored type or null]
  ["JPEG", file(JPEG, "a.jpg", "image/jpeg"), WEBSITE, "image/jpeg"],
  ["PNG", file(PNG, "a.png", "image/png"), WEBSITE, "image/png"],
  ["WebP", file(WEBP, "a.webp", "image/webp"), WEBSITE, "image/webp"],
  ["HEIC", file(HEIC, "a.heic", "image/heic"), WEBSITE, "image/heic"],
  ["HEIF spelling kept", file(HEIF_MIF1, "a.heif", "image/heif"), WEBSITE, "image/heif"],
  ["PNG named .jpg is stored as PNG", file(PNG, "a.jpg", "image/jpeg"), WEBSITE, "image/png"],
  ["mid3.jpg: 3 MiB of zero bytes", file(ZEROS, "mid3.jpg", "image/jpeg"), WEBSITE, null],
  ["empty file", file(new Uint8Array(0), "empty.jpg", "image/jpeg"), WEBSITE, null],
  ["text renamed .jpg", file(TEXT, "note.jpg", "image/jpeg"), WEBSITE, null],
  ["MP4 renamed .heic", file(MP4, "clip.heic", "image/heic"), WEBSITE, null],
  ["GIF where GIF is not accepted", file(GIF, "a.gif", "image/jpeg"), WEBSITE, null],
  ["GIF on a project", file(GIF, "a.gif", "image/gif"), PROJECTS, "image/gif"],
  ["PDF on an attachment", file(PDF, "lab.pdf", "application/pdf"), ATTACHMENTS, "application/pdf"],
  ["PDF with a preamble", file(PDF_PREAMBLE, "scan.pdf", "application/pdf"), ATTACHMENTS, "application/pdf"],
  ["PDF on the Website", file(PDF, "lab.pdf", "image/jpeg"), WEBSITE, null],
  ["zero-byte PDF", file(new Uint8Array(4096), "lab.pdf", "application/pdf"), ATTACHMENTS, null],
];

let failed = 0;
for (const [label, f, allowed, expected] of cases) {
  const got = await checkFileSignature(f, allowed);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${got ?? "refused"}${ok ? "" : ` (expected ${expected ?? "refused"})`}`);
}

const names = formatNames(WEBSITE);
if (names !== "JPEG, PNG, WebP, HEIC") {
  failed++;
  console.log(`FAIL formatNames(WEBSITE) = "${names}"`);
}
if (sniffBytes(new Uint8Array(0)) !== null) {
  failed++;
  console.log("FAIL sniffBytes on no bytes");
}

console.log(failed ? `\n${failed} failed` : `\nall ${cases.length + 2} passed`);
process.exit(failed ? 1 : 0);
