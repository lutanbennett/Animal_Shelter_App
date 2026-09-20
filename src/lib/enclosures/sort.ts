/**
 * Sort options for the enclosure browser. Kept out of the client component
 * so the server page can validate the `?sort=` param — values exported from
 * a "use client" module arrive on the server as client references, not data.
 */
export type EnclosureSort = "zone" | "name" | "occupancy";

export const ENCLOSURE_SORTS: readonly EnclosureSort[] = [
  "zone",
  "name",
  "occupancy",
];

export function parseEnclosureSort(value: unknown): EnclosureSort {
  return typeof value === "string" &&
    ENCLOSURE_SORTS.includes(value as EnclosureSort)
    ? (value as EnclosureSort)
    : "zone";
}
