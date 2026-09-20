/**
 * Pure, dependency-free helpers safe to import from client components.
 * Kept separate from drive.ts, which pulls in `googleapis`/`stream` and
 * must stay server-only.
 */

/**
 * URL for displaying a Drive-backed photo — routes through this app's own
 * image proxy (src/app/api/photos/[fileId]/route.ts) rather than hitting
 * Drive's public "anyone with the link" endpoint directly from the browser.
 * See docs/decisions.md for why: that endpoint has an undocumented,
 * per-file abuse-throttling quota that a handful of pageviews in quick
 * succession can trip, taking the photo offline for everyone for ~24h.
 */
export function driveImageUrl(fileId: string): string {
  return `/api/photos/${fileId}`;
}

/**
 * Link straight to a file in Google Drive's own viewer. Used for the
 * deceased archive's summary PDF and offline index page, which staff open
 * in Drive rather than through the app — unlike photos, these aren't
 * rendered in-page, so there's no throttle to route around.
 */
export function driveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

/** Link to a folder in Drive — the archived resident folder. */
export function driveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
}

/**
 * The folders a resident photo can be filed under — mirrors the legacy
 * Drive convention (Residents/<Name> (<ID>)/Photos/<Category>/<YYMM>/...).
 * Single source of truth, shared by the upload form and the upload route's
 * server-side validation.
 */
export const PHOTO_CATEGORIES = ["Shelter", "Medical", "Foster", "Adoption"] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

/** "2026-09-15" -> "2609", the <YYMM> Drive folder segment. */
export function dateToYymm(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  return `${year.slice(2)}${month}`;
}

/**
 * "2026-09-15" -> "20260915", the <YYYYMMDD> Drive folder segment used
 * under Blood Tests — the requirements doc's preserved legacy convention is
 * Residents/<Name> (<ID>)/Blood Tests/<YYYYMMDD>/..., a full date per
 * folder (one date can hold several files from the same draw) rather than
 * Photos' <YYMM>-per-month grouping.
 */
export function dateToYyyymmdd(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}
