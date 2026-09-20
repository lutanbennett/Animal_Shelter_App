"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { estimatedAgeNow } from "@/lib/format";

export type EditResidentState = { error: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Updates a resident's identity/bio fields and (optionally) profile photo.
 * Housing is deliberately not touched here — that lives in placement_history
 * and has its own actions. Bound to the resident id from the edit page.
 */
export async function updateResident(
  residentId: string,
  _state: EditResidentState,
  formData: FormData,
): Promise<EditResidentState> {
  const { t } = await getT();
  const supabase = await createClient();

  // RLS would silently match zero rows for a volunteer/vet rather than
  // error, so check the role up front and give a real message.
  const { data: role } = await supabase.rpc("current_user_role");
  if (role !== "admin" && role !== "staff") {
    return { error: t.residents.edit.notAuthorized };
  }

  const name = str(formData, "name");
  if (!name) return { error: t.residents.edit.errors.nameRequired };

  const estimatedAgeYearsRaw = str(formData, "estimatedAgeYears");
  const estimatedAgeYears =
    estimatedAgeYearsRaw !== null ? Number(estimatedAgeYearsRaw) : null;
  if (estimatedAgeYears !== null && Number.isNaN(estimatedAgeYears)) {
    return { error: t.residents.edit.errors.ageMustBeNumber };
  }

  const { data: currentRows } = await supabase
    .from("residents")
    .select("estimated_age_years, age_estimated_on, profile_photo_drive_file_id")
    .eq("id", residentId)
    .limit(1)
    .returns<
      {
        estimated_age_years: number | null;
        age_estimated_on: string | null;
        profile_photo_drive_file_id: string | null;
      }[]
    >();
  const current = currentRows?.[0];
  if (!current) return { error: t.residents.edit.errors.notFound };

  // The form shows the age as it reads *today*. Only if that number was
  // changed do we store a new estimate anchored to today; otherwise the
  // stored estimate and its date are left alone so the animal doesn't get
  // younger every time someone fixes a typo elsewhere on the form.
  const ageNow = estimatedAgeNow(current.estimated_age_years, current.age_estimated_on);
  const ageChanged = estimatedAgeYears !== ageNow;
  const ageFields = ageChanged
    ? {
        estimated_age_years: estimatedAgeYears,
        age_estimated_on:
          estimatedAgeYears === null ? null : new Date().toISOString().slice(0, 10),
      }
    : {};

  // Ready for adoption and public visibility are the same decision, as at
  // intake — there's no separate "public but not adoptable" state today.
  const readyForAdoption = formData.get("readyForAdoption") === "on";

  const { data: updated, error } = await supabase
    .from("residents")
    // animal_code is system-assigned at intake and deliberately not here.
    .update({
      name,
      thai_name: str(formData, "thaiName"),
      other_names: str(formData, "otherNames"),
      species: str(formData, "species"),
      breed: str(formData, "breed"),
      sex: str(formData, "sex"),
      ...ageFields,
      bio: str(formData, "bio"),
      temperament_notes: str(formData, "temperamentNotes"),
      past_story_notes: str(formData, "pastStoryNotes"),
      behaviour_notes: str(formData, "behaviourNotes"),
      ready_for_adoption: readyForAdoption,
      is_public_visible: readyForAdoption,
    })
    .eq("id", residentId)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) return { error: error.message };
  if (!updated?.[0]) return { error: t.residents.edit.errors.notFound };

  // Profile photo goes through the existing RPC so the "file must belong to
  // this resident" check stays in one place (0013_resident_photo_attachments).
  const profilePhotoDriveFileId = str(formData, "profilePhotoDriveFileId");
  if (
    profilePhotoDriveFileId &&
    profilePhotoDriveFileId !== current.profile_photo_drive_file_id
  ) {
    const { error: photoError } = await supabase.rpc(
      "set_resident_profile_photo",
      { p_resident_id: residentId, p_drive_file_id: profilePhotoDriveFileId },
    );
    if (photoError) return { error: photoError.message };
  }

  revalidatePath("/residents");
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/photos`);
  // Name/visibility changes show up on the public adoption pages too.
  revalidatePath("/adopt");
  revalidatePath(`/adopt/${residentId}`);
  redirect(`/residents/${residentId}`);
}
