import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { can, type Permissions } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { getDriveClient, ensureBillsFolder, uploadImageToFolder } from "@/lib/google/drive";
import { driveImageUrl } from "@/lib/google/drive-client";
import { refuseCrossSite } from "@/lib/auth/same-origin";
import { todayIso } from "@/lib/format";

export const BILL_OWNER_TYPES = ["stock_receipt", "clinic_visit", "bill_inbox"] as const;
export type BillOwnerType = (typeof BILL_OWNER_TYPES)[number];

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

/** The same question the database asks (bill_owner_can, 0189), so a refusal comes before Drive is touched. */
export function mayFileBill(perms: Permissions | null, owner: BillOwnerType): boolean {
  const delivery = can(perms, "stock.delivery");
  const visits = can(perms, "medical.visits", "edit");
  if (owner === "stock_receipt") return delivery;
  if (owner === "clinic_visit") return visits;
  return delivery || visits || can(perms, "maintenance.bills");
}

/** Reads and checks the posted file; the response is set when it is refused. */
export async function readBillFile(
  request: Request,
): Promise<{ file: File; mimeType: string } | { response: NextResponse }> {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { response: NextResponse.json({ error: "No file provided." }, { status: 400 }) };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      response: NextResponse.json({ error: `Unsupported file type: ${file.type || "unknown"}.` }, { status: 400 }),
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { response: NextResponse.json({ error: "File is larger than 15MB." }, { status: 400 }) };
  }
  // The browser's type is a guess from the name; the bytes decide (file-signature.ts).
  const mimeType = await checkFileSignature(file, ALLOWED_MIME_TYPES);
  if (!mimeType) {
    const { t } = await getT();
    return {
      response: NextResponse.json(
        { error: t.uploads.notReadable(file.name, formatNames(ALLOWED_MIME_TYPES)) },
        { status: 400 },
      ),
    };
  }
  return { file, mimeType };
}

export async function refuseUnlessAllowed(request: Request, owner: BillOwnerType): Promise<NextResponse | null> {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;
  if (!mayFileBill(await loadPermissions(), owner)) {
    const { t } = await getT();
    return NextResponse.json({ error: t.photos.errors.notAuthorized }, { status: 403 });
  }
  return null;
}

/**
 * Drive first, then the row through record_attachment() (0190). A failed row
 * removes the file again so Drive holds no orphan.
 */
export async function fileBillPhoto(
  owner: BillOwnerType,
  ownerId: string,
  file: File,
  mimeType: string,
): Promise<NextResponse> {
  const supabase = await createClient();
  const today = todayIso();
  const drive = getDriveClient();
  const folderId = await ensureBillsFolder(drive, today);
  const driveFileId = await uploadImageToFolder(drive, folderId, { name: file.name, mimeType, content: file });

  const { data, error } = await supabase.rpc("record_attachment", {
    p_owner_type: owner,
    p_owner_id: ownerId,
    p_drive_file_id: driveFileId,
    p_file_name: file.name,
    p_date_taken: today,
  });
  const row = (data as { attachment: { id: string } }[] | null)?.[0];
  if (error || !row) {
    try {
      await drive.deleteFile(driveFileId);
    } catch {
      // Best effort.
    }
    return NextResponse.json({ error: error?.message ?? "Could not record the file." }, { status: 500 });
  }
  return NextResponse.json({
    attachmentId: row.attachment.id,
    driveFileId,
    fileName: file.name,
    mimeType,
    fileUrl: driveImageUrl(driveFileId),
  });
}
