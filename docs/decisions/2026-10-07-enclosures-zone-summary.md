# Enclosures page: zone summary line (2026-10-07)

- **Filters:** the figures describe what is shown. With a search, zone chip or the
  open-maintenance tick on, a zone's line adds "showing 4 of 12 enclosures"; the
  "All zones" line above the list totals what is shown too.
- **Free spaces:** `spacesFree()` in `src/lib/enclosures/occupancy.ts`: capacity minus
  residents, floored at zero per enclosure. An over-capacity enclosure counts as zero
  (Lutan, 2026-10-06), so it never reduces its neighbours' spaces. Enclosures with no
  capacity are left out and counted ("2 enclosures have no capacity set").
- **Hospital / Fostered:** those residents sit in the Lifecycle buckets, not a kennel, so
  they are in no zone's residents or free spaces. A kennel's free space therefore ignores
  an animal who is away and may come back; the Lifecycle cards stay out of the zone figures.
- **Colour dot:** left out until the zone colour item lands.
- **Phones:** one line that wraps under the name; nothing hidden.
