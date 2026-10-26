# Card review 1, the app half (2026-10-26)

Clause (b) of the backlog item *Card review decisions, cards 1-10*. The database half is `0265`
(`2026-10-26-card-review-1-schema.md`). Cards only; Admin untouched; no role key named.

## Built here

- **A button a card cannot use is not drawn.** Each is gated by the activity its own page and save step ask for, so page and button
  cannot disagree: the resident edit pencil (list row and hub) on `resident.record` at edit; Send to hospital / Return, Foster / adopt /
  Return and Move on `placement.hospital` / `placement.rehome` / `placement.move` (`placementActionsFor()` in
  `src/lib/placements/available.ts`, used by the hub, the Housing section and the Clinic visits section); the Add buttons on the
  Prescriptions, Weight, Procedures, Immunizations, Blood tests and Diet sections on their own `medical.*` edit; the photo drop zone on
  `photos.resident_add` / `photos.shelter_add` / `photos.resident_publish`.
- **Menu.** Residents shows only for a login that reads the record (`resident.record` at read, the guard the page asks). Operations shows only
  when the login opens two or more of its pages (`pagesIn()`): with one, it is that page's own Home tile again. This is wider than the
  card report for Do stocktaking, which named Operations for that card only; Record a delivery and Administer medication fall under
  the same rule and the same reason.
- **Purchasing's "Count them in a stocktake" link** shows only with `stock.count`.
- **Enclosures page and enclosure page** leave out the figures (list, totals, map toggle, occupancy, resident list) for a login that reads
  no resident, instead of saying 0. "Reads a resident" = `resident.record` or `resident.who_and_where` at read, the same test the
  residents list view applies in the database.
- **Add medical photos wording.** After `0265` this card holds only who-and-where, so it cannot open the gallery; the old sentence named a
  role ("Management"). The page now says the card does not show them again and who can; a login that does read the record is told it can.
- **Do maintenance** no longer promises delete in the activity label (`maintenance.jobs`) or in the card walkthrough; deleting stays `maintenance.delete`.
- **Spreadsheet** was already off for cards 1-4: the button and `/residents/export` ask `resident.record` at read, which `0265` took from them.
  View residents keeps it. Verified, nothing built.

## NOT built, and why

- **The My tasks piece for Record weight and Feed special diets** needs `recurring.do_own` in their bundles, i.e. rows in `card_grants`
  (0257). That is a migration; the brief forbade one in this stream. Filed as a schema follow-up.
- **The profile-picture guard** (a Medical upload must not become the profile picture) is inside `record_attachment()` in the database
  (0259 `v_is_profile`). Also a migration.
- **Send to hospital on the Residents card.** The item says hide the button; Residents still holds `placement.hospital`, so the
  activity-gated button is still drawn for it. Hiding it for that card without naming a card needs the grant removed: Lutan's call (already noted in the schema decision).
- The ten-card driven re-pass is the separate *RERUN EVERY CARD TEST* / *CARD REVIEW 1 DRIVEN RE-PASS* items, not done here.

## Verified (dev, one-card logins, HTTP with a real session)

`view_residents`: no pencils, no placement or drop-zone or Add buttons, spreadsheet kept, Residents menu kept, Enclosures figures shown.
`do_maintenance`: no Residents menu, Enclosures page without figures or map toggle, enclosure page without occupancy, job page without Delete.
`do_stocktaking`: no Residents and no Operations menu entry, stocktake page opens.
