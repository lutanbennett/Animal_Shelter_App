# Resident photos tab: uploader per card, caption per approval state (#q8h4v, #r6v8k)

## 1. Uploader (`#q8h4v`)
Step zero found the uploader was already hidden for a login with no folder (`photoCategoriesFor(perms).length > 0`,
Card review 1). What remained: a login holding a folder card (`photos.shelter_add`, `photos.medical_add`) but not
`photos.resident_add` still saw it, and the route refuses it.

Table of the folders this tab's uploader offers, against what the route asks (`src/app/api/residents/[id]/photos/route.ts`):

| Folder | Asked |
|---|---|
| every folder | `photos.resident_add` (route.ts:98, and :45 as an entry test) **and** membership in `photoCategoriesFor(perms)` (route.ts:97) |
| Medical | the above, with `photos.medical_add` (`drive-client.ts:67`) |
| Shelter | the above, with `photos.shelter_add` or `photos.resident_publish` (`drive-client.ts:68-71`) |

`resident.adoption_news` (route.ts:45, :92) is the **adoption-update** path (`AdoptionUpdateForm`), not this tab's
uploader, so it is not asked here. No folder's route asks neither activity.
Change: `photos.tsx` `uploadFolders = can(perms,"photos.resident_add") ? photoCategoriesFor(perms) : []`.
Route and policies untouched (hiding is the courtesy).

## 2. Caption (`#r6v8k`)
`src/lib/photos/approval-state.ts`: `approved_at` set -> public; `approval='private_only'` -> private; NULL -> waiting;
`public_ok` -> public; anything else -> "other" (described as "Not on the website", never as waiting). No role named.
`residentPhotoSelect` now reads `approval`. The waiting count on the tab counts only truly waiting photos.

## 3. Five callers
- `/adopt/[id]` uses its own `src/app/adopt/[id]/PhotoGallery.tsx` (ids only): no approval wording at all. Unchanged, nothing to fix.
- `sections/photos.tsx`: three-state caption. `sections/adoption-updates.tsx`: gets it through the shared component; its select is separate, so `approval` is absent there and a Private only photo reads as waiting until that select adds it (**found, not fixed**: not this item's controls).
- `EditResidentForm`/`edit/page.tsx` import only the `PhotoRow` type. `PhotoViewer`, `ThumbnailStrip`: no approval wording.

## 4. Thai
Thai strings are **unreviewed**.

## 5. Closed / not closed
`#wdjt0` (no card grants `projects.photos`/`maintenance.photos`) is a missing grant: untouched, not ticked.
`#79sqf`: not ticked. Caption half is dev-only until `0318` reaches production.

## 6. Not driven
Browser drive with one-card logins is not done in this session; it is left for manual verification.
