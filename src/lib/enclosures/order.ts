import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The shelter's own order of zones and enclosures (0161: `zones.sort_order`,
 * `enclosures.sort_order` within the zone), set on Settings → Zones and
 * Settings → Enclosures. Every screen that lists places sorts through here,
 * so none goes back to alphabetical: "Enclosure 10" before "Enclosure 2" is
 * not how anyone walks the site.
 *
 * A row with no order sorts after those with one, by name with numbers read
 * as numbers. That is the Lifecycle pseudo-zone and its pseudo-enclosures,
 * which take no order on purpose (0161 refuses one), and every place for a
 * reader the tables' policy turns away, who keeps name order. (0161's header
 * expected that to be the vet; on dev on 2026-10-08 the vet read all 18 zones,
 * scripts/check-place-order-roles.mjs.)
 */

/** Names with numbers read as numbers: "Enclosure 2" before "Enclosure 10". */
export const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

export type Ordered = { name: string; sort_order?: number | null };

/** Comparator: sort_order low first, no order last, then name (numbers in order). */
export function byShelterOrder(a: Ordered, b: Ordered) {
  const x = a.sort_order ?? null;
  const y = b.sort_order ?? null;
  if (x !== y) {
    if (x === null) return 1;
    if (y === null) return -1;
    return x - y;
  }
  return natural.compare(a.name, b.name);
}

/** A sorted copy, in the shelter's order. */
export function inShelterOrder<T extends Ordered>(rows: readonly T[]): T[] {
  return [...rows].sort(byShelterOrder);
}

/**
 * Enclosures from several zones: by their zone's place in the order, then
 * their own within it. `zones` is every zone the enclosures may belong to.
 */
export function enclosuresInShelterOrder<T extends Ordered & { zone_id: string }>(
  enclosures: readonly T[],
  zones: readonly (Ordered & { id: string })[],
): T[] {
  const rank = new Map(inShelterOrder(zones).map((zone, index) => [zone.id, index]));
  const zoneRank = (id: string) => rank.get(id) ?? Number.MAX_SAFE_INTEGER;
  return [...enclosures].sort(
    (a, b) => zoneRank(a.zone_id) - zoneRank(b.zone_id) || byShelterOrder(a, b),
  );
}

/**
 * For screens that group residents by place from the resident views, which
 * carry zone and enclosure names but not the order (0161's header): the
 * order read from the tables once, as two comparators. A zone is known by
 * name (the views' grouping key), an enclosure by id. Anything the reader
 * cannot see — the vet, or a place added since — sorts last by name.
 */
export type PlaceOrder = {
  compareZones: (a: string | null | undefined, b: string | null | undefined) => number;
  compareEnclosures: (
    a: { id: string | null | undefined; name: string | null | undefined },
    b: { id: string | null | undefined; name: string | null | undefined },
  ) => number;
};

function byRank(rank: Map<string, number>) {
  return (aKey: string | null | undefined, aName: string | null | undefined, bKey: string | null | undefined, bName: string | null | undefined) => {
    const x = (aKey ? rank.get(aKey) : undefined) ?? Number.MAX_SAFE_INTEGER;
    const y = (bKey ? rank.get(bKey) : undefined) ?? Number.MAX_SAFE_INTEGER;
    if (x !== y) return x < y ? -1 : 1;
    // No name sorts last, as the groupings' "no place" bucket always has.
    if (!aName || !bName) return aName ? -1 : bName ? 1 : 0;
    return natural.compare(aName, bName);
  };
}

export function placeOrderFrom(
  zones: readonly (Ordered & { id: string })[],
  enclosures: readonly (Ordered & { id: string; zone_id: string })[],
): PlaceOrder {
  const zoneRank = new Map(inShelterOrder(zones).map((zone, index) => [zone.name, index]));
  const enclosureRank = new Map(
    enclosuresInShelterOrder(enclosures, zones).map((enclosure, index) => [enclosure.id, index]),
  );
  const zone = byRank(zoneRank);
  const enclosure = byRank(enclosureRank);
  return {
    compareZones: (a, b) => zone(a, a, b, b),
    compareEnclosures: (a, b) => enclosure(a.id, a.name, b.id, b.name),
  };
}

export async function loadPlaceOrder(supabase: SupabaseClient): Promise<PlaceOrder> {
  const [zones, enclosures] = await Promise.all([
    supabase
      .from("zones")
      .select("id, name, sort_order")
      .returns<{ id: string; name: string; sort_order: number | null }[]>(),
    supabase
      .from("enclosures")
      .select("id, name, zone_id, sort_order")
      .returns<{ id: string; name: string; zone_id: string; sort_order: number | null }[]>(),
  ]);
  // A failed or empty read (a role the tables' policy turns away) leaves name order, not an error.
  return placeOrderFrom(zones.data ?? [], enclosures.data ?? []);
}

/**
 * Move up / down: the list in the order it shows, with `id` swapped with its
 * neighbour, or null if it is already at that end (or not in the list).
 */
export function movedInOrder<T extends Ordered & { id: string }>(
  rows: readonly T[],
  id: string,
  direction: "up" | "down",
): T[] | null {
  const ordered = inShelterOrder(rows);
  const index = ordered.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ordered.length) return null;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  return ordered;
}

/** Sort A-Z (numbers in order): the list by name alone, as a starting point. */
export function byNameInOrder<T extends Ordered>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => natural.compare(a.name, b.name));
}

/** The writes that make `ordered` the order: 1..n, only rows whose number changes. */
export function renumbered<T extends Ordered & { id: string }>(ordered: readonly T[]) {
  return ordered
    .map((row, index) => ({ id: row.id, sort_order: index + 1, was: row.sort_order ?? null }))
    .filter((row) => row.was !== row.sort_order);
}
