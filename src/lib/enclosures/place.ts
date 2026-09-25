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

/**
 * The zone chips on offer under a place: every zone under "all"; under
 * On-site or Off-site only that place's physical zones, since the Lifecycle
 * pseudo-zone holds statuses and is neither (decisions.md, 2026-09-25).
 * Shared by /enclosures and /residents so the two cascades cannot drift.
 */
export function offeredZones<Z extends { internal: boolean; is_system: boolean }>(
  zones: readonly Z[],
  place: EnclosurePlace,
): Z[] {
  return zones.filter(
    (zone) => place === "all" || (!zone.is_system && zoneInPlace(zone.internal, place)),
  );
}

/**
 * The picked zones that survive under `place`, in order. Used both when a
 * place chip is tapped (switching between On-site and Off-site keeps none,
 * so the result is the whole of the new place rather than an empty list)
 * and when a page reads `?zone=`, so a stale or hand-edited link is
 * narrowed rather than obeyed.
 */
export function zonesKeptIn<Z extends { id: string; internal: boolean; is_system: boolean }>(
  zones: readonly Z[],
  zoneIds: readonly string[],
  place: EnclosurePlace,
): string[] {
  const offered = new Set(offeredZones(zones, place).map((zone) => zone.id));
  return zoneIds.filter((id) => offered.has(id));
}
