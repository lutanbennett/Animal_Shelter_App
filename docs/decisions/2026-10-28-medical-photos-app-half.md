# Medical photos: the app half of `0276`

Schema half: `2026-10-28-medical-photos-need-their-own-read.md`. This is the page and the uploader.

- **Page.** `photos.tsx` asks `can(perms, "photos.resident_medical")` (the activity `0276`'s policy asks) and drops Medical-folder rows
  for a login without it, using the same `isMedicalFolder` test as everywhere. The database already returns none; this keeps the
  count, the filters and the empty state honest if that ever changed. The gallery has no separate Medical heading, only a folder label
  per photo, so nothing renders empty.
- **Uploader.** `PhotoUploader` takes `canSeeMedical` (default false). Without it, a Medical upload says "Saved to Medical (not shown to
  you)" rather than "Done", and the folder note says the login can add but not view Medical photos. Add medical photos still does not
  read: that was Lutan's ruling, so the fix is the wording, not a grant.
- **Unchanged:** Move-to-folder and the Medical upload option still follow `photos.resident_manage` / `photos.resident_add`.
  No server or database check changed. No migration.

## Found, not fixed
- `set_resident_profile_photo()` has no Medical guard (its own backlog item).
- `adoption-updates.tsx` also draws the gallery; it shows adopter photos, not the Medical folder, so left alone.
- Release note owed once Lutan applies `0276` to production: "Medical photos are now visible only to logins holding View medical or Manage medical."
