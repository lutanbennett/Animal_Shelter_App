import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { contactRelation } from "@/lib/contacts/visibility";
import { readsWhoAndWhereOnly, requireFullResident } from "@/lib/residents/who-and-where";
import { loadResidentCard } from "@/lib/residents/card";
import { getTagOrigin } from "@/lib/tags/origin";
import { loadTranslations } from "@/lib/translations/queries";
import { placeName } from "@/lib/enclosures/names";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
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
  type ClinicVisitRow,
  type WeightRow,
} from "./ResidentHub";

export default async function ResidentPage(
  props: PageProps<"/residents/[id]">,
) {
  const { id } = await props.params;
  const { archive: archiveFlag } = await props.searchParams;
  const supabase = await createClient();

  // A login that may not open the record (a volunteer, the 2IC, the Heads: 0134) gets the name
  // card's page: never less than a stranger sees, plus where it lives and their own jobs.
  if (await readsWhoAndWhereOnly()) redirect(`/r/${id}`);
  // Everyone else opens on the same guard as the record's own pages: a role that holds no read
  // of the record gets the no-access page, not whatever RLS leaves of it. After the redirect,
  // because a who-and-where login may hold no resident.record and must still reach the card.
  await requireFullResident();

  const [
    residentResult,
    listViewResult,
    currentStateResult,
    currentPlacementResult,
    placementCountResult,
    immunizationRecordsResult,
    missingMandatoryResult,
    clinicVisitsResult,
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
        "current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_id, zone_name, zone_name_th, zone_internal, zone_colour",
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
      .select("id, date_administered, immunization_types:picker_immunization_types(name, name_th)")
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("date_administered", { ascending: false })
      .returns<ImmunizationRecordRow[]>(),
    supabase
      .from("immunization_compliance")
      .select("immunization_type_id, immunization_type_name")
      .eq("resident_id", id)
      .returns<MissingImmunizationRow[]>(),
    supabase
      .from("clinic_visits")
      .select("id, appointment_date, status, reason")
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("appointment_date", { ascending: false })
      .returns<ClinicVisitRow[]>(),
    supabase
      .from("prescriptions")
      .select("id, start_date, end_date, medication:picker_medications(name, name_th)")
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("start_date", { ascending: false })
      .returns<PrescriptionRow[]>(),
    supabase
      .from("resident_diets")
      .select("id, start_date, end_date, diet_types:picker_diet_types(name, name_th)")
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
      .select("id, date, procedure_types(name, name_th)")
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
  if (!resident) {
    // A doctor sees only the residents their clinics treat (0108): the card, not a 404, for the rest.
    if (await loadResidentCard(supabase, id)) redirect(`/r/${id}`);
    notFound();
  }

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
          .from(contactRelation(perms))
          .select("name")
          .eq("id", carerId)
          .limit(1)
          .returns<{ name: string }[]>()
      : null,
    previousEnclosureId
      ? supabase
          .from("enclosures")
          .select("name, name_th")
          .eq("id", previousEnclosureId)
          .limit(1)
          .returns<{ name: string; name_th: string | null }[]>()
      : null,
    // The other-language versions of the public profile fields (0056).
    loadTranslations(supabase, "residents", [id]),
    getTagOrigin(),
  ]);

  // The hub prints `.name`, so labels arrive in the reader's language (0166).
  const { locale } = await getT();
  const local = <T extends { name: string; name_th?: string | null }>(x: T | null) =>
    x && { ...x, name: localLabel(locale, x.name, x.name_th) };
  // immunization_compliance carries no Thai (0166 kept that private view narrow): the
  // picker view has it, by id.
  const missing = missingMandatoryResult.data ?? [];
  const missingTh =
    locale === "th" && missing.length > 0
      ? (
          await supabase
            .from("picker_immunization_types")
            .select("id, name_th")
            .in("id", missing.map((m) => m.immunization_type_id))
            .returns<{ id: string; name_th: string | null }[]>()
        ).data ?? []
      : [];

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
      hospitalPreviousEnclosureName={
        previousEnclosureResult?.data?.[0]
          ? placeName(locale, previousEnclosureResult.data[0].name, previousEnclosureResult.data[0].name_th)
          : null
      }
      placementHistoryCount={placementCountResult.count ?? 0}
      immunizationRecords={(immunizationRecordsResult.data ?? []).map((r) => ({
        ...r,
        immunization_types: local(r.immunization_types),
      }))}
      missingMandatoryImmunizations={missing.map((m) => ({
        ...m,
        immunization_type_name: localLabel(
          locale,
          m.immunization_type_name,
          missingTh.find((x) => x.id === m.immunization_type_id)?.name_th,
        ),
      }))}
      clinicVisits={clinicVisitsResult.data ?? []}
      prescriptions={(prescriptionsResult.data ?? []).map((p) => ({ ...p, medication: local(p.medication) }))}
      diets={(dietsResult.data ?? []).map((d) => ({ ...d, diet_types: local(d.diet_types) }))}
      weightEntries={weightResult.data ?? []}
      procedures={(proceduresResult.data ?? []).map((p) => ({ ...p, procedure_types: local(p.procedure_types) }))}
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
