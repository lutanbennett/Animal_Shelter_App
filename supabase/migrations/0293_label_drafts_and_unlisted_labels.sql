-- consumer: src/lib/translations/labels.ts
--
-- THAI LABELS (schema half): register the eleven labels Management -> Translations could not see, and give a label a
-- draft that waits for approval instead of going live the instant it is typed.
-- docs/decisions/2026-10-31-label-drafts-and-unlisted-labels.md is the paper for this file. The app half is a separate
-- stream and no src/ file is touched here.
--
-- WHY, part one. Registering a label in translatable_labels (0166) is a hand step, and since 0166 it has been missed
-- eleven times. The 2026-10-31 sweep measured twelve _th columns on base tables with no row in the registry, on dev and
-- on production alike, so nobody could translate any of them from the one screen that exists for translating. Eleven of
-- the twelve are a manager's wording and are registered below. rounds.name_th is the twelfth and STAYS OUT: 0166 says so
-- in its own comment, a fixed seeded vocabulary whose Thai ships with it.
--
-- WHY, part two. Lutan's rule for translation work is that fixes go in as drafts for a bilingual manager to approve,
-- never as approved. Prose can do that: pending / draft / approved / stale, and the public sees the English until
-- someone presses Save and approve. A LABEL could not. label_translations() knows only missing / as_typed / stale /
-- current and set_label_th() writes the Thai STRAIGHT ONTO THE ROW, where every screen reads it at once. So the
-- 2026-10-31 sweep, holding proposed Thai for 72 real labels, had two options: publish unchecked Thai to the live app,
-- or put it in a document and leave the screen empty. It chose the document. Asked plainly on 2026-10-31 whether a
-- proposed short label should be able to sit on the screen marked as waiting rather than going live at once, Lutan
-- answered yes.
--
-- A TABLE, NOT A STATUS COLUMN, and this is the decision the app half is built on. The paired _th column IS the live
-- value: dozens of views, the public website and every screen read it directly. A status column saying "the Thai is in
-- its column but do not show it yet" would have to be honoured by every one of those readers, which is a flag day
-- across the whole app and fails open the moment one reader forgets. A proposal therefore cannot live on the row at
-- all. label_drafts holds it beside the row, the row is untouched until approval, and NOTHING that reads a _th column
-- changes or needs to know this table exists.
--
--   propose_label_th(table, row_id, column, text) -> boolean   writes or replaces the draft. NEVER touches the row.
--   approve_label_th(table, row_id, column)       -> boolean   publishes the draft onto the row, then clears it.
--   discard_label_draft(table, row_id, column)    -> boolean   throws the proposal away. The row is untouched.
--
-- Only approve_label_th() and 0166's set_label_th() reach the row, so set_label_th() is no longer the only way Thai is
-- published and the proposing path cannot publish at all. set_label_th() itself is unchanged: an approver typing Thai
-- and saving should still publish at once.
--
-- THE ACCESS RULE IS A CARD, and today it is the same card for both paths. Every function below is gated on
-- translations.view / translations.manage exactly as 0166's are. Proposing plausibly deserves a grant of its own -- a
-- session or the machine-translation worker proposes, a person approves -- and the decision file argues that it does and
-- names it (translations.propose). It is NOT created here, because an activity must exist in BOTH
-- src/lib/permissions/catalogue.ts and permission_activities or npm run lint fails, the catalogue is an src/ file this
-- stream must not touch, and an activity with no card to carry it would be a card that does nothing, which the rule
-- forbids. Until it exists, gating on it would make the proposing path dead for everyone but Admin. So: the same card,
-- said out loud, with the swap written down as the app half's first job. No role key, no role name and no role column
-- decides anything in this file.
--
-- Additive and re-runnable throughout (if not exists / or replace / drop if exists). The one existing object that
-- changes behaviour is label_translations(), which gains four draft columns and one new status value, proposed. It is
-- dropped and recreated because a function that returns a table cannot have columns added by or replace.
--
-- The comment strings below carry no semicolon and no double dash. scripts/check-migration-grants.mjs splits a file on
-- semicolons and strips double-dash comments without tracking string literals, so either one inside a literal silently
-- swallows the next statement and its revoke is read as missing. 0292 does the same for the same reason, and fixing the
-- script is a filed backlog item rather than this file's business.

-- ===================================================================================================================
-- 1. Two new groups the screen can file a label under
-- ===================================================================================================================
-- home   features.name and role_groups.name: the names of the sections and doorway tiles on a role's home screen.
--        The backlog item asked for a group of their own and that is right, because neither belongs to the website,
--        a setup list or the roles themselves.
-- social memes.caption_en: wording that goes out on social media, which has no home among 0166's groups.
--
-- The allow-list repeats 0166's nine groups and 0209's residents, because a check constraint is an allow-list and not
-- a diff. Leaving residents out was caught by the dry-run against real rows, which refused the constraint rather than
-- letting it be added unvalidated. The group list and GROUP_ORDER in src/lib/translations/labels.ts are two copies of
-- the same idea and nothing holds them in step: that file widens on its own, so an unknown group sorts last with a raw
-- heading rather than disappearing, which is why the app half can add the headings afterwards.
--
-- Dropped by definition rather than by name, so the file is re-runnable whatever the constraint ended up called.
do $$
declare
  c text;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.translatable_labels'::regclass
              and contype = 'c'
              and pg_get_constraintdef(oid) like '%label_group%'
  loop
    execute format('alter table translatable_labels drop constraint %I', c);
  end loop;
end;
$$;

alter table translatable_labels add constraint translatable_labels_label_group_check
  check (label_group in ('website', 'projects', 'places', 'diets', 'medications', 'units',
                         'setup_lists', 'money', 'roles', 'residents', 'home', 'social'));

-- ===================================================================================================================
-- 2. The eleven labels nobody could translate
-- ===================================================================================================================
-- optional = true means an empty Thai is a deliberate answer ("shown as typed"), not a gap.
--
--   site_content.contact_address      the shelter's address on the Contact page
--   site_content.registration_text    the charity registration line in the footer
--   site_content.*_photo_alt          the four page photos' descriptions, beside hero_alt which 0166 registered
--   diets.name                        a recipe's name (0239), beside diet_types.name which is an ingredient
--   units.name                        a unit of measure (0252). The seed shipped Thai for all of them, so this
--                                     mostly guards the ones added since
--   features.name                     a section of the system (0255), seeded from docs/features.md
--   role_groups.name                  a doorway tile on a role's home (0241)
--   memes.caption_en                  a meme's caption (0223). The English column is caption_en, not caption: the
--                                     backlog item's "memes.caption" is the pair, and the registry stores both
--                                     column names so the real one is used
--
-- Why memes is the only optional one of the eleven: a meme is an image that usually carries its own words, so a
-- caption deliberately left in English is a normal answer and should not be counted as missing. Every other one is
-- wording a Thai reader is shown and must have.
--
-- role_groups.name_th is NOT NULL with a non-blank check (0241), so this pair can never read missing or as_typed. It
-- is registered anyway, and the reason is worth stating: what it gains is stale. Rename the group in English and the
-- Thai beside it silently stops matching, and today nothing notices.
insert into translatable_labels (table_name, column_name, th_column, label_group, optional) values
  ('site_content', 'contact_address', 'contact_address_th', 'website', false),
  ('site_content', 'registration_text', 'registration_text_th', 'website', false),
  ('site_content', 'about_photo_alt', 'about_photo_alt_th', 'website', false),
  ('site_content', 'donate_photo_alt', 'donate_photo_alt_th', 'website', false),
  ('site_content', 'foster_photo_alt', 'foster_photo_alt_th', 'website', false),
  ('site_content', 'volunteer_photo_alt', 'volunteer_photo_alt_th', 'website', false),
  ('diets', 'name', 'name_th', 'diets', false),
  ('units', 'name', 'name_th', 'units', false),
  ('features', 'name', 'name_th', 'home', false),
  ('role_groups', 'name', 'name_th', 'home', false),
  ('memes', 'caption_en', 'caption_th', 'social', true)
on conflict (table_name, column_name) do update
  set th_column = excluded.th_column, label_group = excluded.label_group, optional = excluded.optional;

-- ===================================================================================================================
-- 3. The proposal, beside the row rather than on it
-- ===================================================================================================================
-- One draft per label at a time: a second proposal for the same label replaces the first, because "proposed, waiting"
-- is one state and a queue of competing proposals is not what anyone asked for. row_id is text for the same reason as
-- label_sources: site_content's id is a boolean, every other registered table's is a uuid.
--
-- source_text is the English the proposal was written against, so a draft can itself be seen to have gone out of date
-- while it waited. It is compared with the English now, exactly as label_sources is for a published label.
create table if not exists label_drafts (
  table_name  text not null,
  row_id      text not null,
  column_name text not null,
  text_th     text not null check (btrim(text_th) <> ''),
  source_text text,
  proposed_by uuid references auth.users (id) on delete set null,
  proposed_at timestamptz not null default now(),
  primary key (table_name, row_id, column_name),
  constraint label_drafts_label_known foreign key (table_name, column_name)
    references translatable_labels (table_name, column_name) on delete cascade
);

comment on table label_drafts is
  'A proposed Thai label waiting for a person to approve it (0293). The row''s own _th column is the LIVE value and is untouched until approval, so nothing that reads a _th column has to know this table exists. One draft per label: a new proposal replaces the previous one. Written only through propose_label_th, approve_label_th and discard_label_draft.';
comment on column label_drafts.text_th is 'The proposed Thai. Never blank: proposing an empty string discards the draft instead.';
comment on column label_drafts.source_text is 'The English this proposal was written against, so a draft that waited while the English changed can be seen to have gone out of date.';
comment on column label_drafts.proposed_by is 'The login that proposed it, or null if that login has since been deleted. Recorded so the screen can say who is waiting on whom.';

create index if not exists label_drafts_proposed_at_idx on label_drafts (proposed_at);

alter table label_drafts enable row level security;

drop policy if exists label_drafts_select_perm on label_drafts;
create policy label_drafts_select_perm on label_drafts for select to authenticated
  using ((select has_permission('translations.view')) or (select has_permission('translations.manage', 'read')));

revoke all on label_drafts from anon, authenticated, service_role;
grant select on label_drafts to authenticated, service_role;

-- ===================================================================================================================
-- 4. Triggers and a back-fill for the newly registered tables
-- ===================================================================================================================
-- record_label_sources() (0166) is generic: it reads translatable_labels for the table it fires on, so a newly
-- registered table needs nothing but the trigger. Extended here in one way: it now also clears a draft that has been
-- published, by whatever path, and a draft left behind by a deleted row. Without that, approving through the Diets
-- screen rather than through Translations would leave a proposal sitting on screen for Thai that is already live.
-- Still a trigger function, still security definer, and it still writes nothing but label_sources and label_drafts.
create or replace function record_label_sources()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  v_new jsonb;
  v_old jsonb;
  v_row text;
  v_th text;
begin
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old) ->> 'id';
    delete from label_sources where table_name = tg_table_name and row_id = v_row;
    delete from label_drafts  where table_name = tg_table_name and row_id = v_row;
    return old;
  end if;

  v_new := to_jsonb(new);
  v_old := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  v_row := v_new ->> 'id';

  for l in select column_name, th_column from translatable_labels where table_name = tg_table_name loop
    v_th := nullif(btrim(v_new ->> l.th_column), '');
    if v_th is null then
      delete from label_sources
       where table_name = tg_table_name and row_id = v_row and column_name = l.column_name;
    elsif tg_op = 'INSERT'
       or v_th is distinct from nullif(btrim(v_old ->> l.th_column), '')
       or not exists (select 1 from label_sources s
                       where s.table_name = tg_table_name and s.row_id = v_row
                         and s.column_name = l.column_name) then
      insert into label_sources (table_name, row_id, column_name, source_text, recorded_at)
      values (tg_table_name, v_row, l.column_name, v_new ->> l.column_name, now())
      on conflict (table_name, row_id, column_name)
        do update set source_text = excluded.source_text, recorded_at = excluded.recorded_at;
    end if;

    -- The live Thai now says what a draft proposed, so the proposal has been granted and is spent.
    if v_th is not null then
      delete from label_drafts
       where table_name = tg_table_name and row_id = v_row
         and column_name = l.column_name and btrim(text_th) = v_th;
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function record_label_sources() from public, anon, authenticated;

-- One trigger per registered table and a snapshot of what is already there, as 0166 did. Both loops run over the whole
-- registry rather than over the eleven new rows, because drop-if-exists-then-create is idempotent and a loop that
-- covers everything cannot leave a table behind the way a hand-written list has eleven times.
do $$
declare
  t text;
  l record;
begin
  for t in select distinct table_name from translatable_labels loop
    execute format('drop trigger if exists %I on %I', t || '_label_sources', t);
    execute format(
      'create trigger %I after insert or update or delete on %I for each row execute function record_label_sources()',
      t || '_label_sources', t);
  end loop;

  for l in select table_name, column_name, th_column from translatable_labels loop
    execute format(
      'insert into label_sources (table_name, row_id, column_name, source_text)
       select %L, x.id::text, %L, x.%I from %I x where nullif(btrim(x.%I), '''') is not null
       on conflict (table_name, row_id, column_name) do nothing',
      l.table_name, l.column_name, l.column_name, l.table_name, l.th_column);
  end loop;
end;
$$;

-- ===================================================================================================================
-- 5. Proposing, approving and discarding
-- ===================================================================================================================
-- propose_label_th: writes the draft and NOTHING ELSE. The row is not read for update, not locked and not written, so
-- there is no path by which proposing can publish. An empty text discards the draft, which is how the screen's Clear
-- works on a proposal. Returns false when the row does not exist, as set_label_th() does.
create or replace function propose_label_th(p_table text, p_row_id text, p_column text, p_text text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_th_column text;
  v_text text;
  v_english text;
begin
  -- The proposing grant. Today the same card as approving, deliberately and temporarily: see the header.
  if not (select has_permission('translations.manage')) then
    raise exception 'translations.manage is required to propose a Thai label' using errcode = '42501';
  end if;

  select l.th_column into v_th_column
    from translatable_labels l
   where l.table_name = p_table and l.column_name = p_column;
  if v_th_column is null then
    raise exception 'not a translatable label: %.%', p_table, p_column using errcode = '22023';
  end if;

  v_text := nullif(btrim(p_text), '');
  if v_text is null then
    delete from label_drafts
     where table_name = p_table and row_id = p_row_id and column_name = p_column;
    return true;
  end if;

  execute format('select x.%I::text from %I x where x.id::text = $1', p_column, p_table)
    into v_english using p_row_id;
  if not found then
    return false;
  end if;

  insert into label_drafts (table_name, row_id, column_name, text_th, source_text, proposed_by, proposed_at)
  values (p_table, p_row_id, p_column, v_text, v_english, (select auth.uid()), now())
  on conflict (table_name, row_id, column_name) do update
    set text_th = excluded.text_th,
        source_text = excluded.source_text,
        proposed_by = excluded.proposed_by,
        proposed_at = excluded.proposed_at;
  return true;
end;
$$;

comment on function propose_label_th(text, text, text, text) is
  'Proposes a Thai label and leaves it waiting (0293). Writes label_drafts only, so the row''s live Thai is untouched and nothing the app shows changes. An empty text discards the draft. For translations.manage today, which is also the approving grant: splitting them needs an activity that does not exist yet and the decision file names it.';
revoke all on function propose_label_th(text, text, text, text) from public, anon;
grant execute on function propose_label_th(text, text, text, text) to authenticated, service_role;

-- approve_label_th: the ONLY new way Thai reaches the row, and it publishes what a person is looking at rather than
-- what the caller sends. The text comes from the draft, never from an argument, so an approval cannot quietly publish
-- something other than the proposal that was reviewed. Raises when there is no draft: approving nothing is a caller
-- fault, not a no-op. The update fires the row's own audit and label_sources triggers like any other, and that trigger
-- clears the draft, so the delete below is belt and braces rather than the mechanism.
create or replace function approve_label_th(p_table text, p_row_id text, p_column text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_th_column text;
  v_text text;
  v_count integer;
begin
  if not (select has_permission('translations.manage')) then
    raise exception 'translations.manage is required to approve a Thai label' using errcode = '42501';
  end if;

  select l.th_column into v_th_column
    from translatable_labels l
   where l.table_name = p_table and l.column_name = p_column;
  if v_th_column is null then
    raise exception 'not a translatable label: %.%', p_table, p_column using errcode = '22023';
  end if;

  select d.text_th into v_text
    from label_drafts d
   where d.table_name = p_table and d.row_id = p_row_id and d.column_name = p_column;
  if v_text is null then
    raise exception 'no proposed Thai is waiting for %.% on row %', p_table, p_column, p_row_id
      using errcode = '22023';
  end if;

  execute format('update %I set %I = $1 where id::text = $2', p_table, v_th_column)
    using v_text, p_row_id;
  get diagnostics v_count = row_count;

  delete from label_drafts
   where table_name = p_table and row_id = p_row_id and column_name = p_column;
  return v_count > 0;
end;
$$;

comment on function approve_label_th(text, text, text) is
  'Publishes the proposed Thai onto the row and clears the draft (0293). The text comes from label_drafts, never from an argument, so what is published is what was reviewed. For translations.manage, as set_label_th is.';
revoke all on function approve_label_th(text, text, text) from public, anon;
grant execute on function approve_label_th(text, text, text) to authenticated, service_role;

-- discard_label_draft: throws a proposal away without touching the row. Returns false when there was nothing waiting,
-- so the screen can tell "rejected" from "somebody else got there first".
create or replace function discard_label_draft(p_table text, p_row_id text, p_column text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not (select has_permission('translations.manage')) then
    raise exception 'translations.manage is required to discard a proposed Thai label' using errcode = '42501';
  end if;

  delete from label_drafts
   where table_name = p_table and row_id = p_row_id and column_name = p_column;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

comment on function discard_label_draft(text, text, text) is
  'Throws away a proposed Thai label (0293). The row is untouched. False means there was nothing waiting. For translations.manage, the same grant as approving, because rejecting a proposal is the reviewer''s act.';
revoke all on function discard_label_draft(text, text, text) from public, anon;
grant execute on function discard_label_draft(text, text, text) to authenticated, service_role;

-- ===================================================================================================================
-- 6. label_translations() can now say "proposed, waiting"
-- ===================================================================================================================
-- Same function as 0166's with one new status value and four new columns. Dropped first because a function returning a
-- table cannot gain columns through or replace.
--
--   proposed  no live Thai, and a draft is waiting. It replaces what would otherwise read missing or as_typed, so the
--             screen's missing count stops claiming nobody has written anything when somebody has.
--   missing / as_typed / stale / current  exactly as before.
--
-- A label that already HAS Thai and also has a proposed change keeps its stale or current status -- the live value is
-- what those words describe -- and carries the proposal in the draft columns. That way the missing and out-of-date
-- counts stay true to what a reader of the app sees, and the screen can still show a pending proposal on any row.
--
-- draft_source_text is the English the proposal was written against: compare it with source_text, the same comparison
-- this function already makes for a published label, to see that a draft went out of date while it waited.
drop function if exists label_translations();

create or replace function label_translations()
returns table (
  table_name text,
  row_id text,
  column_name text,
  th_column text,
  label_group text,
  optional boolean,
  source_text text,
  text_th text,
  seen_source_text text,
  status text,
  draft_text_th text,
  draft_source_text text,
  draft_proposed_at timestamptz,
  draft_proposed_by uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  l record;
begin
  if not ((select has_permission('translations.view')) or (select has_permission('translations.manage', 'read'))) then
    return;
  end if;

  for l in select * from translatable_labels order by translatable_labels.label_group,
                                                   translatable_labels.table_name loop
    return query execute format(
      'select %L::text, x.id::text, %L::text, %L::text, %L::text, %L::boolean,
              x.%I::text, nullif(btrim(x.%I), '''')::text, s.source_text,
              case
                when nullif(btrim(x.%I), '''') is null then
                  case when d.text_th is not null then ''proposed''
                       when %L::boolean then ''as_typed''
                       else ''missing'' end
                when s.source_text is distinct from x.%I then ''stale''
                else ''current''
              end,
              d.text_th, d.source_text, d.proposed_at, d.proposed_by
         from %I x
         left join label_sources s
           on s.table_name = %L and s.row_id = x.id::text and s.column_name = %L
         left join label_drafts d
           on d.table_name = %L and d.row_id = x.id::text and d.column_name = %L
        where nullif(btrim(x.%I), '''') is not null',
      l.table_name, l.column_name, l.th_column, l.label_group, l.optional,
      l.column_name, l.th_column,
      l.th_column, l.optional,
      l.column_name,
      l.table_name,
      l.table_name, l.column_name,
      l.table_name, l.column_name,
      l.column_name);
  end loop;
end;
$$;

comment on function label_translations() is
  'Every label in translatable_labels with its English, its live Thai, any proposal waiting on it, and missing / as_typed / stale / current / proposed (0166, 0293). proposed means no live Thai and a draft waiting. For translations.view or translations.manage Read, and empty for anyone else.';

revoke all on function label_translations() from public, anon;
grant execute on function label_translations() to authenticated, service_role;

notify pgrst, 'reload schema';
