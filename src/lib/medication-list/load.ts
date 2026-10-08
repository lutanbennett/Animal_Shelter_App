import type { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/format";
import { loadPlaceOrder } from "@/lib/enclosures/order";
import { doseDueState, type DueSchedule } from "./due";
import { ROUND_KEYS, type RoundKey } from "@/lib/rounds/suggest";

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
  zone_colour: string | null;
};

/**
 * Why a prescription is on the list for the chosen round: it holds that round, it is as needed
 * (no round by design, shown in every round), or it has no round ticked (0138's `none`: shown and
 * flagged, never dropped — decisions/2026-10-04-medication-rounds.md).
 */
export type MedicationPlace = "round" | "asNeeded" | "noRound";

export type ListedMedication = {
  prescriptionId: string;
  medicationId: string;
  place: MedicationPlace;
  /** Every round the prescription is given in, in day order. */
  rounds: RoundKey[];
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
  zone: { name: string; nameTh: string | null; colour: string | null };
  enclosures: EnclosureGroup[];
};

export type ApartResident = ListedResident & {
  /** Hospitalised, Fostered, Outreach — or null: no enclosure on record. */
  status: string | null;
};

export type MedicationList = {
  today: string;
  round: RoundKey;
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
export async function loadMedicationList(
  supabase: Supabase,
  round: RoundKey,
): Promise<MedicationList> {
  const today = todayIso();

  const [prescriptions, medications, frequencies, placements, roundRows, order] = await Promise.all([
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
        "id, name, thai_name, profile_photo_drive_file_id, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th, zone_colour",
      )
      .returns<PlacementRow[]>(),
    // Read as the rounds table and its join table (0137/0138): visible exactly when the prescription is.
    supabase
      .from("prescription_rounds")
      .select("prescription_id, rounds(key)")
      .returns<{ prescription_id: string; rounds: { key: string } | { key: string }[] | null }[]>(),
    // The shelter's order of zones and enclosures (Settings), for the groups below.
    loadPlaceOrder(supabase),
  ]);

  const error =
    prescriptions.error?.message ??
    medications.error?.message ??
    frequencies.error?.message ??
    placements.error?.message ??
    roundRows.error?.message ??
    null;
  if (error) return { today, round, zones: [], apart: [], error };

  const roundsOf = new Map<string, Set<string>>();
  for (const row of roundRows.data ?? []) {
    const joined = Array.isArray(row.rounds) ? row.rounds : row.rounds ? [row.rounds] : [];
    const set = roundsOf.get(row.prescription_id) ?? new Set<string>();
    for (const j of joined) set.add(j.key);
    roundsOf.set(row.prescription_id, set);
  }

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
    const due = doseDueState(rx.start_date, frequency, today);
    if (due === "notToday") continue;
    const held = roundsOf.get(rx.id) ?? new Set<string>();
    const rounds = ROUND_KEYS.filter((k) => held.has(k));
    // As needed has no round by design; anything else with none is flagged, not hidden.
    const place: MedicationPlace =
      due === "asNeeded" ? "asNeeded" : rounds.length === 0 ? "noRound" : "round";
    if (place === "round" && !rounds.includes(round)) continue;
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
      medicationId: rx.medication_id,
      place,
      rounds,
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
  const enclosureIdOf = new Map<EnclosureGroup, string | null>();

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
        group: { zone: { name: place.zone_name, nameTh: place.zone_name_th, colour: place.zone_colour }, enclosures: [] },
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
      enclosureIdOf.set(enclosure, place.enclosure_id);
    }
    enclosure.residents.push(resident);
  }

  const zoneGroups = [...zones.values()]
    .map(({ group }) => group)
    .sort((a, b) => order.compareZones(a.zone.name, b.zone.name));
  for (const zone of zoneGroups) {
    zone.enclosures.sort((a, b) =>
      order.compareEnclosures(
        { id: enclosureIdOf.get(a), name: a.enclosure.name },
        { id: enclosureIdOf.get(b), name: b.enclosure.name },
      ),
    );
    for (const enclosure of zone.enclosures) {
      enclosure.residents.sort((a, b) => natural.compare(a.name, b.name));
    }
  }
  apart.sort((a, b) => natural.compare(a.name, b.name));

  return { today, round, zones: zoneGroups, apart, error: null };
}
