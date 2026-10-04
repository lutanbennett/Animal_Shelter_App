/**
 * Pure, dependency-free helpers safe to import from client components.
 * Kept separate from drive.ts, which pulls in `googleapis`/`stream` and
 * must stay server-only.
 */

import { can, type Permissions } from "@/lib/permissions/can";

/**
 * URL for displaying a Drive-backed photo — routes through this app's own
 * image proxy (src/app/api/photos/[fileId]/route.ts) rather than hitting
 * Drive's public "anyone with the link" endpoint directly from the browser.
 * See docs/decisions.md for why: that endpoint has an undocumented,
 * per-file abuse-throttling quota that a handful of pageviews in quick
 * succession can trip, taking the photo offline for everyone for ~24h.
 */
export function driveImageUrl(fileId: string, width?: PhotoWidth): string {
  return width ? `/api/photos/${fileId}?w=${width}` : `/api/photos/${fileId}`;
}

/**
 * The only widths the photo route will resize to, so the caches can't be
 * flooded with sizes: thumbnails (160), cards (400) and the large view
 * (1200). Anything else is refused. Drive scales the longer side to this
 * many pixels. Public pages ask for a width; staff views stay on the original.
 */
export const PHOTO_WIDTHS = [160, 400, 1200] as const;
export type PhotoWidth = (typeof PHOTO_WIDTHS)[number];

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

/**
 * The folders this person may file a resident photo under. Filing anywhere
 * but Medical is what publishes a photo (parity finding A5), so a person who
 * holds photos.resident_add and not photos.resident_publish — a vet adds
 * clinical photos and nothing else (backlog, Pass 1 Vet, 2026-09-27) — files
 * to Medical only. The form shows no picker when there is one choice, and the
 * upload route refuses anything else.
 */
export function photoCategoriesFor(perms: Permissions | null | undefined): readonly PhotoCategory[] {
  return can(perms, "photos.resident_publish") ? PHOTO_CATEGORIES : ["Medical"];
}

/**
 * Whether a photo's `attachments.sub_folder` is the Medical folder — the
 * same test as public_resident_photos (0101): case and surrounding spaces
 * ignored, a null folder is not Medical. A Medical photo never appears on
 * the website, so it cannot be chosen as the profile photo.
 */
export function isMedicalFolder(subFolder: string | null | undefined): boolean {
  return (subFolder ?? "").trim().toLowerCase() === "medical";
}

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
