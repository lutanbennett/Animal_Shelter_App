/**
 * The zone chips on /enclosures and /residents (`?zone=`): one chip per
 * on-site zone, in the shelter's order, then one **Off-site** chip for every
 * zone with `internal = false` (0004), then the Lifecycle pseudo-zone where a
 * page offers it (2026-10-08). Kept out of the client components for the same
 * reason as sort.ts: the server pages parse the param.
 *
 * The Off-site chip is its own value in the link, `?zone=offsite`, and is
 * turned into zone ids only when a page is read, so a zone added or switched
 * to off-site under Settings → Zones joins it with no code change and an old
 * bookmark follows it. No zone is ever named here.
 *
 * Shared by /enclosures and /residents so the two cascades cannot drift.
 */
export const OFFSITE = "offsite" as const;

type ZoneLike = { id: string; internal: boolean; is_system: boolean };

/** A real zone away from the shelter: the Lifecycle pseudo-zone holds statuses and is neither. */
export function isOffsiteZone(zone: { internal: boolean; is_system: boolean }) {
  return !zone.internal && !zone.is_system;
}

/** `?zone=a,b` → values, in order, without blanks or repeats. */
export function parseZoneIds(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.join(",") : typeof value === "string" ? value : "";
  return [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))];
}

/**
 * The chips in display order: on-site zones as `zones` lists them (the
 * shelter's order), then `OFFSITE` if any zone is off-site, then the
 * Lifecycle pseudo-zone. Off-site goes after every on-site zone because the
 * zones it stands for each have their own place in the shelter's order, and
 * no one of them can speak for the rest.
 */
export function zoneChipOrder<Z extends ZoneLike>(zones: readonly Z[]): (Z | typeof OFFSITE)[] {
  const onSite = zones.filter((zone) => !zone.is_system && zone.internal);
  const system = zones.filter((zone) => zone.is_system);
  return [...onSite, ...(zones.some(isOffsiteZone) ? [OFFSITE] : []), ...system];
}

/**
 * What `?zone=` (and an old `?place=`) picks, as chip values: on-site and
 * Lifecycle zone ids, and `OFFSITE`. Anything else is dropped rather than
 * obeyed, so a stale or hand-edited link is narrowed instead of emptying the
 * page (decisions.md, 2026-09-25).
 *
 * - An off-site zone's own id (an enclosure hub's "back to its zone" link)
 *   picks the Off-site chip, which is the closest chip there is.
 * - `?place=external`, the Off-site place before 2026-10-08, is the Off-site
 *   chip; any on-site zone with it was already being dropped.
 * - `?place=internal`, On-site, is the on-site zones picked with it, or all
 *   of them if none were.
 */
export function readZonePick<Z extends ZoneLike>(
  zones: readonly Z[],
  zoneParam: unknown,
  placeParam?: unknown,
): string[] {
  const byId = new Map(zones.map((zone) => [zone.id, zone]));
  const anyOffsite = zones.some(isOffsiteZone);
  const picked: string[] = [];
  let offsite = false;
  for (const value of parseZoneIds(zoneParam)) {
    const zone = byId.get(value);
    if (value === OFFSITE || (zone && isOffsiteZone(zone))) offsite = anyOffsite;
    else if (zone) picked.push(value);
  }
  const onSite = (id: string) => {
    const zone = byId.get(id);
    return Boolean(zone && !zone.is_system && zone.internal);
  };
  if (placeParam === "external") return anyOffsite ? [OFFSITE] : [];
  if (placeParam === "internal") {
    const kept = picked.filter(onSite);
    return kept.length ? kept : zones.filter((zone) => onSite(zone.id)).map((zone) => zone.id);
  }
  return offsite ? [...picked, OFFSITE] : picked;
}

/** Chip values → the zone ids they stand for: `OFFSITE` becomes every off-site zone. */
export function zoneIdsOf<Z extends ZoneLike>(zones: readonly Z[], pick: readonly string[]): string[] {
  return pick.flatMap((value) =>
    value === OFFSITE ? zones.filter(isOffsiteZone).map((zone) => zone.id) : [value],
  );
}

/** The pick with one chip added, or taken off if it was on. */
export function toggleZone(pick: readonly string[], value: string): string[] {
  return pick.includes(value) ? pick.filter((v) => v !== value) : [...pick, value];
}

/**
 * The query string a page should be at, when the one it was opened with is
 * an old or untidy form of it: `?place=` gone, `?zone=` written as the chips
 * read it. Null when the URL is already that. Everything else is kept.
 */
export function tidiedQuery(
  searchParams: Record<string, string | string[] | undefined>,
  set: Record<string, string>,
): string | null {
  const before = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") before.set(key, value);
  }
  const after = new URLSearchParams(before);
  after.delete("place");
  for (const [key, value] of Object.entries(set)) {
    if (value) after.set(key, value);
    else after.delete(key);
  }
  const text = (params: URLSearchParams) => params.toString().replace(/%2C/gi, ",");
  return text(after) === text(before) ? null : text(after);
}
