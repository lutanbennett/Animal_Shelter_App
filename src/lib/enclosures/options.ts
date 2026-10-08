import type { SupabaseClient } from "@supabase/supabase-js";
import { enclosuresInShelterOrder, inShelterOrder } from "./order";

/** The Lifecycle pseudo-zone holds status buckets, not physical enclosures. */
export const SYSTEM_ZONE = "Lifecycle";

/** `name` is the English key; `name_th` is display only (placeName()). */
export type ZoneOption = { id: string; name: string; name_th: string | null };

export type EnclosureOption = {
  id: string;
  name: string;
  name_th: string | null;
  zoneId: string;
  capacity: number | null;
  /** Residents currently placed here, per resident_list_view. */
  residentCount: number;
};

/**
 * Physical zones and enclosures for a zone → enclosure picker, with each
 * enclosure's current headcount so the picker can warn about capacity.
 * Lifecycle pseudo-enclosures (Hospital, Fostered, …) are excluded — they
 * are entered through their own placement types, never by "moving" there.
 *
 * Counts are tallied from resident_list_view in the request, the same way
 * /enclosures does (see docs/decisions.md, "Enclosure browser").
 *
 * Both lists come in the shelter's order (Settings → Zones and Enclosures,
 * src/lib/enclosures/order.ts): zones, then enclosures zone by zone.
 */
export async function loadEnclosureOptions(supabase: SupabaseClient) {
  const [zonesResult, enclosuresResult, residentsResult] = await Promise.all([
    supabase
      .from("zones")
      .select("id, name, name_th, sort_order")
      .neq("name", SYSTEM_ZONE)
      .returns<(ZoneOption & { sort_order: number | null })[]>(),
    supabase
      .from("enclosures")
      .select("id, name, name_th, zone_id, capacity, sort_order, zones!inner(name)")
      .neq("zones.name", SYSTEM_ZONE)
      .returns<
        {
          id: string;
          name: string;
          name_th: string | null;
          zone_id: string;
          capacity: number | null;
          sort_order: number | null;
        }[]
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

  const ordered = inShelterOrder(zonesResult.data ?? []);
  const zones: ZoneOption[] = ordered.map(({ id, name, name_th }) => ({ id, name, name_th }));
  const enclosures: EnclosureOption[] = enclosuresInShelterOrder(enclosuresResult.data ?? [], ordered)
    .map((e) => ({
      id: e.id,
      name: e.name,
      name_th: e.name_th,
      zoneId: e.zone_id,
      capacity: e.capacity,
      residentCount: counts.get(e.id) ?? 0,
    }));

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
