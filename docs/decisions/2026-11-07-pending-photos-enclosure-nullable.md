# 2026-11-07 — `pending_photos.enclosure_id` becomes nullable (schema half of #40oz4)

**Decision.** `0332_pending_photos_enclosure_nullable.sql` drops `not null` from `pending_photos.enclosure_id`. A NULL
enclosure means "the filer did not know where it was taken". Nothing else in the schema changes.

**Why this and not a new table or a new column.** The "store it for later" mechanism already exists (`0218`); the
both-unknown case failed only because of that one constraint. A separate "unplaced photos" table would duplicate the
policies, the audit trigger, the `can_see_drive_file()` fold and the approval queue.

**Why it widens nothing (re-read on 2026-11-07).**
- The select policy is no longer `0218`'s: `0224` replaced it with `uploaded_by = auth.uid() or can_approve_photos()`.
  The brief quoted 0218's wording; the live rule is 0224's. Neither mentions the enclosure; insert/update/delete test only the caller.
- `can_see_drive_file()` folds a pending photo by presence (`0286:32`, unchanged in `0324:32`), not by enclosure.
  `is_public_drive_file()` asks the public views, none of which read this table.
- Proved by `scripts/check-pending-photos-null-enclosure.mjs` (rollback harness on dev).

**Call sites that touch the column (for the app half).**
- `pending_photo_candidates()` inner-joins `placement_history` on `enclosure_id`: a NULL row yields no candidates. Correct, not a fault; the queue must show "no one to suggest".
- `loadPendingPhotos` (`src/lib/photos/pending.ts:55`) embeds `enclosures(...)`, a left join, so the row is kept; but `PendingRow.enclosure_id`/`PendingPhoto.enclosureId` are typed `string`, and `enclosureName` already tolerates null.
- `route.ts:64-66` rejects a non-uuid enclosure and `:67-71` requires the name; both need a "no enclosure" branch; `HOLDING_FOLDER` ("Unsorted") then needs a subfolder name for the no-enclosure case.
- `assign_pending_photo`, `discardPendingPhoto`, `countStalePending`, `approval.ts:190` never read the enclosure.

**Not done here:** no `src/` change, and `#40oz4` is deliberately not ticked (two halves remain).
