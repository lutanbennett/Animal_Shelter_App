import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { isMedicalFolder } from "@/lib/google/drive-client";

/**
 * Makes one of a resident's photos their profile photo — the one way the
 * app does it (the hub's photo viewer and both edit forms). The profile
 * photo is what /adopt, the home page cards, recent adoptions, /r/<code>
 * and link previews show, so a photo filed under Medical is refused here
 * with a sentence: Medical photos never appear on the website (0101 took
 * them out of the gallery; docs/decisions.md, 2026-09-27, "A Medical photo
 * cannot be chosen as the profile photo").
 *
 * This blocks choosing one. It does not stop record_attachment making a
 * resident's first upload their profile photo whatever its folder, nor
 * delete_resident_photo falling back to the oldest — those are in the
 * database, and the public views' fallback is the follow-up that covers
 * them.
 */
export async function setResidentProfilePhoto(
  supabase: SupabaseClient,
  t: Dictionary,
  residentId: string,
  driveFileId: string,
): Promise<{ error: string } | undefined> {
  const { data: rows } = await supabase
    .from("attachments")
    .select("sub_folder")
    .eq("owner_type", "resident")
    .eq("owner_id", residentId)
    .eq("drive_file_id", driveFileId)
    .returns<{ sub_folder: string | null }[]>();
  if (rows?.some((row) => isMedicalFolder(row.sub_folder))) {
    return { error: t.photos.errors.medicalProfile };
  }

  // The RPC keeps its own checks: the role, and that the file is one of
  // this resident's photos (0013).
  const { error } = await supabase.rpc("set_resident_profile_photo", {
    p_resident_id: residentId,
    p_drive_file_id: driveFileId,
  });
  if (error) return { error: error.message };
}
