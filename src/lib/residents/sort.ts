import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { natural } from "@/lib/enclosures/order";
import { residentPlace } from "@/lib/residents/place";

/** The columns of the residents list that can be sorted, as `?sort=` names them. */
export const SORT_KEYS = ["id", "name", "enclosure", "zone", "status", "location"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";
export type ListSort = { key: SortKey; dir: SortDir };

/** The default: name, A to Z. Written to the address only when it is not this. */
export const DEFAULT_SORT: ListSort = { key: "name", dir: "asc" };

/** `?sort=zone&dir=desc`; anything else is the default, so a stale link never errors. */
export function parseSort(params: Record<string, string | string[] | undefined>): ListSort {
  const key = SORT_KEYS.find((k) => k === params.sort);
  if (!key) return DEFAULT_SORT;
  return { key, dir: params.dir === "desc" ? "desc" : "asc" };
}

/** The query-string pieces for a sort, nothing for the default. */
export function sortParams(sort: ListSort): Record<string, string> {
  if (sort.key === DEFAULT_SORT.key && sort.dir === DEFAULT_SORT.dir) return {};
  return sort.dir === "desc" ? { sort: sort.key, dir: "desc" } : { sort: sort.key };
}

/** What a click on a heading asks for: a new column sorts A to Z, the same column reverses. */
export function nextSort(current: ListSort, key: SortKey): ListSort {
  return current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" };
}

/** The columns the database can order by itself: the rest follow the shelter's own order. */
export const DB_ORDER: Partial<Record<SortKey, string>> = {
  id: "resident_code",
  name: "name",
  status: "current_status",
};

type Placed = {
  name: string;
  enclosure_id: string | null;
  zone_id: string | null;
  zone_name: string | null;
  current_status: string | null;
};

/**
 * Zone, Enclosure and Location are not alphabetical: Zone and Enclosure follow Settings → Zones and
 * Settings → Enclosures (`sort_order`, which the list views do not carry), and Location is
 * On-site / Off-site / none. The whole filtered list is read, then ordered here by rank. Rows with
 * no value (shown as a dash) go last whichever way it runs; ties fall back to name.
 */
export function sortByPlace<T extends Placed>(
  rows: T[],
  sort: ListSort,
  ranks: { zone: Map<string, number>; enclosure: Map<string, number> },
): T[] {
  const sign = sort.dir === "desc" ? -1 : 1;
  const value = (row: T): number | null => {
    if (sort.key === "zone") {
      if (!row.zone_id || row.zone_name === SYSTEM_ZONE) return null;
      return ranks.zone.get(row.zone_id) ?? null;
    }
    if (sort.key === "enclosure") {
      return row.enclosure_id ? (ranks.enclosure.get(row.enclosure_id) ?? null) : null;
    }
    const place = residentPlace(row.current_status);
    return place === "internal" ? 0 : place === "external" ? 1 : null;
  };
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    if (x !== y) {
      if (x === null) return 1;
      if (y === null) return -1;
      return sign * (x - y);
    }
    return natural.compare(a.name, b.name);
  });
}
