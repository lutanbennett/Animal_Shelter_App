// SPIKE — not for merge. Rollback harness for the multi-tenancy spike
// (docs/decisions/2026-10-09-multi-tenancy-spike.md) against DEV only.
//
//   node scripts/spike-multi-tenancy.mjs            the item's design as written
//   node scripts/spike-multi-tenancy.mjs --reown    plus: views and security-
//                                                   definer functions re-owned
//                                                   by a role WITHOUT bypassrls
//
// One transaction, ending in a deliberate `raise exception` that carries the
// evidence, so nothing can commit. Writes nothing even on success. It:
//   1  creates `shelters` with Lanna (A) and a second shelter (B), adds
//      `shelter_id` to every tenant table, and ONE restrictive policy per
//      table, AND-ed with every existing permissive policy (the 0100 pattern)
//   2  snapshots (md5 of the full output) every view a Lanna admin can read
//      and every object anon can read, before B has any rows
//   3  --reown only: hands every owner-run view and every security-definer
//      function to a role that does NOT bypass RLS, gives that role one
//      permissive `using (true)` policy per table, and snapshots again. Any
//      difference from step 2 is a regression for Lanna, not a leak.
//   4  plants shelter B: clones of rows the public site and staff app
//      already show (a dog with placement, photos, vaccination and
//      prescription; a recent adoption; a public project with photos; a
//      published friend; an enclosure; an impact baseline)
//   5  snapshots again. Any view whose output changed is reading across the
//      tenant line — a row, a photo id, or just a number in an aggregate.
//   6  as the Lanna admin: counts B rows visible in every base table, and
//      calls security-definer RPCs that write to a resident, on B's dog
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const REOWN = process.argv.includes("--reown");

// Tables that stay global: the permission catalogue, the translation
// catalogue, the migration ledger and the ops alert tables.
const GLOBAL = [
  "permission_activities",
  "translatable_fields",
  "translatable_labels",
  "schema_migrations",
  "status_alert_checks",
  "status_alert_runs",
];
const globalList = `array[${GLOBAL.map((g) => `'${g}'`).join(",")}]::name[]`;

const sql = `
begin;
-- Run one statement as a Lanna login (uid) or as anon visiting Lanna's site
-- (uid null: PostgREST puts the request's headers in request.headers).
create function pg_temp.try(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    perform set_config('request.headers', json_build_object('x-shelter', 'lanna')::text, true);
    set local role anon;
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal2')::text, true);
    set local role authenticated;
  end if;
  begin
    execute p_sql into v;
  exception when others then v := 'ERR ' || sqlstate || ' ' || left(sqlerrm, 80);
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.headers', '', true);
  return v;
end;
$f$;

create function pg_temp.clone(p_table text, p_id uuid, p_over jsonb) returns uuid language plpgsql as $f$
declare v uuid;
begin
  execute format(
    'insert into public.%1$I select (jsonb_populate_record(null::public.%1$I, to_jsonb(t) || $1)).* from public.%1$I t where id = $2 returning id',
    p_table) using p_over, p_id into v;
  return v;
end;
$f$;

create function pg_temp.plant(p_table text, p_id uuid, p_over jsonb, p_shelter uuid, inout p_log text) language plpgsql as $f$
begin
  perform pg_temp.clone(p_table, p_id, jsonb_build_object('id', gen_random_uuid(), 'shelter_id', p_shelter) || p_over);
  p_log := p_log || p_table || ' ';
exception when others then p_log := p_log || p_table || '(ERR ' || left(sqlerrm, 70) || ') ';
end;
$f$;

create temp table snap (who text, obj text, mode text, s0 text, s1 text, s2 text);

-- Snapshot every view the admin can read and everything anon can read into
-- column p_col. Returns elapsed ms.
create function pg_temp.snapshot(p_admin uuid, p_col text) returns int language plpgsql as $f$
declare r record; t timestamptz := clock_timestamp(); q text;
begin
  for r in select * from snap loop
    q := format('select md5(coalesce(string_agg(v::text, %L order by v::text), %L)) from public.%I v', '|', '', r.obj);
    execute format('update snap set %I = $1 where who = $2 and obj = $3', p_col)
      using pg_temp.try(case when r.who = 'admin' then p_admin end, q), r.who, r.obj;
  end loop;
  return round(extract(epoch from clock_timestamp() - t) * 1000);
end;
$f$;

do $h$
declare
  t0 timestamptz := clock_timestamp();
  ms_schema int;
  ms_reown int := 0;
  ms0 int; ms1 int := 0; ms2 int;
  v_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_b uuid := '00000000-0000-0000-0000-00000000000b';
  v_admin uuid;
  v_src uuid;
  v_src2 uuid;
  v_canary uuid := gen_random_uuid();
  v_canary2 uuid := gen_random_uuid();
  v_folder uuid := gen_random_uuid();
  v_contact uuid := gen_random_uuid();
  v_tables int := 0;
  v_views int := 0;
  v_fns int := 0;
  r record;
  r2 record;
  v text;
  v_base_leaks text := '';
  v_base_checked int := 0;
  v_rpc text := '';
  v_clone text := '';
  v_regress text;
  v_auth_leaks text;
  v_anon_leaks text;
  v_err text;
  v_n_admin int;
  v_n_anon int;
  v_lanna_dog uuid;
  v_authusers text := 'n/a';
begin
  -- 1  shelters, shelter_id, the tenant helpers, one restrictive policy per table
  create table public.shelters (id uuid primary key, slug text unique not null, name text not null);
  insert into public.shelters values (v_a, 'lanna', 'Lanna'), (v_b, 'canary', 'Canary shelter');
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'shelters'
       and c.relname <> all (${globalList})
     order by 1
  loop
    execute format('alter table public.%I add column shelter_id uuid not null default %L references public.shelters(id)', r.relname, v_a);
    execute format('create index on public.%I (shelter_id)', r.relname);
    v_tables := v_tables + 1;
  end loop;
  -- The tenant of the request. Shaped like current_user_vet_id() (0102): a
  -- signed-in user's comes from their user_roles row; anon's from the site
  -- they are visiting (the Worker sends it as a header; the anon key is
  -- public, so a forged header only shows another shelter's PUBLIC pages).
  -- Stays owned by postgres: it reads user_roles, whose policy calls it.
  execute $fn$
    create function public.current_shelter_id() returns uuid
      language sql stable security definer set search_path = '' as $b$
      select case coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '')
        when 'authenticated' then
          (select shelter_id from public.user_roles where user_id = (select auth.uid()) and archived_at is null)
        when 'anon' then
          (select id from public.shelters
            where slug = nullif(current_setting('request.headers', true), '')::json ->> 'x-shelter')
      end
    $b$
  $fn$;
  -- Callers that are not an API user (service role, migrations, scripts, the
  -- worker) are trusted with every shelter, as they are today.
  execute $fn$
    create function public.is_trusted_caller() returns boolean
      language sql stable set search_path = '' as $b$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '')
             not in ('anon', 'authenticated')
    $b$
  $fn$;
  grant execute on function public.current_shelter_id(), public.is_trusted_caller() to anon, authenticated;
  grant select on public.shelters to anon, authenticated;
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     join pg_attribute a on a.attrelid = c.oid and a.attname = 'shelter_id'
     where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'shelters' order by 1
  loop
    execute format(
      'create policy tenant_isolation on public.%I as restrictive for all to public
         using (shelter_id = (select public.current_shelter_id()) or (select public.is_trusted_caller()))
         with check (shelter_id = (select public.current_shelter_id()) or (select public.is_trusted_caller()))', r.relname);
  end loop;
  ms_schema := round(extract(epoch from clock_timestamp() - t0) * 1000);

  select ur.user_id into v_admin from public.user_roles ur join public.roles ro on ro.id = ur.role_id
   where ro.key = 'admin' and ur.archived_at is null limit 1;

  -- 2  snapshot s0
  insert into snap (who, obj, mode)
  select 'admin', c.relname, case when coalesce(c.reloptions::text, '') ~ 'security_invoker=(true|on)' then 'invoker' else 'OWNER' end
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v' and has_table_privilege('authenticated', c.oid, 'select')
  union all
  select 'anon', c.relname, case when c.relkind = 'r' then 'table' when coalesce(c.reloptions::text, '') ~ 'security_invoker=(true|on)' then 'invoker' else 'OWNER' end
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('v', 'r') and has_table_privilege('anon', c.oid, 'select');
  ms0 := pg_temp.snapshot(v_admin, 's0');

  -- 3  re-own views and security-definer functions to a role without bypassrls
  if ${REOWN} then
    t0 := clock_timestamp();
    -- INHERIT from authenticated: that is how it reaches auth.uid() and
    -- auth.jwt(); postgres cannot grant on the auth schema directly.
    create role spike_definer nologin inherit nobypassrls;
    grant spike_definer to postgres;
    grant authenticated to spike_definer;
    grant usage on schema public, private, extensions to spike_definer;
    begin
      grant select on auth.users to spike_definer;
      v_authusers := 'granted';
    exception when others then v_authusers := 'REFUSED: ' || sqlerrm;
    end;
    grant create on schema public, private to spike_definer;
    grant select, insert, update, delete on all tables in schema public to spike_definer;
    grant select on all tables in schema private to spike_definer;
    grant usage, select on all sequences in schema public to spike_definer;
    grant execute on all functions in schema public, private, extensions to spike_definer;
    -- Inside a definer function or an owner-run view, the existing permissive
    -- policies are not meant to apply (that is why they are definer/owner-run);
    -- this one says so, and leaves the restrictive tenant policy in force.
    for r in
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
    loop
      execute format('create policy definer_all on public.%I for all to spike_definer using (true) with check (true)', r.relname);
    end loop;
    for r in
      select n.nspname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname in ('public', 'private') and c.relkind = 'v'
         and coalesce(c.reloptions::text, '') !~ 'security_invoker=(true|on)'
         and (n.nspname, c.relname) <> ('private', 'app_users')
    loop
      execute format('alter view %I.%I owner to spike_definer', r.nspname, r.relname);
      v_views := v_views + 1;
    end loop;
    for r in
      select p.oid::regprocedure f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname in ('public', 'private') and p.prosecdef
         and p.proname not in ('current_shelter_id')
    loop
      execute format('alter function %s owner to spike_definer', r.f);
      v_fns := v_fns + 1;
    end loop;
    -- private.app_users reads auth.users, which has RLS on and no policies,
    -- and postgres cannot add one (Supabase owns auth). So it stays owned by
    -- postgres and gets the tenant filter by hand, in its join to user_roles.
    v := pg_get_viewdef('private.app_users'::regclass);
    if position('ON ((r.user_id = u.id))' in v) = 0 then raise exception 'HARNESS-FAIL app_users join not found'; end if;
    execute 'create or replace view private.app_users as ' || replace(v, 'ON ((r.user_id = u.id))',
      'ON ((r.user_id = u.id) AND (r.shelter_id = (SELECT public.current_shelter_id())))');
    ms_reown := round(extract(epoch from clock_timestamp() - t0) * 1000);
    ms1 := pg_temp.snapshot(v_admin, 's1');
  else
    update snap set s1 = s0;
  end if;

  -- 4  plant shelter B
  select id into v_src from public.public_resident_profiles limit 1;
  v_clone := pg_temp.plant('residents', v_src, jsonb_build_object('id', v_canary, 'name', 'CANARY_B_DOG',
    'resident_code', 'CANARY-B', 'microchip_number', null, 'drive_folder_id', null), v_b, v_clone);
  for r in select id from public.placement_history where resident_id = v_src and end_date is null loop
    v_clone := pg_temp.plant('placement_history', r.id, jsonb_build_object('resident_id', v_canary), v_b, v_clone);
  end loop;
  for r in select id from public.attachments where owner_type = 'resident' and owner_id = v_src limit 3 loop
    v_clone := pg_temp.plant('attachments', r.id, jsonb_build_object('owner_id', v_canary, 'file_name', 'CANARY_B_PHOTO.jpg'), v_b, v_clone);
  end loop;
  for r in select id from public.immunization_records where archived_at is null limit 1 loop
    v_clone := pg_temp.plant('immunization_records', r.id, jsonb_build_object('resident_id', v_canary), v_b, v_clone);
  end loop;
  for r in select id from public.prescriptions where archived_at is null limit 1 loop
    v_clone := pg_temp.plant('prescriptions', r.id, jsonb_build_object('resident_id', v_canary, 'clinic_visit_id', null), v_b, v_clone);
  end loop;
  select resident_id into v_src2 from public.placement_history
   where placement_type = 'Adopt' and end_date is null order by start_date desc limit 1;
  if v_src2 is not null then
    v_clone := pg_temp.plant('residents', v_src2, jsonb_build_object('id', v_canary2, 'name', 'CANARY_B_ADOPTED',
      'resident_code', 'CANARY-B2', 'microchip_number', null, 'is_public_visible', true), v_b, v_clone);
    for r in select id from public.placement_history where resident_id = v_src2 and end_date is null loop
      v_clone := pg_temp.plant('placement_history', r.id, jsonb_build_object('resident_id', v_canary2, 'start_date', now()), v_b, v_clone);
    end loop;
  end if;
  for r in select f.id from public.project_folders f where f.is_public and f.parent_folder_id is not null limit 1 loop
    v_clone := pg_temp.plant('project_folders', r.id, jsonb_build_object('id', v_folder, 'name', 'CANARY_B_PROJECT'), v_b, v_clone);
    for r2 in select id from public.attachments where owner_type = 'project' and owner_id = r.id limit 3 loop
      v_clone := pg_temp.plant('attachments', r2.id, jsonb_build_object('owner_id', v_folder, 'file_name', 'CANARY_B_PROJECT.jpg'), v_b, v_clone);
    end loop;
  end loop;
  for r in select sf.id, sf.contact_id from public.shelter_friends sf where sf.published limit 1 loop
    v_clone := pg_temp.plant('contacts', r.contact_id, jsonb_build_object('id', v_contact, 'name', 'CANARY_B_FRIEND'), v_b, v_clone);
    v_clone := pg_temp.plant('shelter_friends', r.id, jsonb_build_object('contact_id', v_contact), v_b, v_clone);
  end loop;
  -- site_content cannot be planted: its primary key is a boolean (one row
  -- for the whole database), so a second shelter has nowhere to put one.
  v_clone := v_clone || 'site_content(SINGLETON) ';
  for r in select e.id from public.enclosures e join public.zones z on z.id = e.zone_id where z.name <> 'Lifecycle' limit 1 loop
    v_clone := pg_temp.plant('enclosures', r.id, jsonb_build_object('name', 'CANARY_B_RUN'), v_b, v_clone);
  end loop;
  for r in select id from public.impact_baselines limit 1 loop
    v_clone := pg_temp.plant('impact_baselines', r.id, jsonb_build_object('key', 'canary_b'), v_b, v_clone);
  end loop;

  -- 5  snapshot s2
  ms2 := pg_temp.snapshot(v_admin, 's2');
  select count(*) filter (where who = 'admin'), count(*) filter (where who = 'anon') into v_n_admin, v_n_anon from snap;
  select coalesce(string_agg(who || ':' || obj, ' ' order by who, obj), '') into v_regress
    from snap where s0 is distinct from s1;
  select coalesce(string_agg(obj || '(' || mode || ')', ' ' order by obj), '') into v_auth_leaks
    from snap where who = 'admin' and s1 is distinct from s2;
  select coalesce(string_agg(obj || '(' || mode || ')', ' ' order by obj), '') into v_anon_leaks
    from snap where who = 'anon' and s1 is distinct from s2;
  select coalesce(string_agg(who || ':' || obj || ' ' || coalesce(s0, 'null') || ' / ' || coalesce(s1, 'null'), '; '), '') into v_err
    from snap where s0 like 'ERR%' or s1 like 'ERR%' or s2 like 'ERR%';

  -- 6a base tables: any shelter-B row visible to the Lanna admin?
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     join pg_attribute a on a.attrelid = c.oid and a.attname = 'shelter_id'
     where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'shelters'
       and has_table_privilege('authenticated', c.oid, 'select') order by 1
  loop
    v := pg_temp.try(v_admin, format('select count(*)::text from public.%I where shelter_id = %L', r.relname, v_b));
    v_base_checked := v_base_checked + 1;
    if v is distinct from '0' then v_base_leaks := v_base_leaks || r.relname || '=' || v || ' '; end if;
  end loop;

  -- 6b security-definer RPCs on B's dog, as the Lanna admin
  v_rpc := v_rpc || 'resident_is_deceased=' || coalesce(pg_temp.try(v_admin, format('select public.resident_is_deceased(%L)::text', v_canary)), 'null') || '; ';
  v_rpc := v_rpc || 'set_resident_microchip=' || coalesce(pg_temp.try(v_admin, format('select public.set_resident_microchip(%L, %L, current_date)::text', v_canary, '999000000000777')), 'ok') || ' -> chip now ';
  v_rpc := v_rpc || coalesce((select microchip_number from public.residents where id = v_canary), 'null') || '; ';
  v_rpc := v_rpc || 'set_resident_drive_folder=' || coalesce(pg_temp.try(v_admin, format('select public.set_resident_drive_folder(%L, %L)::text', v_canary, 'CANARY_FOLDER')), 'ok') || ' -> folder now ';
  v_rpc := v_rpc || coalesce((select drive_folder_id from public.residents where id = v_canary), 'null') || '; ';
  -- and the same RPC on a Lanna dog still works
  select id into v_lanna_dog from public.residents where drive_folder_id is null and shelter_id = v_a
     and not public.resident_is_deceased(id) limit 1;
  v_rpc := v_rpc || 'set_resident_drive_folder on a Lanna dog=' || coalesce(pg_temp.try(v_admin, format(
    'select public.set_resident_drive_folder(%L, %L)::text', v_lanna_dog, 'LANNA_FOLDER')), 'ok');
  -- A separate statement: in one expression the scalar subquery runs first.
  v_rpc := v_rpc || ' -> folder now ' || coalesce((select drive_folder_id from public.residents where id = v_lanna_dog), 'null');

  raise exception '%', format(
    'HARNESS-OK %s | schema: %s tables got shelter_id + 1 restrictive policy each in %s ms | '
    're-owned: %s owner-run views + %s security-definer functions in %s ms (auth.users grant: %s) | '
    'snapshot ms: before %s, after re-own %s, after B planted %s | '
    'REGRESSION for Lanna from re-own (s0 vs s1): [%s] | '
    'planted in B: %s | '
    'BASE TABLES as Lanna admin: %s checked, B rows visible in: [%s] | '
    'VIEWS as Lanna admin: %s snapshotted, changed when B got rows: [%s] | '
    'ANON on Lanna''s site: %s objects snapshotted, changed when B got rows: [%s] | '
    'snapshot errors: [%s] | '
    'RPC as Lanna admin: %s',
    case when ${REOWN} then '(--reown)' else '(as the item describes)' end,
    v_tables, ms_schema, v_views, v_fns, ms_reown, v_authusers, ms0, ms1, ms2,
    v_regress, v_clone,
    v_base_checked, trim(v_base_leaks),
    v_n_admin, v_auth_leaks,
    v_n_anon, v_anon_leaks,
    v_err, v_rpc);
end;
$h$;
rollback;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg.split(" | ").join("\n"));
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
