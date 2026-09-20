"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type IntakeState = { error: string } | undefined;

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
  const weightKgRaw = str(formData, "weightKg");
  const weightKg = weightKgRaw !== null ? Number(weightKgRaw) : null;
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg <= 0)) {
    return { error: t.residents.new.errors.weightPositive };
  }

  const readyForAdoption = formData.get("readyForAdoption") === "on";

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
  });

  if (error) {
    return { error: error.message };
  }

  // record_intake returns the new `residents` row (not a setof), so
  // PostgREST hands it back as a single object, not an array.
  const resident = data as unknown as { id: string };
  redirect(`/residents/${resident.id}`);
}
