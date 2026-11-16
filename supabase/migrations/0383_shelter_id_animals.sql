-- consumer: none
--
-- Multi-tenancy programme part 2, group (A) the animals (#s50n8, under #ykefa): a nullable shelter_id on the tables whose rows belong to one
-- animal or to the care of one animal, the two helper functions every later group assumes, the one trigger-written (A) table that would
-- otherwise be stamped wrong, and the one ordinary (A) unique key. NO policy, NO default, NO backfill, NO NOT NULL: nothing reads any of
-- this yet, so running code is unchanged. Groups (B), (C1) and (C2) add their own columns; policies are part 5 (#ujqr5).
--
-- current_shelter_id(): the shelter a request arrived with, from the request header the Worker sends (#v0302, in flight beside this file;
-- header name x-shelter-id carrying the shelter's uuid, the value resolve_shelter_host() returns). No header, or one that is not a uuid,
-- means null, which means no shelter and (once policies exist) no rows. A signed-in user's shelter (their user_roles row) is added by a
-- later create or replace, because user_roles has no shelter_id until group (C1). is_trusted_caller(): not an API user (service role,
-- migrations, scripts, the Worker), who are trusted with every shelter as they are today. Both are security INVOKER and read only request
-- settings, so they are not security definer functions the catalogue lint has to allow.
--
-- Re-runnable. To undo: restore reset_diet_rounds from 0137, restore the residents key (alter table residents drop constraint
-- residents_resident_code_key; alter table residents add constraint residents_resident_code_key unique (resident_code)), then drop the
-- columns and drop function current_shelter_id(), is_trusted_caller().

create or replace function current_shelter_id() returns uuid
language sql stable security invoker set search_path = public, pg_temp as $$
  select case
    when h ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then h::uuid
  end
  from (select nullif(current_setting('request.headers', true), '')::json ->> 'x-shelter-id' as h) s
$$;

create or replace function is_trusted_caller() returns boolean
language sql stable security invoker set search_path = public, pg_temp as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '') not in ('anon', 'authenticated')
$$;

revoke all on function current_shelter_id(), is_trusted_caller() from public;
grant execute on function current_shelter_id(), is_trusted_caller() to anon, authenticated, service_role;

do $$
declare t text;
begin
  foreach t in array array[
    'residents', 'placement_history', 'clinic_visits', 'blood_tests', 'procedures', 'immunization_records', 'prescriptions',
    'prescription_rounds', 'resident_diets', 'resident_diet_rounds', 'weight', 'adoption_updates', 'resident_note_tags'
  ] loop
    execute format('alter table public.%I add column if not exists shelter_id uuid references public.shelters(id)', t);
  end loop;
end $$;

-- The one trigger-written (A) table: a trusted caller has no shelter, so the column default could never stamp it; copy it from the parent.
create or replace function reset_diet_rounds(p_diet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from resident_diet_rounds where resident_diet_id = p_diet_id;
  insert into resident_diet_rounds (resident_diet_id, round_id, shelter_id)
  select d.id, r.id, d.shelter_id
    from resident_diets d
    join rounds r on r.key = any (default_diet_round_keys(d.meals_per_day))
   where d.id = p_diet_id;
end;
$$;

-- residents.resident_code: unique per shelter. NULLS NOT DISTINCT keeps today's guarantee exactly while shelter_id is still null
-- (a plain (shelter_id, resident_code) key would treat every null shelter as different and silently allow duplicates).
-- NOT touched, on Lutan's instruction of 2026-11-15: residents_microchip_number_key stays global.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'residents_resident_code_key' and conrelid = 'public.residents'::regclass
              and pg_get_constraintdef(oid) = 'UNIQUE (resident_code)') then
    alter table residents drop constraint residents_resident_code_key;
    alter table residents add constraint residents_resident_code_key unique nulls not distinct (shelter_id, resident_code);
  end if;
end $$;
