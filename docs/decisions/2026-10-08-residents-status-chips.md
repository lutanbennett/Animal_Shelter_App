# Residents: Unallocated and the status chips replace the Lifecycle zone chip

**Date:** 2026-10-08 · **Branch:** `claude/residents-and-nav-polish` · **Asked by:** Lutan

## What was wrong

On `/residents` the zone chips included the Lifecycle pseudo-zone, shown as "Status". A
zone pick filters `zone_id in (…)`, and that zone holds the Unassigned, Hospital, Fostered
and Adopted pseudo-enclosures, so picking it listed the adopted with the unallocated.
Confirmed on dev: one sample of each status, all four in the Lifecycle zone.

## What we did, and why this shape

- **The Lifecycle zone is no longer a zone on `/residents`.** It is not a place, and the
  page already filters these residents by status rather than zone (`applyFilters`). Its
  pseudo-enclosures also leave the Enclosure select. `/enclosures` is unchanged: its
  Lifecycle cards were already only Hospital, Unassigned and Fostered.
- **Unallocated (`?unallocated=1`) sits with the zone chips** and filters
  `current_status = 'Unassigned'`. Picked with physical zones it **adds** to them
  (`or(zone_id.in.(…),current_status.eq.Unassigned)`), because zone chips add to each other
  and a person picking "Front Zone + Unallocated" means both. It is offered under
  Everywhere and On-site, not Off-site, since unallocated residents are at the shelter.
- **An old link to the Lifecycle zone now means Unallocated**, not "dropped", so a bookmark
  of the old Status chip opens what that chip should always have shown.
- **Adopted, Fostered and Hospitalised are one status chip set (`?status=`)**, one at a
  time, each clearing place, zones, Unallocated and enclosure, as Adopted did alone.
  `?adopted=1` is still read as Adopted, so old links work without a redirect.
- **The hidden-match notice covers all three.** Adopted are in no place, so any place hides
  them; Fostered and Hospitalised are Off-site, so only On-site (or a zone, Unallocated,
  enclosure, or another status chip) hides them. One count query per hidden status, only
  when a search is typed.

## The cursor

`autoFocus` moved off Scan a chip, but **not** onto Search as a plain `autoFocus`.
`FocusSearch` focuses Search only from `md:` (768 px) up, because on a phone a focused box
opens the keyboard over the list, and only when nothing else has focus, because the search
form is re-keyed on every filter change and a plain `autoFocus` would pull the cursor off a
chip someone had just clicked or tabbed to. A chip reader typing into Search works as it did
in Scan a chip: both send the same `q`.

## Checked by

`scripts/check-residents-status-chips.mjs` (dev, a throwaway staff login), and
`scripts/check-phone-width.mjs` on `/residents`, `/enclosures` and `/operations`.
