---
card: enclosures
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (dev: 265 applied, 0 pending)
---

## Purpose

Lets a person see where the shelter keeps its animals: the zones, the enclosures in each, how many animals each holds and how many spaces are free. It changes nothing.

## Gives access to

### Pages

- **Enclosures**, as a list (grouped by zone, with a search, a sort and a "has open maintenance" filter) and as a **map** (a plan of the shelter, tap a place to see it).
- **The Residents list** appears in the menu and opens, but see restrictions.

### Tables

- **Enclosures and zones** (read only).

### Forms

- None. No add, edit or save control is offered anywhere on the Enclosures page or the map.

## Major restrictions

- **It shows the wrong numbers.** With only this card, every enclosure reads **0 residents** and the page says "0 residents, 325 spaces free" shelter-wide. Cat Enclosure showed **0 / 5, "Space available"** when it is actually full (5 / 5, "Full"
  for a login that can also read residents). The card can read the enclosures but not who is in them, so it counts nobody and calls a full enclosure empty.
  This is the card that looks like access and is not: it is wrong in the very thing the page is for. The same page, for a login holding Do Maintenance, showed 55 residents and 5 / 5.
- **The open-maintenance counts are missing.** Do Maintenance's view showed a spanner with job counts on each enclosure; this card shows none, because it cannot read maintenance jobs.
- **The Residents list is empty.** It is in the menu and opens, but reads "0 residents".
- **Cannot open** Maintenance or the medication list (both refused).

## Recommendation

- **Increase (needed for the card to be true):** add the read of residents' "who and where" that the occupancy count depends on, or let the page count occupancy without it. As it stands the card gives a shelter-wide picture that is confidently wrong.
  This is the same shape as the other cards that cannot read residents; the fix is likely one decision for all of them (see the access fault log).
- **Decrease (small):** hide the Residents entry from the menu for this card; it only shows an empty list.
