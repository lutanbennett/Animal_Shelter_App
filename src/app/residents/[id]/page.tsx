import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { contactRelation } from "@/lib/contacts/visibility";
import { requireFullResident } from "@/lib/residents/who-and-where";
import { loadResidentCard } from "@/lib/residents/card";
import { getTagOrigin } from "@/lib/tags/origin";
import { loadTranslations } from "@/lib/translations/queries";
import { placeName } from "@/lib/enclosures/names";
import { SECTION_READS } from "@/lib/residents/section-reads";
import { getT } from "@/lib/i18n/get-t";
import { isMedicalFolder } from "@/lib/google/drive-client";
import { canBrowseMemes, loadResidentMemes } from "@/lib/memes/queries";
import type { AppealStatus } from "@/lib/appeals/state";
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

/** What a read that was skipped hands back: the same shape as a query that found nothing. */
const SKIPPED = { data: null, error: null, count: null } as const;

/** Runs `query` only when `show`: a builder that is never awaited never reaches the database. */
function when<T>(show: boolean, query: PromiseLike<T>): PromiseLike<T | typeof SKIPPED> {
  return show ? query : Promise.resolve(SKIPPED);
}

export default async function ResidentPage(
  props: PageProps<"/residents/[id]">,
) {
  const { id } = await props.params;
  const { archive: archiveFlag } = await props.searchParams;
  const supabase = await createClient();

  // The same guard as the record's own pages: a role that holds no read of the record gets the
  // no-access page, not whatever RLS leaves of it.
  await requireFullResident();

  // Which parts of the record this login may read (section-reads.ts, the map the section pages use). A part it
  // cannot read is not drawn and not queried: the database would return no rows, and a tile saying "0 · none"
  // would be false, not hidden.
  const perms = await loadPermissions();
  const show = Object.fromEntries(
    Object.entries(SECTION_READS).map(([section, activity]) => [section, can(perms, activity, "read")]),
  ) as Record<keyof typeof SECTION_READS, boolean>;

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
    adoptionUpdatesResult,
    adoptCountResult,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select(
        "id, name, resident_code, thai_name, other_names, species, breed, breed_th, sex, size, estimated_age_years, age_estimated_on, intake_date, bio, temperament_notes, past_story_notes, behaviour_notes, hook_line, ideal_home, profile_photo_drive_file_id, ready_for_adoption, is_public_visible, drive_folder_id, deceased_summary_drive_file_id, deceased_index_drive_file_id, deceased_archived_at, colour, colour_th, is_desexed, good_with_dogs, good_with_cats, good_with_children, energy_level, blood_test_interval_months, microchip_number, microchip_implanted_on",
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
    when(show.immunizations, supabase
      .from("immunization_records")
      .select("id, date_administered, immunization_types:picker_immunization_types(name, name_th)")
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("date_administered", { ascending: false })
      .returns<ImmunizationRecordRow[]>()),
    when(show.immunizations, supabase
      .from("immunization_compliance")
      .select("immunization_type_id, immunization_type_name")
      .eq("resident_id", id)
      .returns<MissingImmunizationRow[]>()),
    when(show["clinic-visits"], supabase
      .from("clinic_visits")
      .select("id, appointment_date, status, reason")
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("appointment_date", { ascending: false })
      .returns<ClinicVisitRow[]>()),
    when(show.prescriptions, supabase
      .from("prescriptions")
      .select("id, start_date, end_date, medication:picker_medications(name, name_th)")
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("start_date", { ascending: false })
      .returns<PrescriptionRow[]>()),
    when(show.diet, supabase
      .from("resident_diets")
      .select("id, start_date, end_date, diet_types:diets(name, name_th)")
      .eq("resident_id", id)
      .order("start_date", { ascending: false })
      .returns<DietRow[]>()),
    when(show.weight, supabase
      .from("weight")
      .select("id, date, weight_kg")
      .is("archived_at", null)
      .eq("resident_id", id)
      .order("date", { ascending: false })
      .returns<WeightRow[]>()),
    when(show.procedures, supabase
      .from("procedures")
      .select("id, date, procedure_types(name, name_th)")
      .eq("resident_id", id)
      .order("date", { ascending: false })
      .returns<ProcedureRow[]>()),
    when(show["blood-tests"], supabase
      .from("blood_tests")
      .select("id, date")
      .eq("resident_id", id)
      .order("date", { ascending: false })
      .returns<BloodTestRow[]>()),
    supabase
      .from("attachments")
      .select("id", { count: "exact", head: true })
      .eq("owner_type", "resident")
      .eq("owner_id", id),
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

  // Sponsorship drives (0210): only a login that may run them reads the table (RLS says the same).
  // A failed read shows no card rather than failing the record.
  let appealsSummary: { count: number; latestId: string | null; latestStatus: AppealStatus | null } | null = null;
  if (can(perms, "appeal.run")) {
    const { data, error } = await supabase
      .from("appeals")
      .select("id, status")
      .eq("resident_id", id)
      .order("created_at", { ascending: false })
      .returns<{ id: string; status: AppealStatus }[]>();
    if (error) console.error("resident hub: appeals read failed", error);
    else appealsSummary = { count: data.length, latestId: data[0]?.id ?? null, latestStatus: data[0]?.status ?? null };
  }

  // The memes featuring this resident (0223): only for a login holding social.library at Read. Many roles can open
  // this page and must not learn a meme exists here, so the gate is pinned on this list as it is on the library
  // (docs/decisions/2026-10-18-meme-library-app.md). null = no list drawn at all.
  const memes = canBrowseMemes(perms) ? await loadResidentMemes(supabase, id) : null;

  // The header photo's viewer: the same attachments the Photos tab lists, minus the Medical
  // folder (isMedicalFolder, the rule the profile-photo and appeal code use). A failed read
  // leaves the viewer with the profile photo alone.
  const { data: photoRows } = resident.profile_photo_drive_file_id
    ? await supabase
        .from("attachments")
        .select("drive_file_id, file_name, sub_folder")
        .eq("owner_type", "resident")
        .eq("owner_id", id)
        .order("uploaded_at", { ascending: true })
        .returns<{ drive_file_id: string; file_name: string | null; sub_folder: string | null }[]>()
    : { data: null };
  const otherPhotos = (photoRows ?? [])
    .filter((p) => !isMedicalFolder(p.sub_folder))
    .map((p) => ({ drive_file_id: p.drive_file_id, file_name: p.file_name }));

  return (
    <ResidentHub
      otherPhotos={otherPhotos}
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
      showTile={show}
      medicalEdit={{
        diet: can(perms, "medical.diet", "edit"),
        immunizations: can(perms, "medical.immunizations", "edit"),
        visits: can(perms, "medical.visits", "edit"),
        prescriptions: can(perms, "medical.prescriptions", "edit"),
        weight: can(perms, "medical.weight", "edit"),
        procedures: can(perms, "medical.procedures", "edit"),
      }}
      canEditResident={can(perms, "resident.record")}
      perms={perms}
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
      appeals={appealsSummary}
      memes={
        memes &&
        memes.map((m) => ({ id: m.id, drive_file_id: m.drive_file_id, title: m.title, platforms: m.platforms }))
      }
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
