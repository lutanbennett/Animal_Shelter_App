import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** A row of `resident_who_and_where` (0134): who a resident is and where it lives, nothing more. */
type WhoRow = {
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

export type PickableResident = {
  id: string;
  name: string;
  thaiName: string | null;
  photoFileId: string | null;
  status: string | null;
  enclosure: { name: string; nameTh: string | null } | null;
  zone: { name: string; nameTh: string | null } | null;
};

const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

const COLUMNS =
  "id, name, thai_name, profile_photo_drive_file_id, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th";

function shape(row: WhoRow): PickableResident {
  return {
    id: row.id,
    name: row.name,
    thaiName: row.thai_name,
    photoFileId: row.profile_photo_drive_file_id,
    status: row.current_status,
    enclosure: row.enclosure_name ? { name: row.enclosure_name, nameTh: row.enclosure_name_th } : null,
    zone: row.zone_name ? { name: row.zone_name, nameTh: row.zone_name_th } : null,
  };
}

/**
 * Residents a picker offers, read through `resident_who_and_where` and never `residents`: the
 * Head of Medical borrows the volunteer's rights and cannot open a resident's record, only who
 * and where (0134; docs/decisions/2026-10-04-medical-jobs-schema.md). Deceased and Adopted are
 * not offered: there is nothing to weigh or photograph for them here.
 */
export async function loadPickableResidents(
  supabase: Supabase,
): Promise<{ residents: PickableResident[]; error: string | null }> {
  const { data, error } = await supabase
    .from("resident_who_and_where")
    .select(COLUMNS)
    .returns<WhoRow[]>();
  if (error) return { residents: [], error: error.message };
  const residents = (data ?? [])
    .map(shape)
    .filter((r) => r.status !== "Deceased" && r.status !== "Adopted");
  residents.sort(
    (a, b) =>
      natural.compare(a.zone?.name ?? "￿", b.zone?.name ?? "￿") ||
      natural.compare(a.enclosure?.name ?? "￿", b.enclosure?.name ?? "￿") ||
      natural.compare(a.name, b.name),
  );
  return { residents, error: null };
}

/** One resident by id, or null when the picker would not have offered it (or the id is wrong). */
export async function loadOneResident(
  supabase: Supabase,
  id: string,
): Promise<{ resident: PickableResident | null; error: string | null }> {
  const { data, error } = await supabase
    .from("resident_who_and_where")
    .select(COLUMNS)
    .eq("id", id)
    .limit(1)
    .returns<WhoRow[]>();
  if (error) return { resident: null, error: error.message };
  return { resident: data?.[0] ? shape(data[0]) : null, error: null };
}

/** Name filter for the picker: either language, ignoring case. */
export function matchesQuery(r: PickableResident, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return r.name.toLowerCase().includes(needle) || (r.thaiName ?? "").toLowerCase().includes(needle);
}

export type PickerZone = {
  zone: { name: string; nameTh: string | null } | null;
  enclosures: { enclosure: { name: string; nameTh: string | null } | null; residents: PickableResident[] }[];
};

/** Zone, then enclosure; residents with no enclosure on record go last in a group of their own. */
export function groupByPlace(residents: PickableResident[]): PickerZone[] {
  const zones: PickerZone[] = [];
  for (const r of residents) {
    let zone = zones.find((z) => (z.zone?.name ?? null) === (r.zone?.name ?? null));
    if (!zone) {
      zone = { zone: r.zone, enclosures: [] };
      zones.push(zone);
    }
    let enclosure = zone.enclosures.find((e) => (e.enclosure?.name ?? null) === (r.enclosure?.name ?? null));
    if (!enclosure) {
      enclosure = { enclosure: r.enclosure, residents: [] };
      zone.enclosures.push(enclosure);
    }
    enclosure.residents.push(r);
  }
  return zones;
}
