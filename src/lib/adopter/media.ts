import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadAdopterScope } from "@/lib/adopter/scope";
import { ADOPTER_MAX_FILES } from "@/lib/adopter/limits";
import { dateToYyyymmdd } from "@/lib/google/drive-client";

/**
 * The gate for every adopter media route (#l5gxn, docs/decisions/2026-11-12-adopter-media-and-translations.md). An adopter
 * holds no card, so record_attachment (which asks has_permission) cannot be used; instead ONE question is asked here, again at
 * every step: is this signed-in, verified person the sender of this update, is the update an app-sent one about a resident they
 * adopted (adopter_may_submit, 0357), and is there room for another file? Anything else answers null. The service-role client
 * is used only after that, for the Drive folder lookup and the one attachments insert.
 */
export type OwnUpdate = {
  userId: string;
  residentId: string;
  updateId: string;
  receivedOn: string;
  subFolder: string;
  fileCount: number;
  resident: { id: string; name: string; resident_code: string; drive_folder_id: string | null };
};

export async function loadOwnUpdate(residentId: string, updateId: string): Promise<OwnUpdate | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const scope = await loadAdopterScope(supabase);
  const mine = scope?.residents.find((r) => r.residentId === residentId);
  if (!userData.user || !scope || !mine) return null;

  const admin = createAdminClient();
  const { data: may, error } = await admin.rpc("adopter_may_submit", { p_contact_id: mine.contactId, p_resident_id: residentId });
  if (error || may !== true) return null;

  const { data: update } = await admin
    .from("adoption_updates")
    .select("id, received_on")
    .eq("id", updateId)
    .eq("resident_id", residentId)
    .eq("sender_contact_id", mine.contactId)
    .eq("channel", "app")
    .maybeSingle<{ id: string; received_on: string }>();
  if (!update) return null;

  const { data: resident } = await admin
    .from("residents")
    .select("id, name, resident_code, drive_folder_id")
    .eq("id", residentId)
    .maybeSingle<OwnUpdate["resident"]>();
  if (!resident) return null;

  const { count } = await admin
    .from("attachments")
    .select("id", { count: "exact", head: true })
    .eq("adoption_update_id", updateId);

  return {
    userId: userData.user.id,
    residentId,
    updateId,
    receivedOn: update.received_on,
    subFolder: dateToYyyymmdd(update.received_on),
    fileCount: count ?? 0,
    resident,
  };
}

export const hasRoom = (u: OwnUpdate) => u.fileCount < ADOPTER_MAX_FILES;

/**
 * The one attachments insert. attachments_approval_stamp (0346) forces approved_at NULL for a resident file whoever inserts it,
 * so the file is invisible to public_adoption_updates and is_public_drive_file until a person approves it; no profile photo is
 * set (record_attachment's profile step needs an approved file). Never names approved_at.
 */
export async function recordAdopterFile(
  u: OwnUpdate,
  file: { driveFileId: string; fileName: string; kind: "photo" | "video"; durationMs?: number | null },
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await createAdminClient()
    .from("attachments")
    .insert({
      owner_type: "resident",
      owner_id: u.residentId,
      sub_folder: u.subFolder,
      drive_file_id: file.driveFileId,
      file_name: file.fileName,
      date_taken: u.receivedOn,
      uploaded_by: u.userId,
      adoption_update_id: u.updateId,
      purpose: "bill",
      media_kind: file.kind,
      duration_ms: file.kind === "video" ? (file.durationMs ?? null) : null,
    })
    .select("id")
    .single<{ id: string }>();
  return error || !data ? { error: error?.message ?? "insert failed" } : { id: data.id };
}
