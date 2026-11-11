# Control listing sweep 15: fixtures, and the first driven end-to-end (#79sqf)

## Step zero
Nothing had landed: no PR on `claude/control-drive-fixtures`, and sweep 14's undriven list was unchanged. Carried on.

## Done
- **Fixtures** (deliverable 1, partly): a resident with an approved photo and a bill in the inbox; enclosures with residents
  already existed. See `docs/dev-fixtures-for-control-driving.md`. Not made: a Shelter Friend, a diet, `/operations/*` rows.
- **`/memes/make`, a `meme_add`-only login, driven in the pane:** the resident picker renders and names residents (the #1470
  fix holds). Choosing Test 1, who has an approved private photo, shows **"This resident has no photos that can be made into
  a meme."**

## Found, not fixed (for the planner to file; needs schema)
**A `meme_add`-only login is offered a resident whose photos it cannot read.** `src/app/memes/make/page.tsx` lists a
resident's photos from `attachments`. Its select policy (`0316_project_photos_approval.sql`) asks `resident.record` (read)
for a resident's non-medical photos, and `meme_add` grants `resident.who_and_where`, not that. The profile photo already
comes through `resident_who_and_where`; the photo list needs the same: a view of approved, non-medical, image resident
attachments readable under `meme_add`. Not confirmed as Admin for the same resident in this session.

## Not driven in the pane (for the next stream)
Archive, Save, match-a-bill, the Shelter Friend card; per-row controls on `/bills`, `/medical/diets`, `/operations/*`;
`/enclosures/[id]` with residents under a card that reads residents; the `/memes/make` canvas and the tag-save-read-back
(blocked by the finding above: no photo is reachable under `meme_add` alone).
