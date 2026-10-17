# The Add Shelter Photos route no longer uses the service-role client

Date: 2026-10-17. Migration `0219_shelter_photo_folder.sql`.

## What changed

`/api/photos/shelter/[id]` used the service role for two things: read `residents.drive_folder_id`, and write it when null. Both are now database functions called as the login:

- `shelter_photo_folder(resident)` returns `(resident_found, drive_folder_id)`. It reads that one column and nothing else.
- `set_shelter_photo_folder(resident, folder_id)` sets it only where it is null, and returns whether it did.

The file is removed from the `@/lib/supabase/admin` allow-list in `eslint.config.mjs`. That is the proof: the route can no longer import the bypass.

## Why it is narrower than what it replaced

The service-role client could reach anything and was trusted to ask for one column. The functions can only do these two things, and:

- **Each checks `photos.shelter_add` itself**, not only the route, so being able to call them is not being allowed to.
- **The null guard is in the `update`** (`where drive_folder_id is null`). Overwriting would orphan every photo already filed under the old folder with nothing in the app pointing at them.
- **The folder id is the caller's** (Drive creates the folder app-side), so it must look like a Drive id: 10 to 128 letters, digits, `_`, `-`. Nothing else is accepted.
- No other `residents` column is read, returned or written. Both are `security definer`, `search_path` pinned, execute revoked from `public` and `anon`.

## One PR, not two

The brief recommended one PR and I agree: the migration is additive and harmless to code that does not know it, only this migration is in flight, and the app half is deleting a few lines. Splitting would have left dev with schema `main` lacks for no safety gain.

## Verified

On dev, in a rolled-back transaction: a login without the card is refused on both functions; with the permission, a resident with a folder reads it, an unknown resident reports not found, a malformed id is refused, the first write on a folder-less resident succeeds, a second write returns false and leaves the first, and an attempt to overwrite an existing folder returns false and changes nothing. Real Drive upload by a volunteer is for a person (test plan).
