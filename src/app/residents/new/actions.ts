"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { RESIDENT_SIZES, type ResidentSize } from "@/lib/i18n/enum-labels";
import { readAdoptionProfile } from "@/lib/residents/adoption-profile";
import { parseBloodTestInterval } from "@/lib/residents/blood-test-interval";

export type IntakeState = { error: string } | undefined;

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
  const name = str(formData, "name");
  const intakeDate = str(formData, "intakeDate");

  if (!name) {
    return { error: t.residents.new.errors.nameRequired };
  }
  if (!intakeDate) {
    return { error: t.residents.new.errors.intakeDateRequired };
  }

  const estimatedAgeYearsRaw = str(formData, "estimatedAgeYears");
  const estimatedAgeYears =
    estimatedAgeYearsRaw !== null ? Number(estimatedAgeYearsRaw) : null;
  if (estimatedAgeYears !== null && Number.isNaN(estimatedAgeYears)) {
    return { error: t.residents.new.errors.ageMustBeNumber };
  }

  // Optional intake weight; record_intake writes it as the first weight
  // row, dated the intake date, in the same transaction (migration 0029).
  // Size is mandatory (0051): it sets the default meal size for the
  // resident's diet, and weight may not be recorded at intake.
  const size = str(formData, "size");
  if (!size || !RESIDENT_SIZES.includes(size as ResidentSize)) {
    return { error: t.residents.new.errors.sizeRequired };
  }

  const weightKgRaw = str(formData, "weightKg");
  const weightKg = weightKgRaw !== null ? Number(weightKgRaw) : null;
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg <= 0)) {
    return { error: t.residents.new.errors.weightPositive };
  }

  const readyForAdoption = formData.get("readyForAdoption") === "on";

  const bloodTestIntervalMonths = parseBloodTestInterval(
    str(formData, "bloodTestIntervalMonths"),
  );
  if (bloodTestIntervalMonths === null) {
    return { error: t.residents.new.errors.bloodTestIntervalInvalid };
  }

  const supabase = await createClient();
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
    p_diet_type_id: str(formData, "dietTypeId"),
    p_blood_test_interval_months: bloodTestIntervalMonths,
    ...prefixed(readAdoptionProfile(formData)),
  });

  if (error) {
    return { error: error.message };
  }

  // record_intake returns the new `residents` row (not a setof), so
  // PostgREST hands it back as a single object, not an array.
  const resident = data as unknown as { id: string };
  redirect(`/residents/${resident.id}`);
}
