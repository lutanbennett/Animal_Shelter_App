-- consumer: none
-- #stmp5 step 3: NOT NULL on every shelter_id, in the same file as the three SQL writers that would have failed on it.
-- WHY ONE FILE: the runner commits per file, so two files would let NOT NULL reach an environment (or sit for a release)
-- before the writers' fix does. In one transaction the order cannot be got wrong, and --dry-run can validate all of it.
-- WHAT BREAKS: 0390's column default is current_shelter_id(), which reads only the x-shelter-id request header. pg_cron and
-- any statement the service role runs have no header, so the default is null: today a silent null-shelter row (invisible
-- under 0392's policies), after NOT NULL an error in a job nobody watches. Live enumeration (pg_proc, cron.job, pg_trigger on
-- dev, 2026-11-17) found three writers with no honest shelter of their own; every other definer/trigger that inserts runs in
-- a signed-in request (header present) or already stamps from its row (record_audit, reset_diet_rounds, issue_donation_receipt).
-- NO LANNA FALLBACK: each writer takes its shelter from the row that caused it, or from the shelters table. See
-- docs/decisions/2026-11-17-shelter-id-not-null.md.

-- 1. Retention cron: one retention_runs row per shelter, stamped from shelters (the job has no header and no parent row).
create or replace function public.purge_donation_tax_ids()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer := 0;
  s record;
  k integer;
begin
  for s in select id from public.shelters order by id loop
    delete from public.donation_tax_ids where retain_until < current_date and shelter_id = s.id;
    get diagnostics k = row_count;
    n := n + k;
    insert into public.retention_runs (job, deleted, shelter_id) values ('purge-donation-tax-ids', k, s.id);
  end loop;
  return n;
end;
$$;

-- 2. Trigger writers: the triggering row's own shelter, else the request's (a table with no shelter_id of its own).
create or replace function public.queue_translations()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_field record;
  v_new text;
  v_old text;
  v_lang text;
  v_shelter uuid := coalesce(nullif(to_jsonb(new) ->> 'shelter_id', '')::uuid, public.current_shelter_id());
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
      (table_name, row_id, column_name, source_lang, target_lang, source_text, status, shelter_id)
    values
      (tg_table_name, new.id, v_field.column_name, v_lang, other_language(v_lang), v_new, 'pending', v_shelter)
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

create or replace function public.record_label_sources()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  l record;
  v_new jsonb;
  v_old jsonb;
  v_row text;
  v_th text;
  v_shelter uuid;
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
  v_shelter := coalesce(nullif(v_new ->> 'shelter_id', '')::uuid, public.current_shelter_id());

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
      insert into label_sources (table_name, row_id, column_name, source_text, recorded_at, shelter_id)
      values (tg_table_name, v_row, l.column_name, v_new ->> l.column_name, now(), v_shelter)
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

-- 3. Refuse to proceed if any null row survives (a bare ALTER would say so anyway; this names the table).
do $$
declare t text; n bigint; bad text := '';
begin
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables x on x.table_schema = c.table_schema and x.table_name = c.table_name and x.table_type = 'BASE TABLE'
    where c.table_schema = 'public' and c.column_name = 'shelter_id' and c.is_nullable = 'YES' order by 1
  loop
    execute format('select count(*) from public.%I where shelter_id is null', t) into n;
    if n > 0 then bad := bad || format(' %s=%s', t, n); end if;
  end loop;
  if bad <> '' then
    raise exception 'null shelter_id rows remain, run 0394-style restamp first:%', bad;
  end if;
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables x on x.table_schema = c.table_schema and x.table_name = c.table_name and x.table_type = 'BASE TABLE'
    where c.table_schema = 'public' and c.column_name = 'shelter_id' and c.is_nullable = 'YES' order by 1
  loop
    execute format('alter table public.%I alter column shelter_id set not null', t);
  end loop;
end $$;
