import "server-only";
import { defaultDailyQuantity, formatQuantity } from "@/lib/diets/options";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dateToYymm, dateToYyyymmdd } from "@/lib/google/drive-client";

/**
 * Everything the shelter holds on one resident, in one object.
 *
 * Read once and handed to both archive artefacts — the deceased summary PDF
 * and the offline HTML index — so the two can never disagree about what was
 * in the file at the moment it was closed. Deliberately plain data (no
 * Supabase types, no React): the renderers are pure functions of this.
 */

export type ArchiveFile = {
  driveFileId: string;
  fileName: string | null;
  /**
   * Where the file sits inside the resident's own Drive folder, e.g.
   * "Photos/Shelter/2609/dog.jpg". The offline index links to this so it
   * still works once the folder has been pulled off Drive onto a local
   * disk. Null when the file predates the date/category metadata the path
   * is built from, in which case only the Drive link is offered.
   */
  relativePath: string | null;
  category: string | null;
  dateTaken: string | null;
  isProfilePhoto: boolean;
};

export type ArchivePlacement = {
  id: string;
  placementType: string;
  startDate: string;
  endDate: string | null;
  enclosureName: string | null;
  previousEnclosureName: string | null;
  carerName: string | null;
  notes: string | null;
};

export type ArchiveImmunization = {
  id: string;
  typeName: string | null;
  dateAdministered: string;
  administeredBy: string | null;
  batchNumber: string | null;
  notes: string | null;
};

export type ArchiveAppointment = {
  id: string;
  appointmentDate: string;
  status: string;
  vetName: string | null;
  reason: string | null;
  notes: string | null;
};

export type ArchiveDiet = {
  id: string;
  dietTypeName: string | null;
  mealsPerDay: number;
  /** "150 g a day" — the row's own figure, else the type's default for the resident's size. */
  dailyQuantity: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
};

export type ArchivePrescription = {
  id: string;
  medicationName: string | null;
  /** "2 tablet", "500 ml" — quantity in the medication's own unit; null on rows without a dose. */
  dose: string | null;
  frequencyLabel: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
};

export type ArchiveWeight = {
  id: string;
  date: string;
  weightKg: number;
  notes: string | null;
};

export type ArchiveProcedure = {
  id: string;
  procedureType: string | null;
  date: string;
  notes: string | null;
  files: ArchiveFile[];
};

export type ArchiveBloodTest = {
  id: string;
  date: string;
  type: string | null;
  results: string | null;
  files: ArchiveFile[];
};

export type ResidentArchiveRecord = {
  resident: {
    id: string;
    name: string;
    thaiName: string | null;
    otherNames: string | null;
    residentCode: string;
    species: string | null;
    breed: string | null;
    sex: string | null;
    estimatedAgeYears: number | null;
    ageEstimatedOn: string | null;
    intakeDate: string | null;
    bio: string | null;
    temperamentNotes: string | null;
    pastStoryNotes: string | null;
    behaviourNotes: string | null;
    profilePhotoDriveFileId: string | null;
    originName: string | null;
    originDate: string | null;
  };
  death: {
    /** ISO timestamp of the Deceased placement. */
    date: string;
    causeOfDeath: string | null;
    notes: string | null;
  } | null;
  placements: ArchivePlacement[];
  immunizations: ArchiveImmunization[];
  appointments: ArchiveAppointment[];
  prescriptions: ArchivePrescription[];
  diets: ArchiveDiet[];
  weights: ArchiveWeight[];
  procedures: ArchiveProcedure[];
  bloodTests: ArchiveBloodTest[];
  photos: ArchiveFile[];
  /** ISO timestamp — when this snapshot was taken. */
  generatedAt: string;
};

/**
 * Residents/<Name> (<ID>)/Photos/<Category>/<YYMM>/<file> — the upload
 * route's own convention (src/app/api/residents/[id]/photos/route.ts),
 * expressed relative to the resident's folder.
 */
function photoRelativePath(
  category: string | null,
  dateTaken: string | null,
  fileName: string | null,
): string | null {
  if (!category || !dateTaken || !fileName) return null;
  return `Photos/${category}/${dateToYymm(dateTaken)}/${fileName}`;
}

/**
 * Residents/<Name> (<ID>)/Procedures/<Type> <YYYYMMDD>/<file>. The folder
 * segment is the attachment's own sub_folder, recorded at upload time by
 * the procedure attachment route, so a later rename of the type doesn't
 * point the archive at a folder that was never created.
 */
function procedureRelativePath(
  subFolder: string | null,
  fileName: string | null,
): string | null {
  if (!subFolder || !fileName) return null;
  return `Procedures/${subFolder}/${fileName}`;
}

/** Residents/<Name> (<ID>)/Blood Tests/<YYYYMMDD>/<file>. */
function bloodTestRelativePath(
  testDate: string,
  fileName: string | null,
): string | null {
  if (!fileName) return null;
  return `Blood Tests/${dateToYyyymmdd(testDate)}/${fileName}`;
}

type AttachmentRow = {
  id: string;
  owner_type: string;
  owner_id: string;
  drive_file_id: string;
  file_name: string | null;
  sub_folder: string | null;
  date_taken: string | null;
};

type ResidentRow = {
  id: string;
  name: string;
  thai_name: string | null;
  other_names: string | null;
  resident_code: string;
  species: string | null;
  size: string | null;
  breed: string | null;
  sex: string | null;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
  intake_date: string | null;
  bio: string | null;
  temperament_notes: string | null;
  past_story_notes: string | null;
  behaviour_notes: string | null;
  profile_photo_drive_file_id: string | null;
  group_origins: { name: string; date: string | null } | null;
};

type PlacementRow = {
  id: string;
  placement_type: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  cause_of_death: string | null;
  enclosure: { name: string } | null;
  previous_enclosure: { name: string } | null;
  carer: { name: string } | null;
};

type ImmunizationRow = {
  id: string;
  date_administered: string;
  administered_by: string | null;
  batch_number: string | null;
  notes: string | null;
  immunization_types: { name: string } | null;
};

type AppointmentRow = {
  id: string;
  appointment_date: string;
  status: string;
  reason: string | null;
  notes: string | null;
  vets: { name: string } | null;
};

type DietRow = {
  id: string;
  start_date: string;
  end_date: string | null;
  meals_per_day: number;
  daily_quantity: number | null;
  notes: string | null;
  diet_types: {
    name: string;
    unit: string;
    daily_qty_small: number;
    daily_qty_medium: number;
    daily_qty_large: number;
  } | null;
};

type PrescriptionRow = {
  id: string;
  start_date: string;
  end_date: string | null;
  dose_quantity: number | null;
  notes: string | null;
  medication: { name: string; dose_unit: string } | null;
  frequency: { label: string } | null;
};

type WeightRow = {
  id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
};

type ProcedureRow = {
  id: string;
  date: string;
  notes: string | null;
  procedure_types: { name: string } | null;
};

type BloodTestRow = {
  id: string;
  date: string;
  results: string | null;
  blood_test_types: { name: string } | null;
};

async function loadOwnedFiles(
  supabase: SupabaseClient,
  ownerType: "blood_test" | "procedure",
  ownerIds: string[],
): Promise<AttachmentRow[]> {
  if (ownerIds.length === 0) return [];
  const { data, error } = await supabase
    .from("attachments")
    .select("id, owner_type, owner_id, drive_file_id, file_name, sub_folder, date_taken")
    .eq("owner_type", ownerType)
    .in("owner_id", ownerIds)
    .order("uploaded_at", { ascending: true })
    .returns<AttachmentRow[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Reads the whole file for one resident. Runs as the signed-in user, so
 * every table it touches is one the caller can already read (staff and
 * admins can read all of them — see the RLS in 0001).
 *
 * Throws on a query error rather than silently archiving a partial record:
 * a summary PDF missing half the medical history because one request
 * failed would be worse than no PDF at all, since it's meant to outlive
 * the database.
 */
export async function loadResidentArchiveRecord(
  supabase: SupabaseClient,
  residentId: string,
): Promise<ResidentArchiveRecord> {
  const [
    residentResult,
    placementsResult,
    immunizationsResult,
    appointmentsResult,
    prescriptionsResult,
    dietsResult,
    weightsResult,
    proceduresResult,
    bloodTestsResult,
    photosResult,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select(
        "id, name, thai_name, other_names, resident_code, species, size, breed, sex, estimated_age_years, age_estimated_on, intake_date, bio, temperament_notes, past_story_notes, behaviour_notes, profile_photo_drive_file_id, group_origins(name, date)",
      )
      .eq("id", residentId)
      .limit(1)
      .returns<ResidentRow[]>(),
    // Two FKs to enclosures, so each embed names its FK (see the housing
    // section page for the same pattern).
    supabase
      .from("placement_history")
      .select(
        "id, placement_type, start_date, end_date, notes, cause_of_death, enclosure:enclosures!enclosure_id(name), previous_enclosure:enclosures!previous_enclosure_id(name), carer:contacts!carer_id(name)",
      )
      .eq("resident_id", residentId)
      .order("start_date", { ascending: true })
      .returns<PlacementRow[]>(),
    supabase
      .from("immunization_records")
      .select(
        "id, date_administered, administered_by, batch_number, notes, immunization_types(name)",
      )
      .eq("resident_id", residentId)
      .order("date_administered", { ascending: false })
      .returns<ImmunizationRow[]>(),
    supabase
      .from("vet_appointments")
      .select("id, appointment_date, status, reason, notes, vets(name)")
      .eq("resident_id", residentId)
      .order("appointment_date", { ascending: false })
      .returns<AppointmentRow[]>(),
    supabase
      .from("prescriptions")
      .select("id, start_date, end_date, dose_quantity, notes, medication(name, dose_unit), frequency(label)")
      .eq("resident_id", residentId)
      .order("start_date", { ascending: false })
      .returns<PrescriptionRow[]>(),
    supabase
      .from("resident_diets")
      .select(
        "id, start_date, end_date, meals_per_day, daily_quantity, notes, diet_types(name, unit, daily_qty_small, daily_qty_medium, daily_qty_large)",
      )
      .eq("resident_id", residentId)
      .order("start_date", { ascending: false })
      .returns<DietRow[]>(),
    supabase
      .from("weight")
      .select("id, date, weight_kg, notes")
      .eq("resident_id", residentId)
      .order("date", { ascending: false })
      .returns<WeightRow[]>(),
    supabase
      .from("procedures")
      .select("id, date, notes, procedure_types(name)")
      .eq("resident_id", residentId)
      .order("date", { ascending: false })
      .returns<ProcedureRow[]>(),
    supabase
      .from("blood_tests")
      .select("id, date, results, blood_test_types(name)")
      .eq("resident_id", residentId)
      .order("date", { ascending: false })
      .returns<BloodTestRow[]>(),
    supabase
      .from("attachments")
      .select("id, owner_type, owner_id, drive_file_id, file_name, sub_folder, date_taken")
      .eq("owner_type", "resident")
      .eq("owner_id", residentId)
      .order("date_taken", { ascending: true })
      .returns<AttachmentRow[]>(),
  ]);

  for (const result of [
    residentResult,
    placementsResult,
    immunizationsResult,
    appointmentsResult,
    prescriptionsResult,
    dietsResult,
    weightsResult,
    proceduresResult,
    bloodTestsResult,
    photosResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const residentRow = residentResult.data?.[0];
  if (!residentRow) throw new Error("Resident not found.");

  const placementRows = placementsResult.data ?? [];
  const bloodTestRows = bloodTestsResult.data ?? [];
  const procedureRows = proceduresResult.data ?? [];

  // Blood test scans and procedure files hang off their record, not the
  // resident, so each is a second attachments query keyed by record id.
  const bloodTestFiles = await loadOwnedFiles(
    supabase,
    "blood_test",
    bloodTestRows.map((row) => row.id),
  );
  const procedureFiles = await loadOwnedFiles(
    supabase,
    "procedure",
    procedureRows.map((row) => row.id),
  );

  // The death itself is the open Deceased placement (the append-only model
  // in Section 4.1 — there is no date_of_death column to read).
  const deceasedPlacement = placementRows.find(
    (row) => row.placement_type === "Deceased" && row.end_date === null,
  );

  const profilePhotoId = residentRow.profile_photo_drive_file_id;

  return {
    resident: {
      id: residentRow.id,
      name: residentRow.name,
      thaiName: residentRow.thai_name,
      otherNames: residentRow.other_names,
      residentCode: residentRow.resident_code,
      species: residentRow.species,
      breed: residentRow.breed,
      sex: residentRow.sex,
      estimatedAgeYears: residentRow.estimated_age_years,
      ageEstimatedOn: residentRow.age_estimated_on,
      intakeDate: residentRow.intake_date,
      bio: residentRow.bio,
      temperamentNotes: residentRow.temperament_notes,
      pastStoryNotes: residentRow.past_story_notes,
      behaviourNotes: residentRow.behaviour_notes,
      profilePhotoDriveFileId: profilePhotoId,
      originName: residentRow.group_origins?.name ?? null,
      originDate: residentRow.group_origins?.date ?? null,
    },
    death: deceasedPlacement
      ? {
          date: deceasedPlacement.start_date,
          causeOfDeath: deceasedPlacement.cause_of_death,
          notes: deceasedPlacement.notes,
        }
      : null,
    placements: placementRows.map((row) => ({
      id: row.id,
      placementType: row.placement_type,
      startDate: row.start_date,
      endDate: row.end_date,
      enclosureName: row.enclosure?.name ?? null,
      previousEnclosureName: row.previous_enclosure?.name ?? null,
      carerName: row.carer?.name ?? null,
      notes: row.notes,
    })),
    immunizations: (immunizationsResult.data ?? []).map((row) => ({
      id: row.id,
      typeName: row.immunization_types?.name ?? null,
      dateAdministered: row.date_administered,
      administeredBy: row.administered_by,
      batchNumber: row.batch_number,
      notes: row.notes,
    })),
    appointments: (appointmentsResult.data ?? []).map((row) => ({
      id: row.id,
      appointmentDate: row.appointment_date,
      status: row.status,
      vetName: row.vets?.name ?? null,
      reason: row.reason,
      notes: row.notes,
    })),
    prescriptions: (prescriptionsResult.data ?? []).map((row) => ({
      id: row.id,
      medicationName: row.medication?.name ?? null,
      dose:
        row.dose_quantity != null
          ? `${Number(row.dose_quantity)} ${row.medication?.dose_unit ?? ""}`.trim()
          : null,
      frequencyLabel: row.frequency?.label ?? null,
      startDate: row.start_date,
      endDate: row.end_date,
      notes: row.notes,
    })),
    diets: (dietsResult.data ?? []).map((row) => {
      const type = row.diet_types;
      const quantity =
        row.daily_quantity ?? (type ? defaultDailyQuantity(type, residentRow.size) : null);
      return {
        id: row.id,
        dietTypeName: type?.name ?? null,
        mealsPerDay: row.meals_per_day,
        dailyQuantity:
          quantity != null ? `${formatQuantity(quantity)} ${type?.unit ?? ""} a day`.trim() : null,
        startDate: row.start_date,
        endDate: row.end_date,
        notes: row.notes,
      };
    }),
    weights: (weightsResult.data ?? []).map((row) => ({
      id: row.id,
      date: row.date,
      weightKg: row.weight_kg,
      notes: row.notes,
    })),
    procedures: procedureRows.map((row) => ({
      id: row.id,
      procedureType: row.procedure_types?.name ?? null,
      date: row.date,
      notes: row.notes,
      files: procedureFiles
        .filter((file) => file.owner_id === row.id)
        .map((file) => ({
          driveFileId: file.drive_file_id,
          fileName: file.file_name,
          relativePath: procedureRelativePath(file.sub_folder, file.file_name),
          category: null,
          dateTaken: file.date_taken,
          isProfilePhoto: false,
        })),
    })),
    bloodTests: bloodTestRows.map((row) => ({
      id: row.id,
      date: row.date,
      type: row.blood_test_types?.name ?? null,
      results: row.results,
      files: bloodTestFiles
        .filter((file) => file.owner_id === row.id)
        .map((file) => ({
          driveFileId: file.drive_file_id,
          fileName: file.file_name,
          relativePath: bloodTestRelativePath(row.date, file.file_name),
          category: null,
          dateTaken: file.date_taken,
          isProfilePhoto: false,
        })),
    })),
    photos: (photosResult.data ?? []).map((row) => ({
      driveFileId: row.drive_file_id,
      fileName: row.file_name,
      relativePath: photoRelativePath(row.sub_folder, row.date_taken, row.file_name),
      category: row.sub_folder,
      dateTaken: row.date_taken,
      isProfilePhoto: row.drive_file_id === profilePhotoId,
    })),
    generatedAt: new Date().toISOString(),
  };
}
