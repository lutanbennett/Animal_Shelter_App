import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findOrCreateFolder, getDriveClient, upsertGeneratedFile } from "@/lib/google/drive";
import type { DonationReceiptRow } from "./donations";
import { receiptFileName, type ReceiptDocument } from "./receipt";
import { renderReceiptPdf } from "./receipt-pdf";

/**
 * Receipts on the server: the PDF from a register row, and filing it on Drive.
 *
 * Drive is never in the way of a receipt. The number is taken and the row
 * committed first (issue_donation_receipt, 0168); only then is the PDF filed.
 * If Drive is down (a lapsed token has broken uploads before) the receipt still
 * exists, the Director still gets the PDF, and the row says "not yet saved to
 * Drive" (drive_file_id null) until a retry files it.
 */

export const RECEIPT_COLUMNS =
  "id, number, donation_id, country, issued_on, issued_at, content, issuer, drive_file_id, drive_saved_at, sent_at, voided_at, void_reason";

/** Admin/Donations/Receipts/<year>/ under the Drive root. Share it with the Director only, like Backups. */
const RECEIPTS_PATH = ["Admin", "Donations", "Receipts"] as const;

export function receiptDocument(row: DonationReceiptRow): ReceiptDocument {
  return {
    number: row.number,
    country: row.country,
    issuedOn: row.issued_on,
    issuer: row.issuer,
    content: row.content,
    voided: row.voided_at ? { on: row.voided_at.slice(0, 10), reason: row.void_reason ?? "" } : null,
  };
}

export async function receiptPdf(row: DonationReceiptRow): Promise<{ bytes: Uint8Array; fileName: string }> {
  return { bytes: await renderReceiptPdf(receiptDocument(row)), fileName: receiptFileName(row.number, row.content.donorName) };
}

export async function loadReceipt(supabase: SupabaseClient, id: string): Promise<DonationReceiptRow | null> {
  const { data, error } = await supabase.from("donation_receipts").select(RECEIPT_COLUMNS).eq("id", id).maybeSingle<DonationReceiptRow>();
  if (error) throw error;
  return data;
}

/**
 * Files the receipt's PDF on Drive and records the file id. Replaces the file
 * in place when one is already recorded (a void re-files the copy marked VOID,
 * so Drive never holds a clean copy of a cancelled receipt). Returns false,
 * never throws, when Drive fails: the caller tells the Director and the row
 * stays "not yet saved".
 */
export async function fileReceiptOnDrive(supabase: SupabaseClient, row: DonationReceiptRow): Promise<boolean> {
  try {
    const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
    const drive = getDriveClient();
    let folderId = rootId;
    for (const name of [...RECEIPTS_PATH, row.issued_on.slice(0, 4)]) {
      folderId = await findOrCreateFolder(drive, folderId, name);
    }
    const { bytes, fileName } = await receiptPdf(row);
    const fileId = await upsertGeneratedFile(drive, folderId, {
      name: fileName,
      mimeType: "application/pdf",
      content: bytes,
      existingFileId: row.drive_file_id,
    });
    const { error } = await supabase
      .from("donation_receipts")
      .update({ drive_file_id: fileId, drive_saved_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`[donation-receipts] Drive filing failed for ${row.number}:`, error);
    return false;
  }
}
