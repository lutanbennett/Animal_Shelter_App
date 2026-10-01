"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runAction, type ActionRefusal } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { RESIDENT_SIZES, type ResidentSize } from "@/lib/i18n/enum-labels";
import {
  HOOK_LINE_MAX,
  IDEAL_HOME_MAX,
  readAdoptionCopy,
  readAdoptionProfile,
} from "@/lib/residents/adoption-profile";
import { isDuplicateChipError, readMicrochip } from "@/lib/residents/microchip";
import { parseBloodTestInterval } from "@/lib/residents/blood-test-interval";
import { estimatedAgeNow, todayIso } from "@/lib/format";
import { moveResidentToEnclosure } from "@/lib/placements/move";
import { refreshDeceasedArchiveIfNeeded } from "@/lib/archive/refresh-deceased-archive";
import { setResidentProfilePhoto } from "@/lib/residents/profile-photo";

export type EditResidentState = ActionRefusal | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Updates a resident's identity/bio fields and (optionally) profile photo.
 * If the form's housing section picked a different enclosure, a
 * ChangeEnclosure placement is recorded afterwards through the same helper
 * the hub's move page uses — residents.* never stores housing itself.
 * Bound to the resident id from the edit page.
 */
export async function updateResident(
  residentId: string,
  _state: EditResidentState,
  formData: FormData,
): Promise<EditResidentState> {
  const { t } = await getT();
  return runAction<never>("residents.updateResident", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();

    // RLS would silently match zero rows for a volunteer/vet rather than
    // error, so check the role up front and give a real message.
    const { data: role } = await supabase.rpc("current_user_role");
    if (role !== "admin" && role !== "management" && role !== "staff") {
      return { ok: false, error: t.residents.edit.notAuthorized };
    }

    // A deceased resident's record is closed except for the bio and photos
    // (0026, 0052): the form only shows those sections, and this writes only
    // those columns — anything else would trip the lock.
    const { data: state } = await supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", residentId)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>();
    if (state?.[0]?.is_deceased) {
      return updateDeceasedResident(supabase, t, residentId, formData);
    }

    const name = str(formData, "name");
    if (!name) return { ok: false, error: t.residents.edit.errors.nameRequired };

    const estimatedAgeYearsRaw = str(formData, "estimatedAgeYears");
    const estimatedAgeYears =
      estimatedAgeYearsRaw !== null ? Number(estimatedAgeYearsRaw) : null;
    if (estimatedAgeYears !== null && Number.isNaN(estimatedAgeYears)) {
      return { ok: false, error: t.residents.edit.errors.ageMustBeNumber };
    }

    const [{ data: currentRows }, { data: placementRows }] = await Promise.all([
      supabase
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
        >(),
      supabase
        .from("placement_history")
        .select("enclosure_id")
        .eq("resident_id", residentId)
        .is("end_date", null)
        .limit(1)
        .returns<{ enclosure_id: string | null }[]>(),
    ]);
    const current = currentRows?.[0];
    if (!current) return { ok: false, error: t.residents.edit.errors.notFound };
    const currentEnclosureId = placementRows?.[0]?.enclosure_id ?? null;

    // The form shows the age as it reads *today*. Only if that number was
    // changed do we store a new estimate anchored to today; otherwise the
    // stored estimate and its date are left alone so the resident doesn't get
    // younger every time someone fixes a typo elsewhere on the form.
    const ageNow = estimatedAgeNow(current.estimated_age_years, current.age_estimated_on);
    const ageChanged = estimatedAgeYears !== ageNow;
    const ageFields = ageChanged
      ? {
          estimated_age_years: estimatedAgeYears,
          age_estimated_on:
            estimatedAgeYears === null ? null : todayIso(),
        }
      : {};

    // Ready for adoption and public visibility are the same decision, as at
    // intake — there's no separate "public but not adoptable" state today.
    const readyForAdoption = formData.get("readyForAdoption") === "on";

    // Required on every save (0051), so a resident intaken before the size
    // field existed picks one up the first time their details are edited.
    const size = str(formData, "size");
    if (!size || !RESIDENT_SIZES.includes(size as ResidentSize)) {
      return { ok: false, error: t.residents.new.errors.sizeRequired };
    }

    const adoptionCopy = readAdoptionCopy(formData);
    if ("tooLong" in adoptionCopy) {
      return {
        ok: false,
        error:
          adoptionCopy.tooLong === "hookLine"
            ? t.residents.edit.errors.hookLineTooLong(HOOK_LINE_MAX)
            : t.residents.edit.errors.idealHomeTooLong(IDEAL_HOME_MAX),
      };
    }

    const bloodTestIntervalMonths = parseBloodTestInterval(
      str(formData, "bloodTestIntervalMonths"),
    );
    if (bloodTestIntervalMonths === null) {
      return { ok: false, error: t.residents.new.errors.bloodTestIntervalInvalid };
    }

    const chip = readMicrochip(formData);
    if ("invalid" in chip) {
      return { ok: false, error: t.residents.new.errors.microchipInvalid };
    }

    const { data: updated, error } = await supabase
      .from("residents")
      // resident_code is system-assigned at intake and deliberately not here.
      .update({
        name,
        thai_name: str(formData, "thaiName"),
        other_names: str(formData, "otherNames"),
        species: str(formData, "species"),
        breed: str(formData, "breed"),
        sex: str(formData, "sex"),
        size,
        ...ageFields,
        bio: str(formData, "bio"),
        temperament_notes: str(formData, "temperamentNotes"),
        past_story_notes: str(formData, "pastStoryNotes"),
        behaviour_notes: str(formData, "behaviourNotes"),
        ready_for_adoption: readyForAdoption,
        is_public_visible: readyForAdoption,
        blood_test_interval_months: bloodTestIntervalMonths,
        ...readAdoptionProfile(formData),
        ...adoptionCopy,
        ...chip,
      })
      .eq("id", residentId)
      .select("id")
      .returns<{ id: string }[]>();

    if (error) {
      return {
        ok: false,
        error: isDuplicateChipError(error) ? t.residents.new.errors.microchipDuplicate : error.message,
      };
    }
    if (!updated?.[0]) return { ok: false, error: t.residents.edit.errors.notFound };

    // Profile photo goes through the one helper, so the Medical refusal and
    // the RPC's "file must belong to this resident" check (0013) stay in one place.
    const profilePhotoDriveFileId = str(formData, "profilePhotoDriveFileId");
    if (
      profilePhotoDriveFileId &&
      profilePhotoDriveFileId !== current.profile_photo_drive_file_id
    ) {
      const refused = await setResidentProfilePhoto(supabase, t, residentId, profilePhotoDriveFileId);
      if (refused) return { ok: false, error: refused.error };
    }

    // A blank enclosure means "leave housing alone" (the picker starts blank
    // when the resident is in a Lifecycle pseudo-enclosure); the current
    // enclosure re-submitted unchanged is the same thing. Runs after the
    // resident update, so an error here leaves those fields saved and only
    // the move to retry.
    const enclosureId = str(formData, "enclosureId");
    if (enclosureId && enclosureId !== currentEnclosureId) {
      const moved = await moveResidentToEnclosure(supabase, t, {
        residentId,
        enclosureId,
        moveDate: str(formData, "moveDate") ?? "",
        notes: str(formData, "moveNotes"),
      });
      if ("error" in moved) return { ok: false, error: moved.error };
      revalidatePath(`/residents/${residentId}/housing`);
      revalidatePath("/enclosures", "layout");
    }

    revalidatePath("/residents");
    revalidatePath(`/residents/${residentId}`);
    revalidatePath(`/residents/${residentId}/photos`);
    // Name/visibility changes show up on the public adoption pages too.
    revalidatePath("/adopt");
    revalidatePath(`/adopt/${residentId}`);
    redirect(`/residents/${residentId}`);
  });
}

/**
 * The after-death edit: bio group and profile photo only, then the Drive
 * archive (summary PDF + offline index, both of which show these) is
 * regenerated so it doesn't drift from the record.
 */
async function updateDeceasedResident(
  supabase: Awaited<ReturnType<typeof createClient>>,
  t: Awaited<ReturnType<typeof getT>>["t"],
  residentId: string,
  formData: FormData,
): Promise<ActionRefusal> {
  const { data: currentRows } = await supabase
    .from("residents")
    .select("profile_photo_drive_file_id")
    .eq("id", residentId)
    .limit(1)
    .returns<{ profile_photo_drive_file_id: string | null }[]>();
  const current = currentRows?.[0];
  if (!current) return { ok: false, error: t.residents.edit.errors.notFound };

  const { data: updated, error } = await supabase
    .from("residents")
    .update({
      bio: str(formData, "bio"),
      temperament_notes: str(formData, "temperamentNotes"),
      past_story_notes: str(formData, "pastStoryNotes"),
      behaviour_notes: str(formData, "behaviourNotes"),
    })
    .eq("id", residentId)
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return { ok: false, error: error.message };
  if (!updated?.[0]) return { ok: false, error: t.residents.edit.errors.notFound };

  const profilePhotoDriveFileId = str(formData, "profilePhotoDriveFileId");
  if (profilePhotoDriveFileId && profilePhotoDriveFileId !== current.profile_photo_drive_file_id) {
    const refused = await setResidentProfilePhoto(supabase, t, residentId, profilePhotoDriveFileId);
    if (refused) return { ok: false, error: refused.error };
  }

  // The edit is saved and a Drive hiccup does not undo it, but it must not
  // pass silently: the hub opens with a warning and its Refresh archive
  // button (decisions 2026-10-01).
  const refresh = await refreshDeceasedArchiveIfNeeded(supabase, residentId);

  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/photos`);
  redirect(`/residents/${residentId}${refresh.error ? "?archive=stale" : ""}`);
}
