-- consumer: none
--
-- Housekeeping for the 0201 clash (docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md).
-- Two merged PRs both took 0201; the later one, map_rooms_drop_map_id_shape, is renamed to 0202 and dev
-- already held a row under that name. This removes the one row left behind under the old name, so the
-- ledger and the files agree. Exact name, nothing else. On a database that never had the row (production,
-- a rebuild from zero) it deletes nothing, so it is safe to re-run anywhere.

delete from schema_migrations
 where filename = '0201_map_rooms_drop_map_id_shape.sql';
