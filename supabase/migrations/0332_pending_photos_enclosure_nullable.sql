-- consumer: src/app/api/photos/pending/route.ts, src/app/photos/approve/pending-actions.ts, src/app/photos/add/uploadPending.ts, src/lib/photos/pending.ts
--
-- SCHEMA half of backlog item #40oz4: a photo taken where neither the resident NOR the enclosure is known must be
-- storable for later review. pending_photos (0218) already is "store it for later"; the only thing stopping the
-- both-unknown case was `enclosure_id uuid not null`. This file drops that one constraint. Nothing else changes.
-- A NULL enclosure_id now means "the filer did not know where this was taken"; the approver names the resident
-- (assign_pending_photo) or discards it exactly as before.
--
-- The `-- consumer:` warning from apply-migrations.mjs is CORRECT and EXPECTED here: the app half (the route that
-- accepts a missing enclosure, and the confirm control) is a separate, later PR. Until then nothing writes a NULL.
--
-- WHY THIS WIDENS NOTHING (read in the migration files, not assumed):
--   * Row visibility. The select policy is pending_photos_select, last set by 0224 (it replaced 0218's
--     can_publish_resident_photos() test): `uploaded_by = auth.uid() or can_approve_photos()`. It never mentions
--     enclosure_id, so a NULL enclosure is seen by exactly the same logins as a non-null one. The insert, update and
--     delete policies likewise test only the caller (can_file_pending_photo / can_approve_photos).
--   * Public exposure. 0286:32 (still true in 0324:32) folds a pending photo into can_see_drive_file() by its mere
--     presence in pending_photos, not by the enclosure it points at. is_public_drive_file() asks the public views,
--     none of which read this table. A NULL enclosure changes neither.
--   * assign_pending_photo() never reads enclosure_id. pending_photo_candidates() inner-joins placement_history on it,
--     so for a NULL enclosure it returns no rows, which is the true answer (nobody can be inferred) and not an error.
--
-- Re-runnable: drop not null on an already-nullable column is a no-op. To undo in a new file, first give every NULL
-- row an enclosure (or delete it), then `alter column enclosure_id set not null`.

alter table pending_photos alter column enclosure_id drop not null;

comment on column pending_photos.enclosure_id is
  'Where the photo was taken, if the filer knew. NULL = unknown (0332): the approver names the resident or discards it. Not an access input: no policy reads it.';

notify pgrst, 'reload schema';
