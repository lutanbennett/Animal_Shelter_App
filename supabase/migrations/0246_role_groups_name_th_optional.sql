-- consumer: src/app/admin/who-does-what/actions.ts, src/app/admin/who-does-what/page.tsx, src/lib/home/roles.ts
-- 0246: role_groups.name_th is optional (Lutan, 2026-10-21). A group needs only an English name; with no Thai
-- name the app shows the English one in Thai until one is added (the app half's job, not this file's).
-- Only the NOT NULL goes. The check (btrim(name_th) <> '') stays: NULL passes a check, so "no Thai name" is
-- stored as NULL, and an empty or blank string is still refused. Existing rows all have a Thai name.
-- Re-runnable: DROP NOT NULL on a nullable column is a no-op.
alter table role_groups alter column name_th drop not null;
comment on column role_groups.name_th is
  'Thai name of the group; NULL means none yet, and readers show name instead (0246).';
