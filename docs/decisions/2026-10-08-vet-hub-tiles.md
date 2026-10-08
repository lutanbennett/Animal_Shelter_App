# Where each tile on a vet's page goes

2026-10-08, `claude/vet-hub-tiles`. Backlog: *Vet (clinic) page: every summary
tile opens its details*.

The vet hub (`src/app/vets/[id]/VetHub.tsx`) has seven `StatCard`s. Each now
opens something, but no tile got a page of its own: everything they count is
already in the one list of visits the hub loads, so each one opens a section of
the hub.

| Tile | Opens | Why |
|---|---|---|
| Scheduled | The new **Scheduled** section (`#schedule`): overdue visits first (red, oldest first), then upcoming (soonest first). Each row has the resident's photo and name, date and time, reason, doctor, and **Edit** → `/vet-visits/<id>/edit`. | What Lutan asked for first. Not governed by the period picker: the future and the overdue are not part of any past window, as the page already said. The tile now says both counts (`3 overdue · 1 upcoming`) when there are both. |
| Visits | The **Visits** list (`#visits`), filter cleared. | It already lists those visits. |
| Residents seen | The **Residents seen** list (`#residents`). | Same. |
| Spend | The Visits list, showing only visits with a cost. | Each row already shows its cost. |
| Procedures, Blood tests, Prescriptions | The Visits list, showing only the visits those records were logged against. A row then opens that tab of the resident's record (`/residents/<id>/procedures` and so on) instead of their vet appointments. | The records themselves live on the resident's tabs, which have no clinic filter. Three new sections would have repeated those tabs, worse. A visit is the thing a vet recognises. |

**A tile with nothing under it has no link**, as `StatCard` already allowed: a
link to an empty list is worse than none.

**The chip shows the tile's number.** The record filters count records, as the
tiles do, though one visit may carry several (Novel: 3 procedures on 2 visits).
The list heading then counts the visits. An earlier cut counted visits on the
chip, and `Procedures 2` under a tile reading 3 looked like a bug.

**How a tile sets the filter.** `StatCard` gained an optional `onClick` beside
`href`. The hub's handler sets the filter, scrolls to the section and puts the
hash in the URL with `replaceState`. The router does not do the scroll, so a
second tap on the same tile still lands on the list. The `href` stays a real
`#section` link, so a tap before the page has finished loading still jumps to
the right place, just without the filter. The scroll is instant, not smooth:
smooth scrolling did nothing at all in the desktop app's browser pane, and
instant also suits anyone who has animation turned off.

**No new wording.** The word "Vet" is being retired (the parked rename item),
so every new label is one more string that rename has to find. The section
heading and its two sub-headings reuse the tile's own strings (`schedule`,
`overdue(n)`, `upcoming(n)`), the filter chips are the tile titles, the row's
link is `common.edit` (as on `/appointments`), and the empty state is
`nothingScheduled`. **0 strings added to either dictionary.** The backlog item
said *Open*. The link says **Edit** because that is the word already used for
the same link on a doctor's Appointments page.

**Scope.** No new query. The page's one visit query gains the resident's
`profile_photo_drive_file_id` inside the existing `residents(...)` embed, so
row-level security decides what is visible, exactly as before (`0108`/`0110`).
The Edit link is shown only to people who can read visits (`medical.visits`),
which is what `/vet-visits/<id>/edit` requires anyway.

**The doctor's `/appointments`.** It already lists overdue visits first, as
*To write up*, oldest first, each with Edit. The only change: that section's
count and dates are red when there are any, as overdue visits are on the
clinic's page.

**Found while checking:** on dev, the **Vet** role currently has no
`medical.visits` permission (`my_permissions()` returns only `resident.record`
and `resident.microchip`), so a vet login linked to a clinic is sent to
no-access from `/appointments`. This change did not cause it and does not
change it (the vet's permission cells are deliberately left as they are, see
the roles item, 2026-10-07). It is why the doctor's view is in the test plan's
*Left for manual verification* table and not ticked.
