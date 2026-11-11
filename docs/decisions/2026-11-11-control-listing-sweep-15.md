# Control listing sweep 15: fixtures, and the first driven end-to-end (#79sqf)

## Step zero
Nothing had landed: no PR on `claude/control-drive-fixtures`, and sweep 14's undriven list was unchanged. Carried on.

## Done
- **Fixtures** (deliverable 1, partly): a resident with an approved photo and a bill in the inbox; enclosures with residents
  already existed. See `docs/dev-fixtures-for-control-driving.md`. Not made: a Shelter Friend, a diet, `/operations/*` rows.
- **`/memes/make`, a `meme_add`-only login, driven in the pane:** the resident picker renders and names residents (the #1470
  fix holds). Choosing Test 1, who has an approved private photo, shows **"This resident has no photos that can be made into
  a meme."**

## Driven in the pane, one-card logins
- **/bills, login holding only the `bills` card:** the open bill draws Add another page, match-to-maintenance-job (action asks
  `maintenance.bills`, which the card carries), Save details and Delete this bill. Save printed "Saved."; Delete (confirm
  stubbed) took the inbox to "0 bills waiting". The delivery and visit matches were correctly absent (`stock.delivery`,
  `medical.visits` edit are not on that card). The save and delete actions carry no `can()` of their own; the database
  decides, and it allowed both. Match-to-job was not pressed (it would have consumed the fixture bill too).
- **/enclosures/[id], login holding only the `enclosures` card:** residents listed, no Edit, no Log button.
  Fault shape 2 found and fixed: "Log repairs and work needed on this enclosure…" was drawn to a login with no Log button.
  `EnclosureHub.tsx` now shows it only when `canWriteMaintenance`. Re-driven after the edit: the sentence is gone.
  `facility.enclosures` at edit is Admin-only by ruling; not filed.

## Found, not fixed (for the planner to file; needs schema)
**A `meme_add`-only login is offered a resident whose photos it cannot read.** `src/app/memes/make/page.tsx` lists a
resident's photos from `attachments`. Its select policy (`0316_project_photos_approval.sql`) asks `resident.record` (read)
for a resident's non-medical photos, and `meme_add` grants `resident.who_and_where`, not that. The profile photo already
comes through `resident_who_and_where`; the photo list needs the same: a view of approved, non-medical, image resident
attachments readable under `meme_add`. Not confirmed as Admin for the same resident in this session.

## Not driven in the pane (for the next stream)
Archive, match-a-bill (job match not pressed), the Shelter Friend card; per-row controls on `/medical/diets` and
`/operations/*` (no fixture rows made); the `/memes/make` canvas and the tag-save-read-back (blocked by the finding above).
The bill fixture was consumed by the Delete press; make another through `/bills` (see the fixtures doc).
