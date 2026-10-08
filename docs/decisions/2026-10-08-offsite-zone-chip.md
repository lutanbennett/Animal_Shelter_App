# One Off-site chip for every off-site zone, and no place row

**Date:** 2026-10-08 · **Branch:** `claude/enclosures-offsite-chip` · **Asked by:** Lutan

## What changed

Enclosures and Residents had two filter rows: Everywhere / On-site / Off-site (`?place=`), and
under it a chip per zone, each off-site zone (Offsite, Orchard, Village) its own chip. Now there is
one row: All zones, each on-site zone in the shelter's order, **Off-site**, then Status
(/enclosures) or Unallocated (/residents). The place row is gone; the shared component keeps its
name, `PlaceZoneChips`, to keep the diff small.

## Why this shape

- **Off-site is its own value, `?zone=offsite`, not a list of zone ids.** It is expanded to every
  zone with `internal = false` when the page is read (`readZonePick` / `zoneIdsOf`,
  `src/lib/enclosures/place.ts`). A zone added or switched to off-site under Settings → Zones
  joins it with no code change, *and* an old bookmark of the chip follows it, which an expanded
  id list in the URL would not. No zone is named in code. `scripts/check-offsite-chip.mjs` makes a
  zone no code has seen and checks it lands under Off-site, because a list of the three names
  would pass on dev's own zones.
- **Off-site sits after every on-site zone.** Since `0161` the shelter orders its zones, and the
  off-site zones each have their own place in that order (on dev they are interleaved with the
  on-site ones). No single one of them can stand for the chip, so it goes after the on-site
  zones, which keep their order exactly, and before the Status / Unallocated chip, which was last
  before and stays last.
- **On /residents, Off-site is the off-site zones only.** The old Off-site place also took in
  Fostered and Hospitalised residents (by status, `STATUSES_IN_PLACE`). Since #474 those have
  chips of their own, so folding them into Off-site as well would make two chips for one animal
  and make the row disagree with /enclosures, where Fostered and Hospital are Status cards.
  `residentPlace` still drives the Location column and the spreadsheet's place column.
- **Unallocated is now offered alongside Off-site** (it was hidden under the Off-site place).
  Chips add to each other, so Off-site + Unallocated is both groups, as any two zones are.
- **Show all and the Adopted / Fostered / Hospitalised chips no longer depend on a place.** With
  no place, the deceased toggle is always offered, and the status chips are offered whenever no
  zone chip, Unallocated or enclosure is picked, as they were under Everywhere.

## Old links

Nothing in the app linked to `?place=`; the manual described the row, and two check scripts used
it. Bookmarks and shared links might, so both pages read an old link as the chips that mean the
same and **redirect to the tidy URL** (`tidiedQuery`), so the address bar says what is on screen:

- `?place=external` → `?zone=offsite`.
- `?place=internal` → the on-site zones picked with it, or all of them; on /residents also
  `unallocated=1`, since On-site counted the unallocated as on site.
- An off-site zone's own id → `?zone=offsite`. The enclosure hub's "back to zone" link
  (`/enclosures?zone=<zone>`) does this for an enclosure in Orchard, which is the nearest chip.
- The /residents spreadsheet route reads the same rules without redirecting.

## Checked by

`scripts/check-offsite-chip.mjs`, `scripts/check-residents-status-chips.mjs` and
`scripts/check-residents-export.mjs` (dev, throwaway logins), and `scripts/check-phone-width.mjs`
on `/enclosures`, `/residents` and `/enclosures?zone=offsite`.
