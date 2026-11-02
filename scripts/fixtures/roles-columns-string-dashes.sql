-- A fixture, not a migration: scripts/check-roles-columns.mjs must see the column added AFTER a `--` that sits inside a string.
-- The old reader (s.replace(/--[^\n]*/g, "")) cut the line at the `--` in the string, so `legacy_flag` was never seen.
-- Used by scripts/check-roles-columns.test.mjs, which copies it in as a migration.
create table roles (id uuid primary key, key text not null);
insert into roles (id, key) values (gen_random_uuid(), 'a -- b'); alter table roles add column legacy_flag boolean;
