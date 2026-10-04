import type { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/format";
import { doseDueState, type DueSchedule } from "./due";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type PrescriptionRow = {
  id: string;
  resident_id: string;
  medication_id: string;
  frequency_id: string | null;
  dose_quantity: number | string | null;
  start_date: string;
  end_date: string | null;
};

type MedicationRow = { id: string; name: string; dose_unit: string; label_drive_file_id: string | null };
type FrequencyRow = DueSchedule & { id: string; label: string };

/** A row of `medication_list_residents` (0136): who a resident is and where it lives. */
type PlacementRow = {
  id: string;
  name: string;
  thai_name: string | null;
  profile_photo_drive_file_id: string | null;
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  enclosure_name_th: string | null;
  zone_name: string | null;
  zone_name_th: string | null;
};

export type ListedMedication = {
  prescriptionId: string;
  name: string;
  doseUnit: string;
  /** Null when the prescription has no amount recorded. */
  quantity: number | null;
  /** The schedule as stored, for the "how often" wording. */
  schedule: DueSchedule | null;
  /** The frequency's own label, the fallback when there is no schedule. */
  frequencyLabel: string | null;
  labelFileId: string | null;
  /** The course ends today, so this is the last dose — worth saying. */
  lastDay: boolean;
};

export type ListedResident = {
  id: string;
  name: string;
  thaiName: string | null;
  photoFileId: string | null;
  medications: ListedMedication[];
};

export type EnclosureGroup = {
  /** Display names; the page picks the language. */
  enclosure: { name: string; nameTh: string | null };
  residents: ListedResident[];
};

export type ZoneGroup = {
  zone: { name: string; nameTh: string | null };
  enclosures: EnclosureGroup[];
};

export type ApartResident = ListedResident & {
  /** Hospitalised, Fostered, Outreach — or null: no enclosure on record. */
  status: string | null;
};

export type MedicationList = {
  today: string;
  zones: ZoneGroup[];
  /** In hospital, fostered, out in the community: listed apart (decisions/2026-10-03-medication-list.md). */
  apart: ApartResident[];
  error: string | null;
};

/** 2 before 10, "Kennel 2" before "Kennel 10": walking order is not alphabetical order. */
const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/**
 * §14 of docs/roles-and-permissions.md: every resident with a prescription
 * current today, grouped by zone then enclosure. One read of prescriptions
 * and one of where residents live — no new table, no new column.
 *
 * "Current today" is the hub's rule (start on or before today at the
 * shelter, end unset or on or after it), then narrowed to the prescriptions
 * whose dose actually falls today (doseDueState) — an every-other-day
 * tablet is on the list on its day only. As-needed prescriptions have no day
 * to fall on and stay on the list.
 *
 * Reads three views and two lists, never the tables behind them, so a login that holds only
 * medical.prescriptions Read (the Head of Medical) gets exactly what the list shows and no price,
 * stock level, breed, bio or note (0136; decisions/2026-10-04-medical-role.md). Prescriptions and
 * frequency are read as tables, under their own policies; medicine and resident come through
 * `medication_list_medications` and `medication_list_residents`.
 *
 * Read-only by construction: nothing here, or on the page, writes.
 */
export async function loadMedicationList(supabase: Supabase): Promise<MedicationList> {
  const today = todayIso();

  const [prescriptions, medications, frequencies, placements] = await Promise.all([
    supabase
      .from("prescriptions")
      .select("id, resident_id, medication_id, frequency_id, dose_quantity, start_date, end_date")
      .is("archived_at", null)
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .returns<PrescriptionRow[]>(),
    supabase
      .from("medication_list_medications")
      .select("id, name, dose_unit, label_drive_file_id")
      .returns<MedicationRow[]>(),
    supabase
      .from("frequency")
      .select("id, label, doses_per_day, interval_count, interval_unit")
      .returns<FrequencyRow[]>(),
    supabase
      .from("medication_list_residents")
      .select(
        "id, name, thai_name, profile_photo_drive_file_id, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th",
      )
      .returns<PlacementRow[]>(),
  ]);

  const error =
    prescriptions.error?.message ??
    medications.error?.message ??
    frequencies.error?.message ??
    placements.error?.message ??
    null;
  if (error) return { today, zones: [], apart: [], error };

  const placeOf = new Map((placements.data ?? []).map((p) => [p.id, p]));
  const medicationOf = new Map((medications.data ?? []).map((m) => [m.id, m]));
  const frequencyOf = new Map((frequencies.data ?? []).map((f) => [f.id, f]));

  // Group the prescriptions that fall today by resident.
  const byResident = new Map<string, ListedResident>();
  for (const rx of prescriptions.data ?? []) {
    const medication = medicationOf.get(rx.medication_id);
    const frequency = rx.frequency_id ? (frequencyOf.get(rx.frequency_id) ?? null) : null;
    const who = placeOf.get(rx.resident_id);
    if (!medication || !who) continue;
    if (doseDueState(rx.start_date, frequency, today) === "notToday") continue;
    const quantity = rx.dose_quantity == null ? null : Number(rx.dose_quantity);
    const resident =
      byResident.get(rx.resident_id) ??
      {
        id: rx.resident_id,
        name: who.name,
        thaiName: who.thai_name,
        photoFileId: who.profile_photo_drive_file_id,
        medications: [],
      };
    resident.medications.push({
      prescriptionId: rx.id,
      name: medication.name,
      doseUnit: medication.dose_unit,
      quantity: quantity != null && Number.isFinite(quantity) ? quantity : null,
      schedule: frequency,
      frequencyLabel: frequency?.label ?? null,
      labelFileId: medication.label_drive_file_id,
      lastDay: rx.end_date === today,
    });
    byResident.set(rx.resident_id, resident);
  }

  const zones = new Map<string, { group: ZoneGroup; enclosures: Map<string, EnclosureGroup> }>();
  const apart: ApartResident[] = [];

  for (const resident of byResident.values()) {
    resident.medications.sort((a, b) => natural.compare(a.name, b.name));
    const place = placeOf.get(resident.id);
    const status = place?.current_status ?? null;

    // Gone for good: nothing to give. (resident_current_state names them.)
    if (status === "Deceased" || status === "Adopted") continue;

    if (!place || !place.enclosure_name || !place.zone_name || status !== "Resident") {
      apart.push({ ...resident, status });
      continue;
    }

    let zone = zones.get(place.zone_name);
    if (!zone) {
      zone = {
        group: { zone: { name: place.zone_name, nameTh: place.zone_name_th }, enclosures: [] },
        enclosures: new Map(),
      };
      zones.set(place.zone_name, zone);
    }
    const key = place.enclosure_id ?? place.enclosure_name;
    let enclosure = zone.enclosures.get(key);
    if (!enclosure) {
      enclosure = {
        enclosure: { name: place.enclosure_name, nameTh: place.enclosure_name_th },
        residents: [],
      };
      zone.enclosures.set(key, enclosure);
      zone.group.enclosures.push(enclosure);
    }
    enclosure.residents.push(resident);
  }

  const zoneGroups = [...zones.values()]
    .map(({ group }) => group)
    .sort((a, b) => natural.compare(a.zone.name, b.zone.name));
  for (const zone of zoneGroups) {
    zone.enclosures.sort((a, b) => natural.compare(a.enclosure.name, b.enclosure.name));
    for (const enclosure of zone.enclosures) {
      enclosure.residents.sort((a, b) => natural.compare(a.name, b.name));
    }
  }
  apart.sort((a, b) => natural.compare(a.name, b.name));

  return { today, zones: zoneGroups, apart, error: null };
}
