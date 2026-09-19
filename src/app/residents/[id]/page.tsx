import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ResidentHub,
  type BloodTestRow,
  type ImmunizationRecordRow,
  type MissingImmunizationRow,
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
    weightResult,
    proceduresResult,
    bloodTestsResult,
    attachmentsCountResult,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select(
        "id, name, animal_code, thai_name, other_names, species, breed, sex, estimated_age_years, intake_date, bio, temperament_notes, past_story_notes, behaviour_notes, profile_photo_drive_file_id, ready_for_adoption, is_public_visible",
      )
      .eq("id", id)
      .limit(1)
      .returns<Resident[]>(),
    supabase
      .from("resident_list_view")
      .select(
        "current_status, enclosure_id, enclosure_name, zone_id, zone_name, zone_internal",
      )
      .eq("resident_id", id)
      .limit(1)
      .returns<ResidentStatus[]>(),
    supabase
      .from("resident_current_state")
      .select("current_carer_id, is_deceased, date_of_death")
      .eq("resident_id", id)
      .limit(1)
      .returns<
        { current_carer_id: string | null; is_deceased: boolean; date_of_death: string | null }[]
      >(),
    supabase
      .from("placement_history")
      .select("start_date")
      .eq("resident_id", id)
      .is("end_date", null)
      .limit(1)
      .returns<{ start_date: string }[]>(),
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
      .from("weight")
      .select("id, date, weight_kg")
      .eq("resident_id", id)
      .order("date", { ascending: false })
      .returns<WeightRow[]>(),
    supabase
      .from("procedures")
      .select("id, procedure_type, date")
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
  ]);

  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const carerId = currentStateResult.data?.[0]?.current_carer_id ?? null;
  const carerResult = carerId
    ? await supabase
        .from("contacts")
        .select("name")
        .eq("id", carerId)
        .limit(1)
        .returns<{ name: string }[]>()
    : null;

  return (
    <ResidentHub
      resident={resident}
      status={listViewResult.data?.[0] ?? null}
      isDeceased={currentStateResult.data?.[0]?.is_deceased ?? false}
      dateOfDeath={currentStateResult.data?.[0]?.date_of_death ?? null}
      currentPlacementSince={currentPlacementResult.data?.[0]?.start_date ?? null}
      carerName={carerResult?.data?.[0]?.name ?? null}
      placementHistoryCount={placementCountResult.count ?? 0}
      immunizationRecords={immunizationRecordsResult.data ?? []}
      missingMandatoryImmunizations={missingMandatoryResult.data ?? []}
      vetAppointments={vetAppointmentsResult.data ?? []}
      prescriptions={prescriptionsResult.data ?? []}
      weightEntries={weightResult.data ?? []}
      procedures={proceduresResult.data ?? []}
      bloodTests={bloodTestsResult.data ?? []}
      photoCount={attachmentsCountResult.count ?? 0}
      now={new Date().toISOString()}
    />
  );
}
