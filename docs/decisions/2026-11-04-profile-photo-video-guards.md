# A video cannot become the profile picture by `set_resident_profile_photo()` or the delete fallback (0313)

Stream `claude/profile-photo-video-guards`, backlog `#27l6m`. One migration, `0313_profile_photo_picture_guards.sql`, two functions.

## Call order traced, per site (the item said this was not established)

`0306` could not read `media_kind` because `record_attachment()` inserts the row and the video `finish` route
(`src/app/api/residents/[id]/videos/finish/route.ts`) sets `media_kind = 'video'` in a later update, so inside that one call every row is still a `photo`.

- **`set_resident_profile_photo(p_resident_id, p_drive_file_id)`** (live body `0277`) is called from `src/lib/residents/profile-photo.ts`
  only on a file that must already have an `attachments` row (the function itself refuses otherwise). It never inserts. By the time a person
  picks a file, `finish` has long since run, so the column is readable.
- **`delete_resident_photo()`** (live body `0264`) deletes the row, then picks the fallback from the *other* rows of that resident. Those rows were
  all filed earlier by completed calls, so their `media_kind` is readable too.

## Discriminator: the same at both sites, and why

`coalesce(media_kind, 'photo') = 'photo'` **and** a file name not ending in a video extension (the `0306` list). Neither site needs `0306`'s
`p_media_kind` parameter, since neither sits in the call that inserts the row. The name test stays as a backstop for the one row the column can
be wrong on: a video whose later `media_kind` update failed. A name wrong in the other direction (odd extension on a real photo) is only stricter,
never a leak.

`set_resident_profile_photo` raises `Only a photo can be the profile photo.`; the delete fallback silently skips non-pictures and, if only a video
is left, leaves the profile picture empty.

## Proof

`scripts/check-record-attachment-guards.mjs` section D (dev only, rollback): failed at D1 against the live function before `0313`; passes after.
It proves a video is refused by kind, a video-named file marked `photo` is refused, a photo is accepted, deleting the profile photo promotes the
later photo over an older video, and leaves none when only a video remains. The Admin bypass is untouched; nothing is keyed on a role.

## Found, not fixed (for the planner to file)

- **The fallback itself** (promote the next-oldest attachment when the profile photo is deleted) is a choice nobody wrote down. Only the video
  case was changed. If it is wrong in general, that is a separate decision.
- **The fallback does not skip a Medical file**, though `set_resident_profile_photo` refuses one (0277). Same shape as this item; not widened here.
