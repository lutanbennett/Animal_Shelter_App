// What the Drive mirror should do with a file, decided from its mimeType alone.
//
// Split out of drive-mirror.mjs so it can be tested: that script runs its whole sync on
// import, so nothing inside it is reachable from a test.
//
// WHY THIS EXISTS AT ALL. The mirror used to export EVERY Google-native file as a PDF.
// Drive only exports the Docs-editors types; asked for anything else it answers HTTP 400,
// which the mirror counted as a failed file, and ANY failed file makes the run exit 1.
// So two un-exportable files in the shelter's Drive turned the nightly unit permanently
// red (2026-11-04: 1,104 of 1,107 files copied, unit `Failed`). A light that is always
// red cannot report a real failure, which is the actual fault.
//
// Un-exportable natives are SKIPPED, not failed: there is no file to copy and no amount
// of retrying will make one. They are still `seen`, so they are never logged as gone.

export const NATIVE_PREFIX = "application/vnd.google-apps.";
export const FOLDER = `${NATIVE_PREFIX}folder`;

// The Docs-editors types, and the only native types Drive will export.
// Forms, Sites, Jamboards, Maps and the rest have no file behind them to export.
export const EXPORTABLE = new Set([
  `${NATIVE_PREFIX}document`,
  `${NATIVE_PREFIX}spreadsheet`,
  `${NATIVE_PREFIX}presentation`,
  `${NATIVE_PREFIX}drawing`,
]);

export const isNative = (mimeType) => mimeType.startsWith(NATIVE_PREFIX) && !mimeType.includes("shortcut");

/**
 * One of:
 *   "folder"      walk into it
 *   "shortcut"    skip; it points at a file we reach by its own path
 *   "unexportable" skip; a native type Drive cannot turn into a file
 *   "export"      fetch /export?mimeType=application/pdf, saved with a .pdf suffix
 *   "download"    fetch ?alt=media, saved under its own name
 */
export function plan(mimeType) {
  if (mimeType === FOLDER) return "folder";
  if (mimeType.includes("shortcut")) return "shortcut";
  if (!isNative(mimeType)) return "download";
  return EXPORTABLE.has(mimeType) ? "export" : "unexportable";
}

// A failed copy worth trying again. Drive's own busy/outage codes are already retried
// inside get(); what reaches here is either a 4xx (final — the file will not appear by
// asking again) or a transport error thrown out of fetch or the body stream, such as
// undici's bare `terminated` when a connection drops mid-download. Those are worth a retry
// and used not to get one: a single dropped photo failed the whole run.
export const isWorthRetrying = (message) => !/^HTTP 4\d\d$/.test(String(message));
