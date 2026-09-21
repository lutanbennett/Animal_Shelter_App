-- Maintenance jobs join the translations (0056).
--
-- A job's title and description are instructions to whoever does the
-- work — mostly Thai-speaking staff, written mostly in English by
-- management — so of all the internal text they are the ones that must
-- read in the reader's language. They go through the same table, queue
-- and panel as the public fields: a manager writes the Thai (or English)
-- version and approves it; the board and the job page show it to a
-- reader of that language; an edit to the original re-queues it.
--
-- 0056 named the tiers 'public' / 'internal' after the audience, which
-- stops fitting the moment an internal field is manager-reviewed. The
-- tier is really the review path, so it is renamed to say that:
--   reviewed — a manager writes or approves the text before it is shown
--   machine  — filled by a model and shown labelled, no review (reserved
--              for the machine phase; nothing uses it yet)

-- =========================================================================
-- 1. Tier means review path
-- =========================================================================

alter table translatable_fields drop constraint if exists translatable_fields_tier_check;
update translatable_fields set tier = 'reviewed' where tier = 'public';
update translatable_fields set tier = 'machine' where tier = 'internal';
alter table translatable_fields
  add constraint translatable_fields_tier_check check (tier in ('reviewed', 'machine'));

-- =========================================================================
-- 2. Maintenance title and description
--
-- The title is also the Drive folder name (0033), which keeps the English
-- as written — the translation is only what a reader sees in the app.
-- =========================================================================

insert into translatable_fields (table_name, column_name, tier) values
  ('maintenance', 'title', 'reviewed'),
  ('maintenance', 'description', 'reviewed')
on conflict do nothing;

drop trigger if exists maintenance_queue_translations on maintenance;
create trigger maintenance_queue_translations
  after insert or update on maintenance
  for each row execute function queue_translations();
drop trigger if exists maintenance_drop_translations on maintenance;
create trigger maintenance_drop_translations
  after delete on maintenance
  for each row execute function drop_translations();

-- Backfill: a pending row for every existing job's title and description.
insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text)
select 'maintenance', m.id, f.column_name,
       detect_language(v.txt), other_language(detect_language(v.txt)), btrim(v.txt)
  from maintenance m
  join translatable_fields f on f.table_name = 'maintenance'
  cross join lateral (select to_jsonb(m) ->> f.column_name as txt) v
 where nullif(btrim(v.txt), '') is not null
on conflict (table_name, row_id, column_name) do nothing;

-- =========================================================================
-- 3. The queue view labels and links a job
-- =========================================================================

create or replace view translation_queue as
select
  t.id,
  t.table_name,
  t.row_id,
  t.column_name,
  f.tier,
  t.source_lang,
  t.target_lang,
  t.source_text,
  t.reviewed_source_text,
  t.text,
  t.status,
  t.engine,
  t.reviewed_by,
  t.reviewed_at,
  t.created_at,
  t.updated_at,
  case t.table_name
    when 'residents' then
      (select r.name || coalesce(' (' || r.resident_code || ')', '') from residents r where r.id = t.row_id)
    when 'project_folders' then
      (select p.name from project_folders p where p.id = t.row_id)
    when 'attachments' then
      (select p.name || ' — ' || coalesce(a.file_name, a.drive_file_id)
         from attachments a join project_folders p on p.id = a.owner_id
        where a.id = t.row_id)
    when 'maintenance' then
      (select coalesce(m.job_code || ' · ', '') || m.title from maintenance m where m.id = t.row_id)
  end as record_label,
  case t.table_name
    when 'residents' then '/residents/' || t.row_id
    when 'project_folders' then '/projects/' || t.row_id
    when 'attachments' then
      (select '/projects/' || a.owner_id from attachments a where a.id = t.row_id)
    when 'maintenance' then '/maintenance/' || t.row_id
  end as record_path
from translations t
join translatable_fields f
  on f.table_name = t.table_name and f.column_name = t.column_name;

grant select on translation_queue to authenticated;
revoke all on translation_queue from anon;
revoke insert, update, delete, truncate, references, trigger
  on translation_queue from authenticated;

notify pgrst, 'reload schema';
