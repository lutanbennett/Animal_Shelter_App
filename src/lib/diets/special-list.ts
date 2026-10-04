import type { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/format";
import { roundsFor, type RoundKey } from "@/lib/rounds/suggest";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** A row of `special_diet_list` (0140). */
type Row = {
  resident_diet_id: string;
  resident_id: string;
  name: string;
  thai_name: string | null;
  profile_photo_drive_file_id: string | null;
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  enclosure_name_th: string | null;
  zone_name: string | null;
  zone_name_th: string | null;
  diet_type_id: string;
  diet_name: string;
  diet_unit: string;
  meals_per_day: number | null;
  daily_quantity: number | string | null;
  notes: string | null;
  round_keys: string[] | null;
};

export type SpecialDiet = {
  residentDietId: string;
  name: string;
  unit: string;
  mealsPerDay: number | null;
  /** The whole day's amount; null when neither the resident nor the type's size default has one. */
  dailyQuantity: number | null;
  /** Where the diet is given, in day order; empty when no meal is ticked. */
  rounds: RoundKey[];
  notes: string | null;
};

export type DietResident = {
  id: string;
  name: string;
  thaiName: string | null;
  photoFileId: string | null;
  status: string | null;
  diets: SpecialDiet[];
};

export type DietEnclosure = {
  enclosure: { name: string; nameTh: string | null };
  residents: DietResident[];
};

export type DietZone = {
  zone: { name: string; nameTh: string | null };
  enclosures: DietEnclosure[];
};

export type SpecialDietList = {
  today: string;
  round: RoundKey;
  zones: DietZone[];
  /** In hospital, fostered, outreach, or with no enclosure on record. */
  apart: DietResident[];
  error: string | null;
};

const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/**
 * Feed Special Diets (docs/decisions/2026-10-04-medical-jobs-app.md): every current diet whose
 * type is not the standard one (`diet_types.is_standard = false`, Lutan 2026-10-04), by zone then
 * enclosure, for one meal. One read of `special_diet_list`, never `diet_types` or `residents`:
 * the view is what the Head of Medical may see (no cost, stock or reorder column).
 *
 * A diet is shown in the chosen meal when it holds that round. One with no round ticked is shown
 * in every meal and flagged, never dropped (the medication list's rule). Deceased and Adopted are
 * dropped here, as the medication list does, so the list rule lives in one place. Read-only by
 * construction: nothing is recorded as fed.
 */
export async function loadSpecialDiets(supabase: Supabase, round: RoundKey): Promise<SpecialDietList> {
  const today = todayIso();
  const { data, error } = await supabase
    .from("special_diet_list")
    .select(
      "resident_diet_id, resident_id, name, thai_name, profile_photo_drive_file_id, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th, diet_type_id, diet_name, diet_unit, meals_per_day, daily_quantity, notes, round_keys",
    )
    .returns<Row[]>();
  if (error) return { today, round, zones: [], apart: [], error: error.message };

  const foodRounds = roundsFor("food");
  const byResident = new Map<string, { row: Row; resident: DietResident }>();
  for (const row of data ?? []) {
    if (row.current_status === "Deceased" || row.current_status === "Adopted") continue;
    const held = new Set(row.round_keys ?? []);
    const rounds = foodRounds.filter((k) => held.has(k));
    if (rounds.length > 0 && !rounds.includes(round)) continue;
    const quantity = row.daily_quantity == null ? null : Number(row.daily_quantity);
    const entry =
      byResident.get(row.resident_id) ??
      {
        row,
        resident: {
          id: row.resident_id,
          name: row.name,
          thaiName: row.thai_name,
          photoFileId: row.profile_photo_drive_file_id,
          status: row.current_status,
          diets: [],
        },
      };
    entry.resident.diets.push({
      residentDietId: row.resident_diet_id,
      name: row.diet_name,
      unit: row.diet_unit,
      mealsPerDay: row.meals_per_day,
      dailyQuantity: quantity != null && Number.isFinite(quantity) ? quantity : null,
      rounds,
      notes: row.notes?.trim() || null,
    });
    byResident.set(row.resident_id, entry);
  }

  const zones = new Map<string, DietZone>();
  const apart: DietResident[] = [];
  for (const { row, resident } of byResident.values()) {
    resident.diets.sort((a, b) => natural.compare(a.name, b.name));
    if (!row.enclosure_name || !row.zone_name || row.current_status !== "Resident") {
      apart.push(resident);
      continue;
    }
    let zone = zones.get(row.zone_name);
    if (!zone) {
      zone = { zone: { name: row.zone_name, nameTh: row.zone_name_th }, enclosures: [] };
      zones.set(row.zone_name, zone);
    }
    let enclosure = zone.enclosures.find((e) => e.enclosure.name === row.enclosure_name);
    if (!enclosure) {
      enclosure = { enclosure: { name: row.enclosure_name, nameTh: row.enclosure_name_th }, residents: [] };
      zone.enclosures.push(enclosure);
    }
    enclosure.residents.push(resident);
  }

  const zoneGroups = [...zones.values()].sort((a, b) => natural.compare(a.zone.name, b.zone.name));
  for (const zone of zoneGroups) {
    zone.enclosures.sort((a, b) => natural.compare(a.enclosure.name, b.enclosure.name));
    for (const e of zone.enclosures) e.residents.sort((a, b) => natural.compare(a.name, b.name));
  }
  apart.sort((a, b) => natural.compare(a.name, b.name));
  return { today, round, zones: zoneGroups, apart, error: null };
}
