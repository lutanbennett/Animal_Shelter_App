-- consumer: none
--
-- Deletes the phantom 0201_map_rooms_drop_map_id_shape.sql ledger row from dev for good. 0203 did this once and
-- the row came back, because three old worktrees still held the file under its old name and an unguarded
-- `--env test` run re-inserted it. Those worktrees are gone (no copy of the file remains anywhere) and #658 made
-- `--env test` refuse a file absent from origin/main but present in the merge-base, so nothing can re-insert it.
-- Applied files are never edited, hence a new file rather than a change to 0203.
-- Exact name, nothing else. On a database that never had the row (production, a rebuild from zero) it deletes
-- nothing, so it is safe to re-run anywhere.

delete from schema_migrations
 where filename = '0201_map_rooms_drop_map_id_shape.sql';
