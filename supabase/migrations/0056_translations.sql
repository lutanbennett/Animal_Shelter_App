-- Free text across languages (backlog, Quick wins: "Strategy for free-text
-- fields across languages"). See docs/decisions.md, 2026-09-21.
--
-- The UI is bilingual but staff-typed prose shows in whatever language it
-- was typed. This is the plumbing that gives every public-facing prose
-- field a translation in the other language, tracked well enough that a
-- manager can keep it right:
--
--  - `translatable_fields` names the (table, column) pairs that get one.
--    Today that is the three resident profile fields on /adopt and the
--    project story / photo captions on /our-work — the text a reader who
--    isn't its author sees. Internal notes (weight, vet visit,
--    prescription, intake) are deliberately not listed: nobody is going to
--    translate those by hand, and the queue would drown in them. They join
--    when the machine-translation phase lands (backlog).
--  - `translations` holds one row per translatable field per record: the
--    text in the *other* language, its status, and a snapshot of the
--    source it was written against. Prose lives here rather than in paired
--    `_th` columns because the paired column can't say whether the English
--    changed after the Thai was written; the snapshot can. Short labels
--    (`residents.thai_name`, `project_folders.name_th`) are a different
--    thing — a second value, not a translation — and stay as columns.
--  - A trigger on each source table queues / re-queues the row whenever
--    the source text changes, so a manager's queue is a query, not a
--    hunt through records. The source language is detected from the
--    script of the text, so a bio typed in Thai gets an English slot and
--    nobody picks a language from a dropdown.
--  - Public views expose the approved translations as one jsonb column
--    (`{column: {lang, text}}`), and the pages pick by locale with a
--    fallback to the original — a story is never hidden for lacking a
--    translation (0042's rule, kept).
--
-- Existing `summary_th` and `caption_th` values (0034) move into the table
-- as approved rows and the columns are dropped, so there is one place
-- translated prose lives.

-- =========================================================================
-- 1. Which fields get a translation
-- =========================================================================

create table if not exists translatable_fields (
  table_name text not null,
  column_name text not null,
  -- 'public': shown on the website / to fosters, so a manager approves it.
  -- 'internal': staff-only notes; reserved for the machine phase.
  tier text not null check (tier in ('public', 'internal')),
  primary key (table_name, column_name)
);

insert into translatable_fields (table_name, column_name, tier) values
  ('residents', 'bio', 'public'),
  ('residents', 'temperament_notes', 'public'),
  ('residents', 'past_story_notes', 'public'),
  ('project_folders', 'summary', 'public'),
  ('attachments', 'caption', 'public')
on conflict do nothing;

alter table translatable_fields enable row level security;

drop policy if exists admin_all_translatable_fields on translatable_fields;
create policy admin_all_translatable_fields on translatable_fields
  for all using (current_user_role() = 'admin');
drop policy if exists authenticated_read_translatable_fields on translatable_fields;
create policy authenticated_read_translatable_fields on translatable_fields
  for select using (auth.uid() is not null);

-- =========================================================================
-- 2. The translations themselves
-- =========================================================================

do $$ begin
  create type translation_status as enum ('pending', 'draft', 'approved', 'stale');
exception when duplicate_object then null; end $$;

create table if not exists translations (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid not null,
  column_name text not null,
  -- The language the record's text is written in, and the one this row
  -- supplies. Two languages, so target is always "the other one".
  source_lang text not null check (source_lang in ('en', 'th')),
  target_lang text not null check (target_lang in ('en', 'th')),
  -- The source as it is now: kept in step by the trigger so the queue can
  -- show the original without joining three tables.
  source_text text not null,
  -- The source as it was when `text` was last written or approved. When
  -- the two differ the translation is stale and the queue can show what
  -- changed.
  reviewed_source_text text,
  text text,
  --  pending   no translation yet
  --  draft     text exists but no manager has approved it (a non-manager's
  --            translation today; the machine's later)
  --  approved  shown to the other-language audience
  --  stale     was draft/approved; the source has changed since
  status translation_status not null default 'pending',
  -- What wrote `text`: 'human' today, an engine name later.
  engine text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint translations_one_per_field unique (table_name, row_id, column_name),
  constraint translations_langs_differ check (source_lang <> target_lang),
  constraint translations_text_matches_status check (
    (status = 'pending' and text is null)
    or (status <> 'pending' and text is not null)
  ),
  constraint translations_field_known foreign key (table_name, column_name)
    references translatable_fields (table_name, column_name)
);

create index if not exists translations_status_idx on translations (status);
create index if not exists translations_row_idx on translations (table_name, row_id);

alter table translations enable row level security;

-- Every signed-in role can read (they can read the source records); the
-- writing is management's — the two bilingual managers own the queue. The
-- queueing trigger below is security definer, so a staff member saving a
-- bio still gets a pending row without needing write access here.
drop policy if exists admin_all_translations on translations;
create policy admin_all_translations on translations
  for all using (current_user_role() = 'admin');
drop policy if exists management_rw_translations on translations;
create policy management_rw_translations on translations
  for all
  using (current_user_role() = 'management')
  with check (current_user_role() = 'management');
drop policy if exists staff_read_translations on translations;
create policy staff_read_translations on translations
  for select using (current_user_role() = 'staff');
drop policy if exists vet_read_translations on translations;
create policy vet_read_translations on translations
  for select using (current_user_role() = 'vet');
drop policy if exists volunteer_read_translations on translations;
create policy volunteer_read_translations on translations
  for select using (current_user_role() = 'volunteer');

-- =========================================================================
-- 3. Language detection
--
-- Thai and English are the only two languages, and Thai has its own
-- Unicode block (U+0E00–U+0E7F), so "which language is this?" is a look
-- at the letters. A count alone misleads on mixed notes — a Thai sentence
-- carrying an English drug name ("ให้ amoxicillin 2ml ทุกวัน") has more
-- Latin letters than Thai ones — so: one script with an overwhelming
-- majority (three to one) decides; otherwise the language the text
-- *starts* in does, which is the language it was written in. Empty or
-- purely numeric text counts as English, the shelter's default.
-- =========================================================================

create or replace function detect_language(p_text text)
returns text
language sql
immutable
as $$
  with letters as (
    select
      length(regexp_replace(coalesce(p_text, ''), '[^\u0E00-\u0E7F]', '', 'g')) as thai,
      length(regexp_replace(coalesce(p_text, ''), '[^A-Za-z]', '', 'g')) as latin,
      substring(coalesce(p_text, '') from '[A-Za-z\u0E00-\u0E7F]') as first_letter
  )
  select case
    when thai > 3 * latin then 'th'
    when latin > 3 * thai then 'en'
    when first_letter ~ '[\u0E00-\u0E7F]' then 'th'
    else 'en'
  end
  from letters;
$$;

create or replace function other_language(p_lang text)
returns text
language sql
immutable
as $$
  select case when p_lang = 'th' then 'en' else 'th' end;
$$;

-- =========================================================================
-- 4. Queueing: keep `translations` in step with the source tables
--
-- One generic trigger function reads `translatable_fields` for the table
-- it fired on and compares each listed column between OLD and NEW. A
-- changed source:
--   - with no translation row yet → a pending row;
--   - with a row in the same direction → the row keeps its text but
--     becomes stale (the manager sees old vs new source and fixes it);
--   - with a row whose direction flipped (the bio was retyped in Thai) →
--     the old text is meaningless, back to pending;
--   - cleared to empty → the row goes away.
-- Security definer so it runs regardless of who edited the source.
-- =========================================================================

create or replace function queue_translations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_field record;
  v_new text;
  v_old text;
  v_lang text;
begin
  for v_field in
    select column_name from translatable_fields where table_name = tg_table_name
  loop
    v_new := nullif(btrim(to_jsonb(new) ->> v_field.column_name), '');
    v_old := case when tg_op = 'UPDATE'
                  then nullif(btrim(to_jsonb(old) ->> v_field.column_name), '')
                  else null end;

    if v_new is not distinct from v_old then
      continue;
    end if;

    if v_new is null then
      delete from translations
       where table_name = tg_table_name
         and row_id = new.id
         and column_name = v_field.column_name;
      continue;
    end if;

    v_lang := detect_language(v_new);

    insert into translations
      (table_name, row_id, column_name, source_lang, target_lang, source_text, status)
    values
      (tg_table_name, new.id, v_field.column_name, v_lang, other_language(v_lang), v_new, 'pending')
    on conflict (table_name, row_id, column_name) do update set
      source_text = excluded.source_text,
      source_lang = excluded.source_lang,
      target_lang = excluded.target_lang,
      text = case when translations.target_lang = excluded.target_lang
                  then translations.text else null end,
      status = case
        when translations.target_lang <> excluded.target_lang then 'pending'::translation_status
        when translations.text is null then 'pending'::translation_status
        else 'stale'::translation_status
      end,
      updated_at = now();
  end loop;

  return new;
end;
$$;

create or replace function drop_translations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from translations where table_name = tg_table_name and row_id = old.id;
  return old;
end;
$$;

drop trigger if exists residents_queue_translations on residents;
create trigger residents_queue_translations
  after insert or update on residents
  for each row execute function queue_translations();
drop trigger if exists residents_drop_translations on residents;
create trigger residents_drop_translations
  after delete on residents
  for each row execute function drop_translations();

drop trigger if exists project_folders_queue_translations on project_folders;
create trigger project_folders_queue_translations
  after insert or update on project_folders
  for each row execute function queue_translations();
drop trigger if exists project_folders_drop_translations on project_folders;
create trigger project_folders_drop_translations
  after delete on project_folders
  for each row execute function drop_translations();

-- Only project photos carry captions (0034); other attachment rows never
-- set the column, so the trigger only has work to do for those.
drop trigger if exists attachments_queue_translations on attachments;
create trigger attachments_queue_translations
  after insert or update on attachments
  for each row when (new.owner_type = 'project') execute function queue_translations();
drop trigger if exists attachments_drop_translations on attachments;
create trigger attachments_drop_translations
  after delete on attachments
  for each row when (old.owner_type = 'project') execute function drop_translations();

-- =========================================================================
-- 5. Move summary_th / caption_th into the table, then drop the columns
--
-- Existing Thai text was written by staff and has been live on /our-work,
-- so it goes in as approved against the current source. A Thai value with
-- no English source has nothing to be a translation of and is left behind
-- (there is nowhere it could have been displayed anyway). Guarded so the
-- file re-runs after the columns are gone.
-- =========================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'project_folders' and column_name = 'summary_th'
  ) then
    insert into translations
      (table_name, row_id, column_name, source_lang, target_lang,
       source_text, reviewed_source_text, text, status, engine, reviewed_at)
    select 'project_folders', f.id, 'summary',
           detect_language(f.summary), other_language(detect_language(f.summary)),
           btrim(f.summary), btrim(f.summary), btrim(f.summary_th), 'approved', 'human', now()
      from project_folders f
     where nullif(btrim(f.summary), '') is not null
       and nullif(btrim(f.summary_th), '') is not null
       and detect_language(f.summary) <> detect_language(f.summary_th)
    on conflict (table_name, row_id, column_name) do update set
      reviewed_source_text = excluded.reviewed_source_text,
      text = excluded.text,
      status = 'approved',
      engine = 'human',
      reviewed_at = now(),
      updated_at = now();
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'attachments' and column_name = 'caption_th'
  ) then
    insert into translations
      (table_name, row_id, column_name, source_lang, target_lang,
       source_text, reviewed_source_text, text, status, engine, reviewed_at)
    select 'attachments', a.id, 'caption',
           detect_language(a.caption), other_language(detect_language(a.caption)),
           btrim(a.caption), btrim(a.caption), btrim(a.caption_th), 'approved', 'human', now()
      from attachments a
     where a.owner_type = 'project'
       and nullif(btrim(a.caption), '') is not null
       and nullif(btrim(a.caption_th), '') is not null
       and detect_language(a.caption) <> detect_language(a.caption_th)
    on conflict (table_name, row_id, column_name) do update set
      reviewed_source_text = excluded.reviewed_source_text,
      text = excluded.text,
      status = 'approved',
      engine = 'human',
      reviewed_at = now(),
      updated_at = now();
  end if;
end $$;

-- The three views that select the columns have to be rebuilt without them
-- before the columns can go (create or replace can't drop a view column).

drop view if exists public_projects;
drop view if exists public_project_photos;
drop view if exists project_folder_summary;

alter table project_folders drop column if exists summary_th;
alter table attachments drop column if exists caption_th;

-- =========================================================================
-- 6. Approved translations on the public views
--
-- `{column: {lang, text}}` for each approved row of the record, or null.
-- A page reads the original unless the visitor's locale matches
-- `lang` and there is text — see localized() in src/lib/translations.
-- =========================================================================

create or replace function approved_translations(p_table text, p_row uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_object_agg(
           t.column_name,
           jsonb_build_object('lang', t.target_lang, 'text', t.text)
         )
    from translations t
   where t.table_name = p_table
     and t.row_id = p_row
     and t.status = 'approved';
$$;

-- Same column list as 0051's definition plus `translations` on the end.
create or replace view public_resident_profiles as
select
  r.id,
  r.name,
  r.species,
  r.breed,
  r.sex,
  r.ready_for_adoption,
  r.bio,
  r.temperament_notes,
  r.past_story_notes,
  r.profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on,
  r.size,
  approved_translations('residents', r.id) as translations
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

-- 0034's definition minus summary_th.
create or replace view project_folder_summary
with (security_invoker = on)
as
select
  f.id,
  f.parent_folder_id,
  f.top_level_category,
  f.name,
  f.name_th,
  f.summary,
  f.project_date,
  f.location,
  f.is_public,
  f.cover_attachment_id,
  f.drive_folder_id,
  f.created_at,
  f.updated_at,
  (select count(*) from project_folders c where c.parent_folder_id = f.id)::int as child_count,
  (select count(*) from attachments a where a.owner_type = 'project' and a.owner_id = f.id)::int as photo_count,
  coalesce(
    (select a.drive_file_id from attachments a where a.id = f.cover_attachment_id),
    (select a.drive_file_id from attachments a
       where a.owner_type = 'project' and a.owner_id = f.id
       order by a.sort_order nulls last, a.uploaded_at desc
       limit 1)
  ) as thumbnail_drive_file_id
from project_folders f;

-- 0042's definitions: summary_th / caption_th → translations.
create or replace view public_projects as
select
  f.id,
  f.top_level_category as category,
  f.name as title,
  f.name_th as title_th,
  f.summary,
  f.project_date,
  f.location,
  coalesce(f.project_date, f.created_at::date) as sort_date,
  coalesce(
    (select a.drive_file_id from attachments a where a.id = f.cover_attachment_id),
    (select a.drive_file_id from attachments a
       where a.owner_type = 'project' and a.owner_id = f.id
       order by a.sort_order nulls last, a.uploaded_at asc
       limit 1)
  ) as cover_drive_file_id,
  (select count(*) from attachments a
     where a.owner_type = 'project' and a.owner_id = f.id)::int as photo_count,
  approved_translations('project_folders', f.id) as translations
from project_folders f
where f.is_public = true
  and f.parent_folder_id is not null;

create or replace view public_project_photos as
select
  a.id,
  a.owner_id as project_id,
  a.drive_file_id,
  a.caption,
  a.sort_order,
  a.date_taken,
  a.uploaded_at,
  approved_translations('attachments', a.id) as translations
from attachments a
join project_folders f on f.id = a.owner_id
where a.owner_type = 'project'
  and f.is_public = true
  and f.parent_folder_id is not null;

grant select on public_projects, public_project_photos, public_resident_profiles
  to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_projects, public_project_photos, public_resident_profiles
  from anon, authenticated;

-- =========================================================================
-- 7. Backfill: a pending row for every existing source with no translation
-- =========================================================================

insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text)
select 'residents', r.id, f.column_name,
       detect_language(v.txt), other_language(detect_language(v.txt)), btrim(v.txt)
  from residents r
  join translatable_fields f on f.table_name = 'residents'
  cross join lateral (select to_jsonb(r) ->> f.column_name as txt) v
 where nullif(btrim(v.txt), '') is not null
on conflict (table_name, row_id, column_name) do nothing;

insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text)
select 'project_folders', p.id, 'summary',
       detect_language(p.summary), other_language(detect_language(p.summary)), btrim(p.summary)
  from project_folders p
 where nullif(btrim(p.summary), '') is not null
on conflict (table_name, row_id, column_name) do nothing;

insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text)
select 'attachments', a.id, 'caption',
       detect_language(a.caption), other_language(detect_language(a.caption)), btrim(a.caption)
  from attachments a
 where a.owner_type = 'project'
   and nullif(btrim(a.caption), '') is not null
on conflict (table_name, row_id, column_name) do nothing;

-- =========================================================================
-- 8. The manager's queue
--
-- Every translation row with the tier it belongs to and enough about the
-- record to label and link it. Ordinary view (owned by the migration
-- role, so it reads the source tables regardless of the reader's RLS —
-- the labels are names every signed-in role can see anyway), granted to
-- signed-in users only.
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
  end as record_label,
  case t.table_name
    when 'residents' then '/residents/' || t.row_id
    when 'project_folders' then '/projects/' || t.row_id
    when 'attachments' then
      (select '/projects/' || a.owner_id from attachments a where a.id = t.row_id)
  end as record_path
from translations t
join translatable_fields f
  on f.table_name = t.table_name and f.column_name = t.column_name;

grant select on translation_queue to authenticated;
revoke all on translation_queue from anon;
revoke insert, update, delete, truncate, references, trigger
  on translation_queue from authenticated;

notify pgrst, 'reload schema';
