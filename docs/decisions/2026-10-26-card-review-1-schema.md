# Card review 1, the schema half (migration 0265)

**Lutan, 2026-10-26**, answering `docs/card-reports/<card>.md` § Recommendation for cards 1–10: *"make each card do its job and
nothing more."* This is clause (a) of the backlog item (the database); clause (b), the app, is a later stream from a `main` that has
`0265`. Cards only. Admin is untouched and given nothing.

## What `0265` does

| Card | Change | Why |
|---|---|---|
| Administer medication, Record weight, Add medical photos, Feed special diets | `resident.record` at read **replaced by** the new `resident.who_and_where` at read | *"Yes decrease it"*; *"just what is required"* for picking a resident |
| Do maintenance | `resident.record` at read **removed**; keeps `facility.enclosures` read | *"take away the resident record"*; the enclosure page is what the job needs |
| View residents | **gains** `facility.enclosures` at read; keeps `resident.record` read | the Enclosure column fills; the *"who and where only"* narrowing was **rejected** for this card |
| Residents | gains `contacts.directory` at **read**; `photos.resident_publish` → `photos.shelter_add`; loses `placement.death`; gets the enclosure read through its include of View residents | names-only carer list; photos go through approval; the death moved |
| **Record a death** (new, card 30) | `placement.death`; includes View residents; feature *Medical information* | *"split Recording a death out into its own card in the Medical feature"* |
| Record a delivery | the **delete policy on `stock_receipts`** asks `is_admin()` instead of `stock.delivery` | *"deleting a delivery is Admin only"* |

Every role holding Residents was given Record a death **in the same file, before Residents lost the grant** (production: Management,
the 2IC and `staff`; dev: Management, `staff` and one throwaway). Nothing was given to Admin, and `can.ts` and `has_permission()` are
untouched.

## What the brief assumed that the database did not bear out

- **"Remove the delete grants from Do maintenance and Record a delivery."** There were no delete grants to remove. A delivery's delete
  rode `stock.delivery`, the activity that also records one, so no card could hold "record but not delete". The honest fix was the
  policy, to `is_admin()` (Admin sits outside the card system, so this is not a role rule). A maintenance job's delete asks
  `maintenance.delete`, which Do maintenance has never held; the job page only *promised* it, which is app-half wording.
- **"A names-only contacts read."** One already existed: `picker_contacts` (0170) shows `id, name, type, archived_at` to
  `contacts.directory` at read. No new activity or view was needed; Residents is simply given that cell at read. `contacts` itself
  still needs `contacts.browse` or `contacts.directory` at edit, which Residents does not get (checked: 0 rows of the address book).
- **"The enclosure read."** Residents' picker views already accepted `resident.register` / `placement.move`, but the save step reads
  the `enclosures` table, which asks `facility.enclosures`. Granting that at read to View residents (and Residents through the
  include) is the item's wording, and Do maintenance already held it for the same reason. Side effect, deliberate: it also opens the
  Enclosures page and map to those cards. **Doctor holds View residents, so Doctor now also holds `facility.enclosures` at read on dev
  and production**: the card test role is changed by the card, as it should be; its cells stay red on `doctor-cells` as before.
- **"A non-medical full read for View residents, if the current part is not already exactly that."** It is, to within two columns:
  medical records live in their own tables behind `medical.*`; the `residents` row itself also carries `is_desexed` and
  `blood_test_interval_months`, which are medical-ish. Left as is, flagged here; narrowing them would need a view and is a call for
  Lutan, not a regression.

## The new activity

`resident.who_and_where` (level; area residents) is read by `private.works_with_residents()`, the gate on `resident_who_and_where`
(0263). Cards 1–4 already passed that gate through their own medical activities; the explicit activity makes the bundle say what it
means and gives a future non-job card (the six listed in `docs/card-access-faults.md` whose pickers come back empty) something
narrower than `resident.record` to ask for.

## What was driven (dev, one-card logins; HTTP with a real session plus rolled-back SQL as each login)

Each of cards 1–4 and Do maintenance still does its job: medication list, weight picker and a saved weight, medical-photo picker and
`record_attachment`, special-diet and feeding lists, maintenance board / new / Enclosures. The Residents list is empty for them
(intended). Residents-only: move / foster / adopt pages fill, carers list 5 names, 0 address-book rows, Foster upload refused,
Medical and Shelter uploads accepted, death refused. Record a death alone: the form renders and the Deceased placement inserts.
Record a delivery: records, deletes 0 of 11; Admin deletes. Do maintenance deletes 0 jobs.

## Found on the way, for the app half and Lutan (not built here)

- **The Enclosures page lies to a login with no resident read.** For Do maintenance it says *"0 residents · 325 spaces free"*
  because occupants come from `resident_list_view`; that is the same "none means not allowed" fault Lutan fixed on the resident hub.
- **Residents keeps `placement.hospital`.** The item hides the *Send to hospital* button but does not ask for the grant to go, so the
  page still opens by address. Lutan to say whether the grant should follow the button.
- **`hard-coded-security` is already red on `main`** (five 0264 findings about the retired role columns it mentions), not from this
  change; `0265` adds none.
- `scripts/check-card-grants.mjs` used `facility.enclosures` as its neutral test activity; View residents now carries it, so the
  fixture moved to `community.outings`.
