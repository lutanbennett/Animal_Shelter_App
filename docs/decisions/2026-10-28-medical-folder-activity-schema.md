# Filing into the Medical folder has its own activity: the schema half (`0278`)

Lutan, 2026-10-28: *"I can select medical photo as a folder to upload photos"* … *"And I shouldn't be able to"*.

**The activity is `photos.medical_add`** (yesno, area `photos`, sort 72). It is granted by cards and nothing else: **Add medical photos**
(`add_medical_photos`) and **Manage medical** (`medical_records`). No role key is read; Admin sits outside the card system and answers
through `has_permission()` as before, holding no cell.

## What the database now does

- `record_attachment()` (live body: `0269`): a resident photo whose folder is Medical needs `photos.medical_add`, **a publisher included**.
  Every other folder keeps today's rule (publish, or `photos.shelter_add` into Shelter).
- `attachments_insert_folder_guard` (`0152`) and `attachments_update_folder_guard` (`0269`): a Medical row needs `photos.medical_add`; any
  other resident row needs publish (update: or `photos.approve`), as before. The brief named only the update guard. The insert guard is
  the identical hole (a `photos.resident_add` login could insert a Medical row straight through the table API), so it moved too.
- The Medical test strips every character JS `trim()` strips (as `0276`), so `Medical<tab>` is Medical here as in `isMedicalFolder()`; a
  near-miss can only make the check stricter.

## Supersedes a written-down decision

`src/app/residents/[id]/photos/actions.ts:119` says a role that only adds (a doctor) may move a photo into Medical. That was deliberate;
Lutan's instruction of 2026-10-28 replaces it. Medical now asks `photos.medical_add` there too (app half).

## Who loses Medical filing

The migration's NOTICE names every role that held `photos.resident_add` and does not hold `photos.medical_add` afterwards. **Read on dev
(`qxkmhwybjggxvsfxsxbd`), 2026-10-28, after applying: no role loses it** (management, second_in_command, head_of_medical and a disposable
dev sign-in role all hold both). On production the item records Residents as held by Management and the 2IC, and both also hold Add
medical photos, so neither loses it in practice; re-read with the production apply, the runner's NOTICE being the reading there.

## Behaviour change worth knowing

A login that can edit a photo already in Medical (`photos.resident_manage`) but lacks `photos.medical_add` can no longer save changes to
that row (the update guard checks the new row). That is the intended consequence of Medical needing its own activity.

## Proof

`node scripts/check-medical-folder-activity.mjs` (dev, rolled back): a login with only `photos.resident_add` is refused Medical through
`record_attachment()` and a direct insert; the Residents shape (`resident_add` + `resident_publish`) is refused Medical in five spellings
and still files into Shelter, Foster and Adoption by both paths; `photos.medical_add` files into Medical by both paths and nowhere else;
Admin files into both folders holding no cell; the activity sits on exactly the two cards. Result `HARNESS-OK`.

## The app half still has to change

Nothing under `src/` changed here. The next stream must make each of these ask `photos.medical_add` for Medical, read from the same
place as the database:

1. `photoCategoriesFor()` (`src/lib/google/drive-client.ts:66`): drop Medical from the Shelter + resident_add case unless `can(perms,
   "photos.medical_add")`, and make the final fallback `return []`, not `["Medical"]`.
2. The Move action (`src/app/residents/[id]/photos/actions.ts:119`) and the Move choice in the gallery.
3. The upload route (`src/app/api/residents/[id]/photos/route.ts`, ~44): refuse a hand-made Medical request without the activity.
4. `/medical/photos` and the video start/finish routes if they file into Medical.
5. Register `photos.medical_add` in `src/lib/permissions/` if the activity list there is hand-kept.

**The app-half PR carries the release note** (the outstanding step is that PR, not a command).

## Found, not fixed

None beyond the insert guard above.
