/**
 * The enclosure browser's On-site / Off-site filter (`?place=`), read from
 * `zones.internal` (0004). Kept out of the client component for the same
 * reason as sort.ts: the server page parses the param.
 */
export type EnclosurePlace = "all" | "internal" | "external";

export const ENCLOSURE_PLACES: readonly EnclosurePlace[] = [
  "all",
  "internal",
  "external",
];

export function parseEnclosurePlace(value: unknown): EnclosurePlace {
  return value === "internal" || value === "external" ? value : "all";
}

/** Whether a zone belongs under a place. "all" takes every zone. */
export function zoneInPlace(internal: boolean, place: EnclosurePlace) {
  return place === "all" || internal === (place === "internal");
}

/** `?zone=a,b` → ids, in order, without blanks or repeats. */
export function parseZoneIds(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.join(",") : typeof value === "string" ? value : "";
  return [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))];
}
