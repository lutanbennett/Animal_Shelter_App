# 2026-09-28 — Move a resident photo to a different folder: ordering and the three rules

Backlog, "Move a resident photo to a different folder when it was filed
wrongly", Lutan 2026-09-27 — the refile `0101`'s own note said staff would
have to do by hand. `movePhotoToFolder` (`src/app/residents/[id]/photos/actions.ts`)
adds a **Move to folder** action to the photo viewer's lightbox
(`src/components/PhotoGallery.tsx`), offering the other `PHOTO_CATEGORIES`
this role may move a photo into.

- **Drive moves first; `attachments.sub_folder` is written only once that
  succeeds — as the item asked.** What happens if the Drive move succeeds
  and the row write then fails: publicness is entirely `sub_folder`-driven
  (`public_resident_photos`, 0101; `is_public_drive_file`, 0084) — nothing
  reads the file's actual Drive parent — so a stalled write leaves the
  photo exactly as public or private as before the move, not worse. What
  it does leave is Drive and the database disagreeing about which folder
  the file is in, which matters to anyone browsing Drive directly rather
  than through the app. The reverse order would risk the opposite: a row
  that already says a new folder while the physical file has not moved,
  which is the harder state to notice since nothing in the app reads Drive
  to check. Drive-first means the recoverable half — retrying just the
  database write — is also the half that failed, and the action says so in
  a dedicated message (`t.photos.errors.moveIncomplete`) rather than a
  generic save error, so staff can tell the difference from an unrelated
  failure and know retrying the same move is the fix.
- **Moving the current profile photo into Medical is refused, not
  cleared.** Same rule as `setResidentProfilePhoto`
  (`src/lib/residents/profile-photo.ts`): a Medical photo is never the
  profile photo. Refusing rather than silently clearing the pointer keeps
  one rule instead of two, and never leaves a resident with no profile
  photo as a side effect of a folder cleanup.
- **A vet may only move a photo into Medical, never out of it** — the same
  `photoCategoriesForRole` restriction the upload route already enforces,
  applied to the move's target folder instead of the upload's.
- **Adoption-update photos are out of scope**, as the item said: their
  `sub_folder` is a `<YYYYMMDD>` date, not a `PHOTO_CATEGORIES` value, and
  the gallery only offers Move to folder for a photo whose folder is one of
  the four (and that has no adopter provenance).
- **No migration.** `attachments.sub_folder` already exists, and moving it
  is a plain client-side update — `attachments` already has an RLS policy
  covering write for every role that can reach this action (admin, staff
  mirrored to management, volunteer, vet scoped to their own residents by
  0108) — so no new security-definer function was needed, unlike
  `set_resident_profile_photo` / `delete_resident_photo`.
- **Works for deceased residents**, matching decisions.md 2026-09-21:
  photos stay open for editing after death, and `PhotoGallery`'s `readOnly`
  prop is (deliberately, already) never passed for the photos section — the
  move action goes through the same `refreshDeceasedArchiveIfNeeded` call
  the other photo actions use, so the archive index picks up the new
  folder.
- **The brief's "Manual: en.ts / th.ts" was stale** — `src/lib/manual/` has
  only `en.ts`; the manual is English-only (the app's own i18n dictionaries
  are the ones with an `en.ts`/`th.ts` pair, and those did get both).
