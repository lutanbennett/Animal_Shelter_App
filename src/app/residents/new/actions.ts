"use server";

import { redirect } from "next/navigation";
import { databaseFailure, runWriteAction, type ActionRefusal } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { RESIDENT_SIZES, type ResidentSize } from "@/lib/i18n/enum-labels";
import { readAdoptionProfile } from "@/lib/residents/adoption-profile";
import { isDuplicateChipError, readMicrochip } from "@/lib/residents/microchip";
import { parseBloodTestInterval } from "@/lib/residents/blood-test-interval";

export type IntakeState = ActionRefusal | undefined;

/** `{ colour }` → `{ p_colour }`: record_intake's parameter names (0060). */
function prefixed<T extends Record<string, unknown>>(fields: T) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [`p_${key}`, value]),
  );
}

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function recordIntake(
  _state: IntakeState,
  formData: FormData,
): Promise<IntakeState> {
  const { t } = await getT();
  const supabase = await createClient();
  // PI FAILOVER (D): the success path REDIRECTS, and a redirect throws, which would leave the claim open and
  // make a replay read "we cannot tell". So the body returns where to go, the result is stored, and the
  // redirect happens after runWriteAction() has finished the claim. record_intake() is one transaction;
  // the chip update after it is a second write, and a failure there is handled in the body as before.
  const done = await runWriteAction<{ redirectTo: string }>("residents.recordIntake", { somethingWentWrong: t.common.somethingWentWrong, saveUnknown: t.common.saveUnknown, reloadToSave: t.common.reloadToSave }, { id: writeRequestIdFrom(formData), action: "residents.recordIntake", db: supabase }, async () => {
    const name = str(formData, "name");
    const intakeDate = str(formData, "intakeDate");

    if (!name) {
      return { ok: false, error: t.residents.new.errors.nameRequired };
    }
    if (!intakeDate) {
      return { ok: false, error: t.residents.new.errors.intakeDateRequired };
    }

    const estimatedAgeYearsRaw = str(formData, "estimatedAgeYears");
    const estimatedAgeYears =
      estimatedAgeYearsRaw !== null ? Number(estimatedAgeYearsRaw) : null;
    if (estimatedAgeYears !== null && Number.isNaN(estimatedAgeYears)) {
      return { ok: false, error: t.residents.new.errors.ageMustBeNumber };
    }

    // Optional intake weight; record_intake writes it as the first weight
    // row, dated the intake date, in the same transaction (migration 0029).
    // Size is mandatory (0051): it sets the default meal size for the
    // resident's diet, and weight may not be recorded at intake.
    const size = str(formData, "size");
    if (!size || !RESIDENT_SIZES.includes(size as ResidentSize)) {
      return { ok: false, error: t.residents.new.errors.sizeRequired };
    }

    // A diet is mandatory (the form preselects the standard); record_intake
    // refuses a missing one too (0242).
    const dietId = str(formData, "dietId");
    if (!dietId) {
      return { ok: false, error: t.residents.new.errors.dietRequired };
    }

    const weightKgRaw = str(formData, "weightKg");
    const weightKg = weightKgRaw !== null ? Number(weightKgRaw) : null;
    if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg <= 0)) {
      return { ok: false, error: t.residents.new.errors.weightPositive };
    }

    const readyForAdoption = formData.get("readyForAdoption") === "on";

    const bloodTestIntervalMonths = parseBloodTestInterval(
      str(formData, "bloodTestIntervalMonths"),
    );
    if (bloodTestIntervalMonths === null) {
      return { ok: false, error: t.residents.new.errors.bloodTestIntervalInvalid };
    }

    // record_intake predates the chip columns, so the chip is written right
    // after it. Check it first so a bad or duplicate number is refused
    // before a resident exists, not after.
    const chip = readMicrochip(formData);
    if ("invalid" in chip) {
      return { ok: false, error: t.residents.new.errors.microchipInvalid };
    }

    if (chip.microchip_number) {
      const { data: taken } = await supabase
        .from("residents")
        .select("id")
        .eq("microchip_number", chip.microchip_number)
        .limit(1);
      if (taken?.length) {
        return { ok: false, error: t.residents.new.errors.microchipDuplicate };
      }
    }
    const { data, error } = await supabase.rpc("record_intake", {
      p_name: name,
      p_intake_date: intakeDate,
      p_thai_name: str(formData, "thaiName"),
      p_other_names: str(formData, "otherNames"),
      p_species: str(formData, "species"),
      p_breed: str(formData, "breed"),
      p_sex: str(formData, "sex"),
      p_estimated_age_years: estimatedAgeYears,
      p_bio: str(formData, "bio"),
      p_temperament_notes: str(formData, "temperamentNotes"),
      p_past_story_notes: str(formData, "pastStoryNotes"),
      p_behaviour_notes: str(formData, "behaviourNotes"),
      // Ready for adoption and public visibility are the same decision at
      // intake — a resident is never adoption-ready the moment they arrive.
      p_ready_for_adoption: readyForAdoption,
      p_is_public_visible: readyForAdoption,
      p_enclosure_id: str(formData, "enclosureId"),
      p_notes: str(formData, "notes"),
      p_group_origin_id: str(formData, "originId"),
      p_new_origin_name: str(formData, "newOriginName"),
      p_weight_kg: weightKg,
      p_size: size,
      p_diet_id: dietId,
      p_blood_test_interval_months: bloodTestIntervalMonths,
      ...prefixed(readAdoptionProfile(formData)),
    });

    if (error) return databaseFailure("residents.create", error, t.common);

    // record_intake returns the new `residents` row (not a setof), so
    // PostgREST hands it back as a single object, not an array.
    const resident = data as unknown as { id: string };
    if (chip.microchip_number || chip.microchip_implanted_on) {
      const { error: chipError } = await supabase
        .from("residents")
        .update(chip)
        .eq("id", resident.id);
      // The resident exists; a failure here (say a race on a duplicate)
      // sends them to the edit page to fix the chip rather than losing the intake.
      if (chipError) {
        console.error("residents.recordIntake chip", isDuplicateChipError(chipError), chipError.message);
        return { ok: true, redirectTo: `/residents/${resident.id}/edit` };
      }
    }
    return { ok: true, redirectTo: `/residents/${resident.id}` };
  });
  if (done.ok) redirect(done.redirectTo);
  return done;
}
