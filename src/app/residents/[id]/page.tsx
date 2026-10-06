import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { contactRelation } from "@/lib/contacts/visibility";
import { readsWhoAndWhereOnly } from "@/lib/residents/who-and-where";
import { ResidentWhoAndWhere } from "./ResidentWhoAndWhere";
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
  const { archive: archiveFlag } = await props.searchParams;
  const supabase = await createClient();

  // A volunteer's page for a resident is who it is and where it lives and nothing more (0134).
  if (await readsWhoAndWhereOnly()) return <ResidentWhoAndWhere id={id} />;

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
    perms,
    adoptionUpdatesResult,
    adoptCountResult,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select(
        "id, name, resident_code, thai_name, other_names, species, breed, sex, size, estimated_age_years, age_estimated_on, intake_date, bio, temperament_notes, past_story_notes, behaviour_notes, hook_line, ideal_home, profile_photo_drive_file_id, ready_for_adoption, is_public_visible, drive_folder_id, deceased_summary_drive_file_id, deceased_index_drive_file_id, deceased_archived_at, colour, is_desexed, good_with_dogs, good_with_cats, good_with_children, energy_level, blood_test_interval_months, microchip_number, microchip_implanted_on",
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
      .is("archived_at", null)
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
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("appointment_date", { ascending: false })
      .returns<VetAppointmentRow[]>(),
    supabase
      .from("prescriptions")
      .select("id, start_date, end_date, medication:picker_medications(name)")
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("start_date", { ascending: false })
      .returns<PrescriptionRow[]>(),
    supabase
      .from("resident_diets")
      .select("id, start_date, end_date, diet_types:picker_diet_types(name)")
      .eq("resident_id", id)
      .order("start_date", { ascending: false })
      .returns<DietRow[]>(),
    supabase
      .from("weight")
      .select("id, date, weight_kg")
      .is("archived_at", null)
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
    // The permissions: the controls the hub offers ask can(), and the contacts scope picks the
    // address-book view the carer's name is read through (contacts/visibility.ts).
    loadPermissions(),
    // Newest first; the card shows how many and the latest (0097).
    supabase
      .from("adoption_updates")
      .select("id, received_on, channel")
      .eq("resident_id", id)
      .order("received_on", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<{ id: string; received_on: string; channel: string }[]>(),
    supabase
      .from("placement_history")
      .select("id", { count: "exact", head: true })
      .eq("resident_id", id)
      .eq("placement_type", "Adopt"),
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
          .from(contactRelation(perms?.scopes.contacts))
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
        // Set by the after-death edit when Drive could not be refreshed.
        notRefreshed: archiveFlag === "stale",
        photoMissing: archiveFlag === "nophoto",
      }}
      canRecordDeath={can(perms, "placement.death")}
      canUndoDeath={can(perms, "placement.death_withdraw")}
      canManageTranslations={can(perms, "translations.manage")}
      canSetMicrochip={can(perms, "resident.microchip")}
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
      adoptionUpdates={{
        count: adoptionUpdatesResult.data?.length ?? 0,
        latest: adoptionUpdatesResult.data?.[0] ?? null,
        everAdopted: (adoptCountResult.count ?? 0) > 0,
        canAdd:
          can(perms, "resident.adoption_news") && (adoptCountResult.count ?? 0) > 0,
      }}
      now={new Date().toISOString()}
      tagOrigin={tagOrigin}
    />
  );
}
