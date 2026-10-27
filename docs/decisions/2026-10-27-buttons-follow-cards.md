# A button is shown only if the login's cards let it do that action (2026-10-27)

**Lutan, 2026-10-27:** *"If a user cannot perform an action via the card that is assigned the buttons should not be available for example if I can view residents the buttons should not to edit the resident should not be visible."*

## What was wrong

`PhotoGallery` drew **Remove photo**, **Set as profile photo** and **Move to folder** for everyone who could see a photo. The database asks `photos.resident_manage` (plus `sees_all_residents()`) for each (`delete_resident_photo`, `set_resident_profile_photo`, 0152), and the move action asks `photos.resident_manage`, or `photos.resident_add` for a move into Medical only. A View-residents login was offered all three and refused. The hub's *Book a vet visit* link was drawn for everyone though `/clinic-visits/new` asks `visit.book`.

## What changed

- The rule is in `CLAUDE.md` ("A button is shown only if the login's cards let it do that action").
- `PhotoGallery` takes `canManage` and `canFileToMedical`, both **default false**. Remove and Set-as-profile need `canManage`; the move picker lists only folders the login can actually move into (`offeredMoves`). Both callers (the photos section and each adoption update) pass `can(perms, "photos.resident_manage")` and `can(perms, "photos.resident_add")`, read from the same place the actions read.
- *Book a vet visit* on the clinic-visits section needs `visit.book`.
- No server or database check was touched. Admin is unchanged (`can.ts` short-circuit); no role is named.
- Guard: `src/components/photo-gallery-buttons-follow-cards.test.mjs`. It reads the source and asserts the gates are present, and fails if a pattern is missing. **It cannot detect a new ungated control**; there is no render harness in the repo, so a general guard was not possible cheaply.

## Driven in the browser, dev, 2026-10-27

Same resident, photo open: a login with only `view_residents` sees none of the three; `view_residents` + `approve_photos` sees all three; Admin sees Remove photo.

## Found and NOT fixed (the next stream is briefed from this)

Swept: the resident hub sections (photos, adoption updates, clinic visits, blood tests, diet, housing, immunizations, prescriptions, procedures, weight) and the hub's edit/record-death links. Those other than the two above were already gated. **Not examined, so not known to be clean:** the row-level actions inside blood tests, immunizations and procedures lists; the pages behind each hub link (`edit`, `move`, `hospital`, `rehome`, `deceased`, `adoption-updates` forms) beyond their route guards; and everything outside `/residents` (stocktake, purchasing, deliveries, maintenance, contacts, donations, bills, website, memes). `/admin/security` and `/admin/who-does-what` were deliberately not touched (other streams own them).

The two card-review lists ("remove buttons that refuse", View residents (a)) are **not closed** by this PR except for the photo gallery and the vet-visit link.
