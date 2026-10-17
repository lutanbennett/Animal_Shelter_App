# Appeals may show a Medical photo, one by one (0216)

**Supersedes decision 3 of `0210_appeals.sql` ("MEDICAL PHOTOS"), for appeals only.** That decision refused a
Medical-folder photo on an appeal twice (a write-time guard and a read-time filter) and recorded the per-photo override
as "considered and NOT built". This builds it, narrowly. `0101` and `0103` are **not** touched: a Medical photo stays
off resident profiles, `/adopt`, the gallery and every other public view. Lutan, 2026-10-17: "but this is only for
appeals."

**Schema half only.** Nothing in the app reads these columns yet, so no medical photo can be picked or shown when this
merges. The staff picker, the first-time note, "cover until tapped" and the share-preview rule are the app half.

## What "only for appeals" means in the database

A Medical-folder file is readable by a signed-out visitor **only because** an `appeal_photos` row with
`medical_ok = true` ties it to a **published** appeal. Never because it is a resident's photo, never because the app
"knows" the file.

- `public_appeal_photos` and `public_appeals` admit a Medical file only through `p.medical_ok`. Every other part of the
  0210 filter is kept (published, not a draft, resident public-visible, the resident's own file, an image).
- **The direct file URL** goes through `is_public_drive_file`. It already asked `public_appeal_photos` (0210), so
  extending the view extends it, and **the function was not changed**. That is deliberate: one rule in one place.
- **`is_known_drive_file` (0076, revoked from anon by 0089) was the wrong thing to touch** and is untouched. It answers
  yes for any file the app holds, internal ones included; teaching it about appeals would have made every Medical file
  public.

## Unpublish and untick: automatic

Both views are live joins, so unpublishing the appeal, moving it back to draft, unticking the photo, hiding the
resident, refiling the file or deleting the row all withdraw the photo on the next read, and the proxy follows because
it asks the same view. Nothing has to be remembered or run. The harness proves each, as anon.

## Who may set it

A new activity, **`appeal.medical_photo`** (yes/no), narrower than `appeal.run`. Editing an appeal and putting a wound
photo on the public web are different powers. Admin holds it with no `role_permissions` row; Management does not unless
Settings grants it (the Director, as Admin, does). It is enforced in a trigger, so a hand-built API call cannot skip
the app. `service_role` and the owner (`auth.uid()` null) are not checked: scripts only.

## Audit (part 4)

`medical_ok_by` and `medical_ok_at` are stamped by the database on the tick (the caller's values are overwritten) and
cleared on untick. The 0210 audit trigger records every change to the row, so the history of ticks and unticks stays.

## The guard

A Medical file may be attached only with `medical_ok` set. The other refusals are unchanged (not this appeal's
resident's, not an image). Unticking a row already attached is allowed; it then simply stops being public.

## Left for the app half

- `public_appeal_photos.is_medical` and `public_appeals.cover_is_medical` (appended columns) tell the page to cover the
  photo, and the share preview to refuse a medical cover. **Open Graph must not use `cover_drive_file_id` when
  `cover_is_medical` is true.**
- "Cover until tapped", default on, reuses the existing `is_graphic` flag; the app should set it true when ticking a
  medical photo (the database does not, so the choice stays visible in the audit).
- Picker group, the first-time note to the Director, the `photoMedical` refusal in `actions.ts`, manual, dictionaries
  and the release line.

## Proof

`scripts/check-appeal-medical-photos.mjs` (rollback harness, dev) and a new block in `scripts/check-public-views.mjs`,
which fails if any Medical-folder file is public to anon without a `medical_ok` row on a published appeal.
