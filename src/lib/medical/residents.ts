import type { createClient } from "@/lib/supabase/server";
import { loadPlaceOrder, natural } from "@/lib/enclosures/order";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** A row of `resident_who_and_where` (0134): who a resident is and where it lives, nothing more. */
type WhoRow = {
  id: string;
  resident_code: string | null;
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

export type PickableResident = {
  id: string;
  code: string | null;
  name: string;
  thaiName: string | null;
  photoFileId: string | null;
  status: string | null;
  enclosure: { name: string; nameTh: string | null } | null;
  zone: { name: string; nameTh: string | null; colour: string | null } | null;
};

const COLUMNS =
  "id, resident_code, name, thai_name, profile_photo_drive_file_id, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th, zone_colour";

function shape(row: WhoRow): PickableResident {
  return {
    id: row.id,
    code: row.resident_code,
    name: row.name,
    thaiName: row.thai_name,
    photoFileId: row.profile_photo_drive_file_id,
    status: row.current_status,
    enclosure: row.enclosure_name ? { name: row.enclosure_name, nameTh: row.enclosure_name_th } : null,
    zone: row.zone_name ? { name: row.zone_name, nameTh: row.zone_name_th, colour: row.zone_colour } : null,
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
  const [{ data, error }, order] = await Promise.all([
    supabase.from("resident_who_and_where").select(COLUMNS).returns<WhoRow[]>(),
    loadPlaceOrder(supabase),
  ]);
  if (error) return { residents: [], error: error.message };
  const rows = data && data.length > 0 ? data : await loadWhoRowsDirect(supabase);
  // Zones and enclosures in the shelter's order (Settings → Zones and Enclosures), no place last.
  const residents = [...rows]
    .filter((r) => r.current_status !== "Deceased" && r.current_status !== "Adopted")
    .sort(
      (a, b) =>
        order.compareZones(a.zone_name, b.zone_name) ||
        order.compareEnclosures(
          { id: a.enclosure_id, name: a.enclosure_name },
          { id: b.enclosure_id, name: b.enclosure_name },
        ) ||
        natural.compare(a.name, b.name),
    )
    .map(shape);
  return { residents, error: null };
}

/**
 * `resident_who_and_where` has rows only for a login that borrows the volunteer role (0134), so Admin and
 * Management read it empty. Those logins may read the tables themselves, so when the view is empty the
 * same shape is built from them. A login that can read neither gets nothing, as before.
 */
async function loadWhoRowsDirect(supabase: Supabase): Promise<WhoRow[]> {
  const [res, state, enc, zones] = await Promise.all([
    supabase
      .from("residents")
      .select("id, resident_code, name, thai_name, profile_photo_drive_file_id")
      .returns<{ id: string; resident_code: string | null; name: string; thai_name: string | null; profile_photo_drive_file_id: string | null }[]>(),
    supabase
      .from("resident_current_state")
      .select("resident_id, current_status, current_enclosure_id")
      .returns<{ resident_id: string; current_status: string | null; current_enclosure_id: string | null }[]>(),
    supabase
      .from("enclosures")
      .select("id, name, name_th, zone_id")
      .returns<{ id: string; name: string; name_th: string | null; zone_id: string | null }[]>(),
    supabase
      .from("zones")
      .select("id, name, name_th, colour")
      .returns<{ id: string; name: string; name_th: string | null; colour: string | null }[]>(),
  ]);
  const stateOf = new Map((state.data ?? []).map((x) => [x.resident_id, x]));
  const encOf = new Map((enc.data ?? []).map((x) => [x.id, x]));
  const zoneOf = new Map((zones.data ?? []).map((x) => [x.id, x]));
  return (res.data ?? []).map((x) => {
    const st = stateOf.get(x.id);
    const e = st?.current_enclosure_id ? encOf.get(st.current_enclosure_id) : undefined;
    const z = e?.zone_id ? zoneOf.get(e.zone_id) : undefined;
    return {
      id: x.id,
      resident_code: x.resident_code,
      name: x.name,
      thai_name: x.thai_name,
      profile_photo_drive_file_id: x.profile_photo_drive_file_id,
      current_status: st?.current_status ?? null,
      enclosure_id: e?.id ?? null,
      enclosure_name: e?.name ?? null,
      enclosure_name_th: e?.name_th ?? null,
      zone_name: z?.name ?? null,
      zone_name_th: z?.name_th ?? null,
      zone_colour: z?.colour ?? null,
    };
  });
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

/** Search filter for the picker: name in either language, R-code or enclosure, ignoring case. */
export function matchesQuery(r: PickableResident, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [r.name, r.thaiName, r.code, r.enclosure?.name, r.enclosure?.nameTh].some((v) =>
    (v ?? "").toLowerCase().includes(needle),
  );
}

export type PickerZone = {
  zone: { name: string; nameTh: string | null; colour: string | null } | null;
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
