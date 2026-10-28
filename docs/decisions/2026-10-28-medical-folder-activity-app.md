# Filing into the Medical folder has its own activity: the app half

Lutan, 2026-10-28: *"I can select medical photo as a folder to upload photos"* … *"And I shouldn't be able to"*. The schema half
(`0278`, `2026-10-28-medical-folder-activity-schema.md`) added `photos.medical_add`; this half makes every control and route ask it.

## What now asks `photos.medical_add` for Medical (the schema decision's five points)

1. `photoCategoriesFor()` (`src/lib/google/drive-client.ts`): Medical is in the list only with the activity, a publisher included
   (the database already refused a publisher without it). **The final fallback is `[]`, not `["Medical"]`.** The uploader on the resident
   page now draws only when the list is non-empty.
2. The Move action drops its Medical exception for any login that adds: it asks `photos.medical_add` together with
   `photos.resident_add` or `photos.resident_manage`. The gallery's `canFileToMedical` (default false) is the same test, so button and
   action cannot disagree.
3. The upload route refuses a login with no folders, and a hand-made Medical category falls out of the existing "folder must be one of" check.
4. The video start/finish routes already validate against `photoCategoriesFor()`, so they follow without change. `/medical/photos`, its
   route entry and `/api/medical/residents/[id]/photos` file only into Medical, so they ask `photos.medical_add` directly.
5. The activity was already in `catalogue.ts` (0278). The Add medical photos card's bundle in `jobs.ts` now lists it, and the
   permission-catalogue pin for the resident section moved with the page's changed reads.

## Supersedes a written-down decision

The Move action's comment said a role that only adds (a doctor) may file into Medical because that takes a photo off the website.
That was deliberate. Lutan's instruction replaces it; the comment now says so rather than vanishing. `photos.resident_add` keeps its first
meaning (may upload at all); only the second meaning, filing into Medical, moved.

## What a login with `photos.resident_add` alone now gets

Nothing in the uploader (no folder), where it used to get Medical by the fallback. A login with `photos.shelter_add` still gets Shelter.
On production Residents is held by Management and the 2IC, who also hold Add medical photos, so neither loses Medical in practice.

## Not live until production has `0276`–`0278`

The release note says the change works. It does not on production until Lutan applies those three migrations; the release cut must follow
that apply (the deploy script already refuses an unapplied migration's consumer).

## Found, not fixed

`src/app/api/residents/[id]/videos/start` and `finish` still gate entry on `photos.resident_add`; with `photoCategoriesFor()` that is safe,
but their entry check could ask the same list. Cosmetic, not a hole.
