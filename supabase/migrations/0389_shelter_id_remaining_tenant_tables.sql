-- consumer: none
--
-- Multi-tenancy programme part 2, the tenant tables the first cut never reached (#n9grp, under #s50n8 and #ykefa). Same shape as 0383/0384:
-- a nullable shelter_id on each table, NO policy, NO default, NO backfill, NO NOT NULL, so nothing reads it and running code is unchanged.
-- Policies are part 5 (#ujqr5). The table list was read from pg_class on dev, 2026-11-16, and checked against part 1's triage (93 tenant,
-- 21 ambiguous, 9 not tenant): 47 tenant tables already carried the column after 0383/0384 and these 46 are the rest, 93 in all
-- (docs/decisions/2026-11-16-tenancy-remaining-tenant-tables.md). 19 are the ones PR #1619 named; 27 more were in group (C) "the rest",
-- which 0384 did not reach. NOT touched: the 21 ambiguous tables, public_resident_cards and public_shelter_stats (#vleak).
--
-- Fourteen unique keys that would make a second shelter impossible are widened, in 0383's form (nulls not distinct keeps today's
-- guarantee exactly while shelter_id is still null). Each acts only if today's definition is still there. Four trigger functions that
-- insert into a table that now has the column are changed to copy shelter_id from the row they act on; they stamp null today, as before.
--
-- Re-runnable. To undo: restore each key from the definition listed in the decision file, restore the four functions to their definitions
-- before this file (the same text without the shelter_id column), then drop the columns.

do $$
declare t text;
begin
  foreach t in array array[
    -- the 19 named by PR #1619
    'animal_reports', 'bulk_appointments', 'clinics', 'doctors', 'doctor_clinics', 'desexing_drives', 'desexing_drive_signups', 'diets',
    'medication', 'rounds', 'premises', 'community_dog_outings', 'community_outing_photos', 'resident_note_sources', 'foundation_documents',
    'impact_baselines', 'public_stat_switches', 'website_drafts', 'social_shares',
    -- group (C) "the rest", never reached by 0384
    'assistant_actions', 'attachments', 'audit_log', 'enclosures', 'facility_maps', 'maintenance', 'maintenance_assignees',
    'maintenance_photos', 'map_room_placements', 'map_rooms', 'meme_residents', 'memes', 'pending_photos', 'project_folders',
    'project_photos', 'recurring_job_assignees', 'recurring_job_occurrence_assignees', 'recurring_job_occurrences', 'recurring_jobs',
    'reel_residents', 'reels', 'retention_runs', 'site_content', 'site_content_photos', 'site_pages', 'video_uploads', 'write_requests',
    'zones'
  ] loop
    execute format('alter table public.%I add column if not exists shelter_id uuid references public.shelters(id)', t);
  end loop;
end $$;

-- Unique keys: per shelter. (table, name, columns, partial-index predicate or null). A constraint is rebuilt as a constraint, an index as
-- an index; a key already carrying shelter_id is left alone.
do $$
declare k record; is_con boolean;
begin
  for k in select * from (values
    ('medication', 'medication_name_key', 'shelter_id, name', null),
    ('diets', 'diets_name_key', 'shelter_id, name', null),
    ('diets', 'diets_one_standard', 'shelter_id', 'is_standard'),
    ('rounds', 'rounds_key_key', 'shelter_id, key', null),
    ('rounds', 'rounds_sort_order_key', 'shelter_id, sort_order', null),
    ('impact_baselines', 'impact_baselines_key_unique', 'shelter_id, key', null),
    ('public_stat_switches', 'public_stat_switches_key_unique', 'shelter_id, key', null),
    ('website_drafts', 'website_drafts_target_row_key_key', 'shelter_id, target, row_key', null),
    ('premises', 'premises_name_uniq', 'shelter_id, lower(btrim(name))', null),
    ('maintenance', 'maintenance_job_code_key', 'shelter_id, job_code', null),
    ('zones', 'zones_name_key', 'shelter_id, name', null),
    ('site_pages', 'site_pages_slug_key', 'shelter_id, slug', null),
    ('facility_maps', 'facility_maps_one_overview', 'shelter_id', 'kind = ''overview'''),
    ('project_folders', 'project_folders_root_name_key', 'shelter_id, lower(name)', 'parent_folder_id is null')
  ) as v(tbl, idx, cols, pred) loop
    if exists (select 1 from pg_indexes where schemaname = 'public' and indexname = k.idx and indexdef not ilike '%shelter_id%') then
      is_con := exists (select 1 from pg_constraint where conname = k.idx and conrelid = ('public.' || k.tbl)::regclass);
      if is_con then
        execute format('alter table public.%I drop constraint %I', k.tbl, k.idx);
        execute format('alter table public.%I add constraint %I unique nulls not distinct (%s)', k.tbl, k.idx, k.cols);
      else
        execute format('drop index public.%I', k.idx);
        execute format('create unique index %I on public.%I (%s) nulls not distinct%s', k.idx, k.tbl, k.cols,
                       case when k.pred is null then '' else ' where ' || k.pred end);
      end if;
    end if;
  end loop;
end $$;

-- Trigger functions that insert into a table which now has shelter_id: copy it from the row acted on (a trusted caller has no shelter, so
-- a column default could never stamp these). Each is the live definition with one added column; owner and security mode are unchanged.
create or replace function record_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
  v_actor uuid;
  v_named text;
  v_skip text[] := coalesce(tg_argv, array[]::text[]);
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old) - v_skip;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new) - v_skip;
  end if;

  if tg_op = 'UPDATE' and v_old = v_new then
    return null;
  end if;

  v_id := coalesce((v_new ->> 'id')::uuid, (v_old ->> 'id')::uuid,
                   (v_new ->> 'user_id')::uuid, (v_old ->> 'user_id')::uuid);

  v_actor := auth.uid();
  if v_actor is null then
    v_named := current_setting('app.actor', true);
    if v_named ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_actor := v_named::uuid;
    end if;
  end if;

  insert into audit_log (table_name, row_id, op, actor, old_row, new_row, shelter_id)
  values (tg_table_name, v_id, tg_op, v_actor, v_old, v_new,
          nullif(coalesce(v_new ->> 'shelter_id', v_old ->> 'shelter_id'), '')::uuid);

  return null;
end;
$$;

create or replace function site_content_hidden_pages_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_named text;
begin
  if new.hidden_public_pages is not distinct from old.hidden_public_pages then
    return null;
  end if;

  v_actor := auth.uid();
  if v_actor is null then
    v_named := current_setting('app.actor', true);
    if v_named ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_actor := v_named::uuid;
    end if;
  end if;

  insert into audit_log (table_name, row_id, op, actor, old_row, new_row, shelter_id)
  values (
    'site_content',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'UPDATE',
    v_actor,
    jsonb_build_object('hidden_public_pages', old.hidden_public_pages),
    jsonb_build_object('hidden_public_pages', new.hidden_public_pages),
    new.shelter_id
  );
  return null;
end;
$$;

create or replace function site_content_stocktaking_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_named text;
begin
  if new.stocktaking_food_enabled is not distinct from old.stocktaking_food_enabled
     and new.stocktaking_medical_enabled is not distinct from old.stocktaking_medical_enabled then
    return null;
  end if;

  v_actor := auth.uid();
  if v_actor is null then
    v_named := current_setting('app.actor', true);
    if v_named ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_actor := v_named::uuid;
    end if;
  end if;

  insert into audit_log (table_name, row_id, op, actor, old_row, new_row, shelter_id)
  values (
    'site_content',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'UPDATE',
    v_actor,
    jsonb_build_object('stocktaking_food_enabled', old.stocktaking_food_enabled,
                       'stocktaking_medical_enabled', old.stocktaking_medical_enabled),
    jsonb_build_object('stocktaking_food_enabled', new.stocktaking_food_enabled,
                       'stocktaking_medical_enabled', new.stocktaking_medical_enabled),
    new.shelter_id
  );
  return null;
end;
$$;

create or replace function clinic_visits_link_doctor()
returns trigger
language plpgsql
as $$
declare
  v_name text := nullif(regexp_replace(new.doctor_name, '^\s+|\s+$', '', 'g'), '');
  v_id uuid;
  v_list_name text;
begin
  if new.doctor_id is not null
     and (tg_op = 'INSERT' or new.doctor_id is distinct from old.doctor_id) then
    -- Chosen by id. The composite foreign key checks the clinic.
    select name into v_list_name from doctors where id = new.doctor_id;
    new.doctor_name := v_list_name;
    return new;
  end if;

  if v_name is null then
    new.doctor_id := null;
    new.doctor_name := null;
    return new;
  end if;

  if new.clinic_id is null then
    new.doctor_id := null;
    new.doctor_name := v_name;
    return new;
  end if;

  if new.doctor_id is not null then
    select d.id, d.name into v_id, v_list_name
      from doctors d
      join doctor_clinics c on c.doctor_id = d.id
     where d.id = new.doctor_id
       and c.clinic_id = new.clinic_id
       and c.name_key = doctor_name_key(v_name);
    if found then
      new.doctor_name := v_list_name;
      return new;
    end if;
  end if;

  select d.id, d.name into v_id, v_list_name
    from doctors d
    join doctor_clinics c on c.doctor_id = d.id
   where c.clinic_id = new.clinic_id and c.name_key = doctor_name_key(v_name);
  if not found then
    begin
      insert into doctors (name, shelter_id) values (v_name, new.shelter_id)
        returning id, name into v_id, v_list_name;
      insert into doctor_clinics (clinic_id, doctor_id, shelter_id) values (new.clinic_id, v_id, new.shelter_id);
    exception when unique_violation then
      -- Another transaction listed the same name here a moment ago.
      select d.id, d.name into v_id, v_list_name
        from doctors d
        join doctor_clinics c on c.doctor_id = d.id
       where c.clinic_id = new.clinic_id and c.name_key = doctor_name_key(v_name);
    end;
  end if;

  new.doctor_id := v_id;
  new.doctor_name := v_list_name;
  return new;
end;
$$;
