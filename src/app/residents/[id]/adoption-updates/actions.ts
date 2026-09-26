"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getDriveClient } from "@/lib/google/drive";
import { refreshDeceasedArchiveIfNeeded } from "@/lib/archive/refresh-deceased-archive";
import { runAction, type ActionResult } from "@/lib/action-result";
import { isIsoDate, isFutureDate } from "@/lib/placements/dates";
import {
  ADOPTION_UPDATE_ROLES,
  isAdoptionUpdateChannel,
} from "@/lib/adoption-updates/options";

export type AdoptionUpdateInput = {
  /** YYYY-MM-DD */
  receivedOn: string;
  /** A contacts id, or null when nobody is recorded. */
  senderContactId: string | null;
  channel: string;
  note: string | null;
};

function revalidateResident(residentId: string) {
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/adoption-updates`);
  revalidatePath(`/residents/${residentId}/photos`);
}

/**
 * Records an update from an adopter, or corrects one (`updateId`). Returns
 * the row's id so the form can then send the photos through the resident
 * photo route, tagged with it. The photos come after the row on purpose:
 * record_attachment tags a photo in the same insert that records it, so it
 * needs an update to point at.
 *
 * Only for a resident that has been adopted at some point — currently, or
 * adopted and since returned (the news from their time away still
 * belongs on the record). 0097 leaves that rule to the feature.
 */
export async function saveAdoptionUpdate(
  residentId: string,
  updateId: string | null,
  input: AdoptionUpdateInput,
): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  const e = t.adoptionUpdates.errors;
  return runAction<{ id: string }>("adoptionUpdates.save", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();
    const [{ data: role }, { count: adoptCount, error: adoptError }] = await Promise.all([
      supabase.rpc("current_user_role"),
      supabase
        .from("placement_history")
        .select("id", { count: "exact", head: true })
        .eq("resident_id", residentId)
        .eq("placement_type", "Adopt"),
    ]);
    if (!ADOPTION_UPDATE_ROLES.has(role ?? "")) return { ok: false, error: e.notAuthorized };
    if (adoptError) throw adoptError;
    if (!adoptCount) return { ok: false, error: e.neverAdopted };

    if (!isIsoDate(input.receivedOn)) return { ok: false, error: e.dateRequired };
    if (isFutureDate(input.receivedOn, new Date())) return { ok: false, error: e.dateInFuture };
    if (!isAdoptionUpdateChannel(input.channel)) return { ok: false, error: e.channelRequired };

    const row = {
      received_on: input.receivedOn,
      sender_contact_id: input.senderContactId || null,
      channel: input.channel,
      note: input.note?.trim() || null,
    };

    const { data, error } = updateId
      ? await supabase
          .from("adoption_updates")
          .update(row)
          .eq("id", updateId)
          .eq("resident_id", residentId)
          .select("id")
          .returns<{ id: string }[]>()
      : await supabase
          .from("adoption_updates")
          .insert({ ...row, resident_id: residentId })
          .select("id")
          .returns<{ id: string }[]>();
    if (error) throw error;
    const saved = data?.[0];
    if (!saved) return { ok: false, error: e.notFound };

    revalidateResident(residentId);
    return { ok: true, id: saved.id };
  });
}

/**
 * Deletes an update and, first, every photo that came with it. The
 * foreign key refuses to delete an update that still has photos (0097),
 * and untagging them instead would pass the adopter's photos off as the
 * shelter's — so the confirm step says the photos go too.
 */
export async function deleteAdoptionUpdate(
  residentId: string,
  updateId: string,
): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.adoptionUpdates.errors;
  return runAction("adoptionUpdates.delete", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();
    const { data: role } = await supabase.rpc("current_user_role");
    if (!ADOPTION_UPDATE_ROLES.has(role ?? "")) return { ok: false, error: e.notAuthorized };

    const { data: photos, error: photosError } = await supabase
      .from("attachments")
      .select("id")
      .eq("adoption_update_id", updateId)
      .eq("owner_id", residentId)
      .returns<{ id: string }[]>();
    if (photosError) throw photosError;

    const drive = getDriveClient();
    for (const photo of photos ?? []) {
      const { data: driveFileId, error } = await supabase.rpc("delete_resident_photo", {
        p_attachment_id: photo.id,
      });
      if (error) throw error;
      if (driveFileId) {
        try {
          await drive.deleteFile(driveFileId);
        } catch {
          // As in deletePhoto: the record is gone; an orphaned Drive file is
          // a cleanup matter, not a reason to fail the delete.
        }
      }
    }

    const { data: deleted, error } = await supabase
      .from("adoption_updates")
      .delete()
      .eq("id", updateId)
      .eq("resident_id", residentId)
      .select("id");
    if (error) throw error;
    if (!deleted?.length) return { ok: false, error: e.notFound };

    if ((photos ?? []).length > 0) await refreshDeceasedArchiveIfNeeded(supabase, residentId);
    revalidateResident(residentId);
    return { ok: true };
  });
}
