-- consumer: src/lib/translations/labels.ts, src/app/management/translations/TranslationQueue.tsx
--
-- A proposed Thai label can say WHO proposed it (#41yhe). label_translations() returns draft_proposed_by as a uuid and
-- nothing a translations-only login can read turns it into a name: public.app_users opens only for maintenance, bills,
-- deliveries, recurring jobs, photos and roles cards (private.works_with_logins(), 0263), so such a login would read a
-- dash where the screen used to say "someone else". This function is already security definer and already gated on the
-- two translations cards, so it resolves the name itself, as a new last column, draft_proposed_by_name.
--
-- The name is the login's display name, else what comes before the @ of its email -- never the address
-- (Lutan, 2026-10-26; src/lib/auth/app-users.ts appUserName()). Null when there is no draft or the login is gone.
--
-- A function that returns a table cannot have a column added by create or replace, so it is dropped and recreated as
-- 0293 did. Same body otherwise.
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
  draft_proposed_by uuid,
  draft_proposed_by_name text
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
              d.text_th, d.source_text, d.proposed_at, d.proposed_by,
              case when d.proposed_by is null then null else (select coalesce(nullif(u.raw_user_meta_data ->> ''full_name'', ''''), nullif(u.raw_user_meta_data ->> ''name'', ''''), nullif(split_part(u.email, ''@'', 1), ''''))::text from auth.users u where u.id = d.proposed_by) end
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
  'Every label in translatable_labels with its English, its live Thai, any proposal waiting on it (and the proposer''s name, never an address; 0366), and missing / as_typed / stale / current / proposed (0166, 0293). proposed means no live Thai and a draft waiting. For translations.view or translations.manage Read, and empty for anyone else.';

revoke all on function label_translations() from public, anon;
grant execute on function label_translations() to authenticated, service_role;

notify pgrst, 'reload schema';
