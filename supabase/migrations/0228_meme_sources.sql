-- consumer: none
--
-- SCHEMA half of the meme-maker widening ("memes from any photo, not only residents'"). NOTHING IN src/ READS THESE
-- COLUMNS YET. When this merges nothing looks different to anyone: no source tabs, no Make a meme button outside the
-- resident lightbox, no filter, no Memes list on an outing, job or project. That is the app half, a later stream.
-- See docs/decisions/2026-10-19-meme-sources-columns.md.
--
-- SHAPE: nullable columns on memes, not a meme_links table. A meme is made from ONE photo, once, and that never
-- changes, so there is nothing for a join table to hold but one row per meme. Real foreign keys give integrity a
-- polymorphic link table cannot (it would need guard triggers, as social_shares has). "All memes made from outreach"
-- is a single indexed predicate on source_kind.
--
--   source_kind        resident | outing | maintenance | project | website | upload; null = filed before this existed,
--                      or made elsewhere and filed by hand
--   outing_id          the outreach note (community_dog_outings) the photo was on
--   maintenance_id     the maintenance job
--   project_id         the project folder
--   source_photo_ref   the original photo's Drive file id (website / upload / any source), for "made from" display
--
-- A deleted outing, job or project clears the link (on delete set null); the meme stays, still marked by kind.
-- Medical photos are not a source: nothing here references attachments or medical records.
-- RLS is unchanged: the existing memes policies cover new columns. Never public.
--
-- Additive and re-runnable. To undo, in a new file: drop the constraint, the three indexes and the five columns.

alter table memes add column if not exists source_kind text;
alter table memes add column if not exists outing_id uuid references community_dog_outings (id) on delete set null;
alter table memes add column if not exists maintenance_id uuid references maintenance (id) on delete set null;
alter table memes add column if not exists project_id uuid references project_folders (id) on delete set null;
alter table memes add column if not exists source_photo_ref text;

alter table memes drop constraint if exists memes_source_check;
alter table memes add constraint memes_source_check check (
  (source_kind is null or source_kind in ('resident', 'outing', 'maintenance', 'project', 'website', 'upload'))
  and (outing_id is null or source_kind = 'outing')
  and (maintenance_id is null or source_kind = 'maintenance')
  and (project_id is null or source_kind = 'project')
  and (source_photo_ref is null or btrim(source_photo_ref) <> '')
);

create index if not exists memes_source_kind_idx on memes (source_kind) where source_kind is not null;
create index if not exists memes_outing_idx on memes (outing_id) where outing_id is not null;
create index if not exists memes_maintenance_idx on memes (maintenance_id) where maintenance_id is not null;
create index if not exists memes_project_idx on memes (project_id) where project_id is not null;

comment on column memes.source_kind is 'Where the photo came from (0228): resident, outing, maintenance, project, website or upload. Null = unrecorded.';
comment on column memes.source_photo_ref is 'Drive file id of the original photo (0228). The original is never changed.';
