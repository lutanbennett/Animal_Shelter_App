import type { SupabaseClient } from "@supabase/supabase-js";

/** The Lifecycle pseudo-zone holds status buckets, not physical enclosures. */
export const SYSTEM_ZONE = "Lifecycle";

export type ZoneOption = { id: string; name: string };

export type EnclosureOption = {
  id: string;
  name: string;
  zoneId: string;
  capacity: number | null;
  /** Residents currently placed here, per resident_list_view. */
  residentCount: number;
};

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

/**
 * Physical zones and enclosures for a zone → enclosure picker, with each
 * enclosure's current headcount so the picker can warn about capacity.
 * Lifecycle pseudo-enclosures (Hospital, Fostered, …) are excluded — they
 * are entered through their own placement types, never by "moving" there.
 *
 * Counts are tallied from resident_list_view in the request, the same way
 * /enclosures does (see docs/decisions.md, "Enclosure browser").
 */
export async function loadEnclosureOptions(supabase: SupabaseClient) {
  const [zonesResult, enclosuresResult, residentsResult] = await Promise.all([
    supabase
      .from("zones")
      .select("id, name")
      .neq("name", SYSTEM_ZONE)
      .returns<ZoneOption[]>(),
    supabase
      .from("enclosures")
      .select("id, name, zone_id, capacity, zones!inner(name)")
      .neq("zones.name", SYSTEM_ZONE)
      .returns<
        { id: string; name: string; zone_id: string; capacity: number | null }[]
      >(),
    supabase
      .from("resident_list_view")
      .select("enclosure_id")
      .not("enclosure_id", "is", null)
      .returns<{ enclosure_id: string }[]>(),
  ]);

  const counts = new Map<string, number>();
  for (const row of residentsResult.data ?? []) {
    counts.set(row.enclosure_id, (counts.get(row.enclosure_id) ?? 0) + 1);
  }

  const zones = [...(zonesResult.data ?? [])].sort(byName);
  const enclosures: EnclosureOption[] = (enclosuresResult.data ?? [])
    .map((e) => ({
      id: e.id,
      name: e.name,
      zoneId: e.zone_id,
      capacity: e.capacity,
      residentCount: counts.get(e.id) ?? 0,
    }))
    .sort(byName);

  return {
    zones,
    enclosures,
    error:
      zonesResult.error?.message ??
      enclosuresResult.error?.message ??
      residentsResult.error?.message ??
      null,
  };
}
