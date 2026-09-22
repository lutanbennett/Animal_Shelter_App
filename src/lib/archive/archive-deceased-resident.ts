import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getDriveClient,
  moveResidentFolderToDeceasedArchive,
  upsertGeneratedFile,
} from "@/lib/google/drive";
import { loadResidentArchiveRecord } from "./resident-record";
import {
  renderResidentSummaryPdf,
  summaryPdfFileName,
} from "./resident-summary-pdf";
import {
  RESIDENT_INDEX_FILE_NAME,
  renderResidentIndexHtml,
} from "./resident-index-html";

/**
 * The Drive half of the deceased workflow, run after the Deceased placement
 * has been committed (requirements doc, Sections 5.1 and 7.2):
 *
 *   1. move Residents/<Name> (<ID>)/ to Residents/Deceased/<Name> (<ID>)/
 *   2. write the deceased summary PDF into that folder
 *   3. write index.html — the offline index — beside it
 *   4. record all three in the database
 *
 * Deliberately separate from recording the death itself. The database
 * transition is the source of truth and must not be held hostage by the
 * Drive API being slow or down; if this half fails the resident is still
 * correctly marked deceased, the archive is flagged incomplete, and the hub
 * offers a retry. Every step is written to be safe to run again: the folder
 * move no-ops once the folder is in the archive, and both files are
 * replaced in place rather than duplicated.
 */

export type ArchiveDeceasedResidentResult =
  | { ok: true; alreadyArchived: boolean }
  | { error: string };

/** Skip embedding a profile photo larger than this in the PDF. */
const MAX_EMBEDDED_PHOTO_BYTES = 4 * 1024 * 1024;

/** @react-pdf can only embed these. HEIC photos from phones can't go in. */
const EMBEDDABLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

function toBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  // Chunked so a large photo can't blow the argument limit of String.fromCharCode.
  const CHUNK = 0x8000;
  for (let i = 0; i < view.length; i += CHUNK) {
    binary += String.fromCharCode(...view.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export async function archiveDeceasedResident(
  supabase: SupabaseClient,
  residentId: string,
): Promise<ArchiveDeceasedResidentResult> {
  const residentResult = await supabase
    .from("residents")
    .select(
      "id, name, resident_code, drive_folder_id, profile_photo_drive_file_id, deceased_summary_drive_file_id, deceased_index_drive_file_id",
    )
    .eq("id", residentId)
    .limit(1)
    .returns<
      {
        id: string;
        name: string;
        resident_code: string;
        drive_folder_id: string | null;
        profile_photo_drive_file_id: string | null;
        deceased_summary_drive_file_id: string | null;
        deceased_index_drive_file_id: string | null;
      }[]
    >();

  if (residentResult.error) return { error: residentResult.error.message };
  const resident = residentResult.data?.[0];
  if (!resident) return { error: "Resident not found." };

  try {
    const record = await loadResidentArchiveRecord(supabase, residentId);
    const drive = getDriveClient();

    const { residentFolderId, alreadyArchived } =
      await moveResidentFolderToDeceasedArchive(drive, resident);

    // A photo in the PDF makes it a record of the resident rather than a form.
    // Never worth failing the archive over, so any problem fetching it is
    // swallowed and the summary renders without it.
    let profilePhotoDataUri: string | null = null;
    if (resident.profile_photo_drive_file_id) {
      try {
        const photo = await drive.downloadFile(resident.profile_photo_drive_file_id);
        const type = photo.contentType.split(";")[0].trim();
        if (
          EMBEDDABLE_IMAGE_TYPES.has(type) &&
          photo.body.byteLength <= MAX_EMBEDDED_PHOTO_BYTES
        ) {
          profilePhotoDataUri = `data:${type};base64,${toBase64(photo.body)}`;
        }
      } catch {
        profilePhotoDataUri = null;
      }
    }

    const pdfName = summaryPdfFileName(record);
    const pdfBytes = await renderResidentSummaryPdf(record, { profilePhotoDataUri });
    const summaryFileId = await upsertGeneratedFile(drive, residentFolderId, {
      name: pdfName,
      mimeType: "application/pdf",
      content: pdfBytes,
      existingFileId: resident.deceased_summary_drive_file_id,
    });

    const html = renderResidentIndexHtml(record, { summaryPdfFileName: pdfName });
    const indexFileId = await upsertGeneratedFile(drive, residentFolderId, {
      name: RESIDENT_INDEX_FILE_NAME,
      mimeType: "text/html",
      content: new TextEncoder().encode(html),
      existingFileId: resident.deceased_index_drive_file_id,
    });

    const { error } = await supabase.rpc("record_deceased_archive", {
      p_resident_id: residentId,
      p_drive_folder_id: residentFolderId,
      p_summary_drive_file_id: summaryFileId,
      p_index_drive_file_id: indexFileId,
    });
    if (error) return { error: error.message };

    return { ok: true, alreadyArchived };
  } catch (error) {
    // The hub shows only the message; the stack goes to the Worker log so a
    // Drive or PDF failure can be traced with `wrangler tail` rather than a
    // redeploy.
    console.error(`archiveDeceasedResident(${residentId}) failed:`, error);
    return {
      error: error instanceof Error ? error.message : "Failed to archive the resident.",
    };
  }
}
