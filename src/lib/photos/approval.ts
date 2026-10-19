import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appUserLabel, loadAppUsersById } from "@/lib/auth/app-users";
import { can, type Permissions } from "@/lib/permissions/can";

/**
 * One resident photo waiting for Management (attachments.approved_at is null, 0217). The queue page draws a list of
 * these. A second kind of waiting row (a photo tagged to an enclosure, 0218) is its own loader and its own card
 * beside this one, not another shape in this type: docs/decisions/2026-10-17-photo-approval-queue.md.
 */
export type WaitingPhoto = {
  id: string;
  driveFileId: string;
  fileName: string | null;
  uploadedAt: string;
  dateTaken: string | null;
  residentId: string;
  residentName: string;
  residentCode: string;
  /** Who filed it: the login's name, else email; "—" when the login is gone. */
  addedBy: string;
};

type Row = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  uploaded_at: string;
  date_taken: string | null;
  owner_id: string;
  uploaded_by: string | null;
};

/** Whether this login sees the queue: the one activity that may approve (0217 refuses anyone else). */
export const canApprovePhotos = (perms: Permissions | null | undefined): boolean => can(perms, "photos.approve");

/** Oldest first, so the photo that has waited longest is the one on top. */
export async function loadWaitingPhotos(supabase: SupabaseClient): Promise<WaitingPhoto[]> {
  const { data } = await supabase
    .from("attachments")
    .select("id, drive_file_id, file_name, uploaded_at, date_taken, owner_id, uploaded_by")
    .eq("owner_type", "resident")
    .is("approved_at", null)
    .order("uploaded_at", { ascending: true })
    .returns<Row[]>();
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const [{ data: residents }, users] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, resident_code")
      .in("id", [...new Set(rows.map((r) => r.owner_id))])
      .returns<{ id: string; name: string; resident_code: string }[]>(),
    loadAppUsersById(supabase, rows.flatMap((r) => (r.uploaded_by ? [r.uploaded_by] : []))),
  ]);
  const byId = new Map((residents ?? []).map((r) => [r.id, r]));

  return rows.flatMap((r) => {
    const resident = byId.get(r.owner_id);
    // A resident this login cannot read is a photo it cannot judge: leave it off rather than show a nameless one.
    if (!resident) return [];
    return [
      {
        id: r.id,
        driveFileId: r.drive_file_id,
        fileName: r.file_name,
        uploadedAt: r.uploaded_at,
        dateTaken: r.date_taken,
        residentId: resident.id,
        residentName: resident.name,
        residentCode: resident.resident_code,
        addedBy: r.uploaded_by ? appUserLabel(users.get(r.uploaded_by)) : "—",
      },
    ];
  });
}

/** The count on the home tile; undefined for a login that cannot approve, so no tile is drawn for it. */
export async function countPhotosWaiting(supabase: SupabaseClient, perms: Permissions | null): Promise<number | undefined> {
  if (!canApprovePhotos(perms)) return undefined;
  const [{ count }, { count: pending }] = await Promise.all([
    supabase
      .from("attachments")
      .select("id", { count: "exact", head: true })
      .eq("owner_type", "resident")
      .is("approved_at", null),
    // Photos tagged to an enclosure wait too (0218): one tile counts both kinds.
    supabase.from("pending_photos").select("id", { count: "exact", head: true }),
  ]);
  return (count ?? 0) + (pending ?? 0);
}
