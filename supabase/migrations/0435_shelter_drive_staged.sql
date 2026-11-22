-- consumer: src/lib/google/shelter-drive-credentials.ts, src/lib/google/shelter-google-connect.ts, scripts/drive-move-to-shelter-account.mjs
--
-- #rqv5c: a shelter that ALREADY has a Drive can connect its own Google account without every existing photo and document
-- going dark. With the drive.file scope the new account cannot see a file it did not create, so a row that goes live at
-- consent strands every stored Drive id until the files have been copied and the ids remapped.
-- `staged` = "the consent is stored and proven, but this row is NOT yet the shelter's account". The reader ignores a staged
-- row (decideCredentials gets no row), so the shelter keeps working exactly as before; the move script copies the bytes, remaps
-- the ids, sets shelters.drive_root_folder_id and clears `staged` in ONE statement.
-- Default false: every existing row, and every row the connect flow writes for a shelter with no Drive yet, is live as before.
-- Not a permission: nothing here grants or denies anyone anything; it picks which account the server acts as.
-- Decision and what was rejected: docs/decisions/2026-11-22-shelter-drive-move.md.
-- Re-runnable. TO UNDO: alter table shelter_drive_credentials drop column staged.

alter table public.shelter_drive_credentials add column if not exists staged boolean not null default false;
