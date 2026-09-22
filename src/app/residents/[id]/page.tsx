import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DECEASED_ROLES, UNDO_DECEASED_ROLES } from "@/lib/placements/deceased";
import { canManage } from "@/lib/auth/require-management";
import { getTagOrigin } from "@/lib/tags/origin";
import { loadTranslations } from "@/lib/translations/queries";
import {
  ResidentHub,
  type BloodTestRow,
  type ImmunizationRecordRow,
  type MissingImmunizationRow,
  type DietRow,
  type PrescriptionRow,
  type ProcedureRow,
  type Resident,
  type ResidentStatus,
  type VetAppointmentRow,
  type WeightRow,
} from "./ResidentHub";

export default async function ResidentPage(
  props: PageProps<"/residents/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [
    residentResult,
    listViewResult,
    currentStateResult,
    currentPlacementResult,
    placementCountResult,
    immunizationRecordsResult,
    missingMandatoryResult,
    vetAppointmentsResult,
    prescriptionsResult,
    dietsResult,
    weightResult,
    proceduresResult,
    bloodTestsResult,
    attachmentsCountResult,
    roleResult,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select(
        "id, name, resident_code, thai_name, other_names, species, breed, sex, size, estimated_age_years, age_estimated_on, intake_date, bio, temperament_notes, past_story_notes, behaviour_notes, profile_photo_drive_file_id, ready_for_adoption, is_public_visible, drive_folder_id, deceased_summary_drive_file_id, deceased_index_drive_file_id, deceased_archived_at, colour, is_desexed, good_with_dogs, good_with_cats, good_with_children, energy_level, blood_test_interval_months",
      )
      .eq("id", id)
      .limit(1)
      .returns<Resident[]>(),
    supabase
      .from("resident_list_view")
      .select(
        "current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_id, zone_name, zone_name_th, zone_internal",
      )
      .eq("resident_id", id)
      .limit(1)
      .returns<ResidentStatus[]>(),
    supabase
      .from("resident_current_state")
      .select(
        "current_status, current_carer_id, active_hospital_previous_enclosure, is_deceased, date_of_death",
      )
      .eq("resident_id", id)
      .limit(1)
      .returns<
        {
          current_status: string | null;
          current_carer_id: string | null;
          active_hospital_previous_enclosure: string | null;
          is_deceased: boolean;
          date_of_death: string | null;
        }[]
      >(),
    supabase
      .from("placement_history")
      .select("start_date, cause_of_death")
      .eq("resident_id", id)
      .is("end_date", null)
      .limit(1)
      .returns<{ start_date: string; cause_of_death: string | null }[]>(),
    supabase
      .from("placement_history")
      .select("id", { count: "exact", head: true })
      .eq("resident_id", id),
    supabase
      .from("immunization_records")
      .select("id, date_administered, immunization_types(name)")
      .eq("resident_id", id)
      .order("date_administered", { ascending: false })
      .returns<ImmunizationRecordRow[]>(),
    supabase
      .from("immunization_compliance")
      .select("immunization_type_name")
      .eq("resident_id", id)
      .returns<MissingImmunizationRow[]>(),
    supabase
      .from("vet_appointments")
      .select("id, appointment_date, status, reason")
      .eq("resident_id", id)
      .order("appointment_date", { ascending: false })
      .returns<VetAppointmentRow[]>(),
    supabase
      .from("prescriptions")
      .select("id, start_date, end_date, medication(name)")
      .eq("resident_id", id)
      .order("start_date", { ascending: false })
      .returns<PrescriptionRow[]>(),
    supabase
      .from("resident_diets")
      .select("id, start_date, end_date, diet_types(name)")
      .eq("resident_id", id)
      .order("start_date", { ascending: false })
      .returns<DietRow[]>(),
    supabase
      .from("weight")
      .select("id, date, weight_kg")
      .eq("resident_id", id)
      .order("date", { ascending: false })
      .returns<WeightRow[]>(),
    supabase
      .from("procedures")
      .select("id, date, procedure_types(name)")
      .eq("resident_id", id)
      .order("date", { ascending: false })
      .returns<ProcedureRow[]>(),
    supabase
      .from("blood_tests")
      .select("id, date")
      .eq("resident_id", id)
      .order("date", { ascending: false })
      .returns<BloodTestRow[]>(),
    supabase
      .from("attachments")
      .select("id", { count: "exact", head: true })
      .eq("owner_type", "resident")
      .eq("owner_id", id),
    // Drives which of the record-death / retry-archive controls the hub
    // offers; the server action checks the role again before writing.
    supabase.rpc("current_user_role"),
  ]);

  // A query error (e.g. a migration not yet applied) must not look like a
  // missing resident — surface it instead of a 404.
  if (residentResult.error) throw new Error(residentResult.error.message);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const currentState = currentStateResult.data?.[0];
  const carerId = currentState?.current_carer_id ?? null;
  // previous_enclosure_id is set on every ChangeEnclosure too; only read it
  // as "where they'll return to" while the resident is actually in hospital.
  const previousEnclosureId =
    currentState?.current_status === "Hospitalised"
      ? currentState.active_hospital_previous_enclosure
      : null;
  const [carerResult, previousEnclosureResult, translations, tagOrigin] = await Promise.all([
    carerId
      ? supabase
          .from("contacts")
          .select("name")
          .eq("id", carerId)
          .limit(1)
          .returns<{ name: string }[]>()
      : null,
    previousEnclosureId
      ? supabase
          .from("enclosures")
          .select("name")
          .eq("id", previousEnclosureId)
          .limit(1)
          .returns<{ name: string }[]>()
      : null,
    // The other-language versions of the public profile fields (0056).
    loadTranslations(supabase, "residents", [id]),
    getTagOrigin(),
  ]);

  return (
    <ResidentHub
      resident={resident}
      status={listViewResult.data?.[0] ?? null}
      isDeceased={currentState?.is_deceased ?? false}
      dateOfDeath={currentState?.date_of_death ?? null}
      causeOfDeath={currentPlacementResult.data?.[0]?.cause_of_death ?? null}
      archive={{
        archivedAt: resident.deceased_archived_at,
        summaryDriveFileId: resident.deceased_summary_drive_file_id,
        indexDriveFileId: resident.deceased_index_drive_file_id,
        driveFolderId: resident.drive_folder_id,
      }}
      canRecordDeath={DECEASED_ROLES.has(roleResult.data ?? "")}
      canUndoDeath={UNDO_DECEASED_ROLES.has(roleResult.data ?? "")}
      canManageTranslations={canManage(roleResult.data)}
      translations={Array.from(translations.values())}
      currentPlacementSince={currentPlacementResult.data?.[0]?.start_date ?? null}
      carerName={carerResult?.data?.[0]?.name ?? null}
      hospitalPreviousEnclosureName={previousEnclosureResult?.data?.[0]?.name ?? null}
      placementHistoryCount={placementCountResult.count ?? 0}
      immunizationRecords={immunizationRecordsResult.data ?? []}
      missingMandatoryImmunizations={missingMandatoryResult.data ?? []}
      vetAppointments={vetAppointmentsResult.data ?? []}
      prescriptions={prescriptionsResult.data ?? []}
      diets={dietsResult.data ?? []}
      weightEntries={weightResult.data ?? []}
      procedures={proceduresResult.data ?? []}
      bloodTests={bloodTestsResult.data ?? []}
      photoCount={attachmentsCountResult.count ?? 0}
      now={new Date().toISOString()}
      tagOrigin={tagOrigin}
    />
  );
}
