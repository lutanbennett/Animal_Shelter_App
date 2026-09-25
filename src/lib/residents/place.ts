import type { EnclosurePlace } from "@/lib/enclosures/place";

/**
 * Where a resident is, for /residents' On-site / Off-site filter and its
 * Location column (decisions.md, 2026-09-25).
 *
 * On /enclosures the Lifecycle buckets are status cards and are offered only
 * under Everywhere. Here they are animals, and most of them are somewhere:
 *
 * - On-site: a resident in an internal zone ('Resident'), and 'Unassigned' —
 *   at the shelter, not yet given an enclosure (0065).
 * - Off-site: a resident in an external zone ('Outreach', 0066), and anyone
 *   in hospital or with a foster carer. They are still in the shelter's
 *   care (public_shelter_stats counts them) but are not at the shelter, and
 *   a keeper walking the site will not find them there.
 * - Neither: 'Adopted' and 'Deceased' are history, not a place, and a
 *   resident with no placement yet has no status at all. These show only
 *   under Everywhere.
 *
 * `current_status` is itself derived from `zones.internal` (0066), so
 * filtering on it is exact and needs one column.
 */
export const STATUSES_IN_PLACE: Record<Exclude<EnclosurePlace, "all">, readonly string[]> = {
  internal: ["Resident", "Unassigned"],
  external: ["Outreach", "Hospitalised", "Fostered"],
};

export function residentPlace(status: string | null): "internal" | "external" | null {
  if (!status) return null;
  if (STATUSES_IN_PLACE.internal.includes(status)) return "internal";
  if (STATUSES_IN_PLACE.external.includes(status)) return "external";
  return null;
}
