import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { ensureResidentPhotosFolder, getDriveClient, uploadImageToFolder } from "@/lib/google/drive";
import { dateToYymm, driveImageUrl } from "@/lib/google/drive-client";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { refuseCrossSite } from "@/lib/auth/same-origin";
import { readBillFile } from "@/lib/bills/upload";
import { visitDate } from "@/lib/clinics/linkable";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Adds one page of the doctor's written report to a clinic visit (0220: an attachment with purpose
 * 'report'). Filed in the resident's own Drive folder under Photos/Medical, which no public view reads.
 * The database decides whether the row may exist (record_attachment, then the attachments policies);
 * a refused row removes the Drive file again.
 */
async function handlePost(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return crossSite;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { t } = await getT();
  if (!can(await loadPermissions(), "medical.visits", "edit")) {
    return NextResponse.json({ error: t.photos.errors.notAuthorized }, { status: 403 });
  }
  const read = await readBillFile(request);
  if ("response" in read) return read.response;
  const { file, mimeType } = read;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("clinic_visits")
    .select("id, appointment_date, residents(id, name, resident_code, drive_folder_id)")
    .eq("id", id)
    .limit(1)
    .returns<
      {
        id: string;
        appointment_date: string;
        residents: { id: string; name: string; resident_code: string; drive_folder_id: string | null } | null;
      }[]
    >();
  const visit = rows?.[0];
  if (!visit || !visit.residents) return NextResponse.json({ error: "Visit not found." }, { status: 404 });
  const resident = visit.residents;

  // The deceased lock would refuse the row only after the upload; stop before Drive is touched.
  const { data: state } = await supabase
    .from("resident_current_state")
    .select("is_deceased")
    .eq("resident_id", resident.id)
    .limit(1)
    .returns<{ is_deceased: boolean }[]>();
  if (state?.[0]?.is_deceased) {
    return NextResponse.json({ error: "This resident has died — their record is closed." }, { status: 409 });
  }

  const url = new URL(request.url);
  const askedDate = url.searchParams.get("date");
  const reportDate = askedDate && ISO_DATE.test(askedDate) ? askedDate : visitDate(visit);
  const note = (url.searchParams.get("note") ?? "").trim().slice(0, 500);

  // "2026-10-20 Doctor report - Blackie.pdf", with "(2)" etc. for further pages of the same report.
  const { count } = await supabase
    .from("attachments")
    .select("id", { count: "exact", head: true })
    .eq("owner_type", "clinic_visit")
    .eq("owner_id", id)
    .eq("purpose", "report");
  const ext = /\.[A-Za-z0-9]{1,5}$/.exec(file.name)?.[0].toLowerCase() ?? (mimeType === "application/pdf" ? ".pdf" : ".jpg");
  const page = (count ?? 0) > 0 ? ` (${(count ?? 0) + 1})` : "";
  const fileName = `${reportDate} Doctor report - ${resident.name.replace(/[\/:*?"<>|]/g, "-")}${page}${ext}`;

  const drive = getDriveClient();
  const { residentFolderId, uploadFolderId, isNewResidentFolder } = await ensureResidentPhotosFolder(
    drive,
    resident,
    "Medical",
    dateToYymm(reportDate),
  );
  if (isNewResidentFolder) {
    await supabase.from("residents").update({ drive_folder_id: residentFolderId }).eq("id", resident.id);
  }
  const driveFileId = await uploadImageToFolder(drive, uploadFolderId, { name: fileName, mimeType, content: file });

  const { data, error } = await supabase.rpc("record_attachment", {
    p_owner_type: "clinic_visit",
    p_owner_id: id,
    p_drive_file_id: driveFileId,
    p_file_name: fileName,
    p_sub_folder: "Medical",
    p_date_taken: reportDate,
    p_purpose: "report",
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
  if (note) await supabase.from("attachments").update({ caption: note }).eq("id", row.attachment.id);

  return NextResponse.json({
    attachmentId: row.attachment.id,
    driveFileId,
    fileName,
    mimeType,
    fileUrl: driveImageUrl(driveFileId),
  });
}

export const POST = withDriveErrors(handlePost);
