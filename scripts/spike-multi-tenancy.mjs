// SPIKE — not for merge. Rollback harness for the multi-tenancy spike
// (docs/decisions/2026-10-09-multi-tenancy-spike.md) against DEV only.
//
//   node scripts/spike-multi-tenancy.mjs
//
// One transaction, ending in a deliberate `raise exception` that carries the
// evidence, so nothing can commit. It:
//   1  creates `shelters` with Lanna (A) and a second shelter (B)
//   2  adds `shelter_id` to every tenant table and ONE restrictive policy per
//      table, AND-ed with every existing permissive policy (the 0100 pattern)
//   3  plants a canary dog in shelter B, cloned from a dog the public site
//      shows, with its current placement and its photos
//   4  as a Lanna admin: counts B rows visible in every base table, canary
//      rows in every view, and calls security-definer RPCs on the canary
//   5  as anon: counts canary rows in every view anon can read
// Writes nothing even on success.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

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

const sql = `
begin;
create function pg_temp.try(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
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

do $h$
declare
  t0 timestamptz := clock_timestamp();
  t1 timestamptz;
  v_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_b uuid := '00000000-0000-0000-0000-00000000000b';
  v_admin uuid;
  v_src uuid;
  v_canary uuid := gen_random_uuid();
  v_canary2 uuid := gen_random_uuid();
  v_folder uuid := gen_random_uuid();
  v_contact uuid := gen_random_uuid();
  v_src2 uuid;
  r2 record;
  v2 text;
  v_n_admin int;
  v_n_anon int;
  v_tables int := 0;
  v_pol int := 0;
  r record;
  v text;
  n int;
  v_base_leaks text := '';
  v_base_checked int := 0;
  v_auth_leaks text := '';
  v_anon_leaks text := '';
  v_rpc text := '';
  v_clone text := '';
begin
  -- 1  shelters
  create table public.shelters (id uuid primary key, name text not null);
  insert into public.shelters values (v_a, 'Lanna'), (v_b, 'Canary shelter');

  -- 2  shelter_id + one restrictive policy per tenant table
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'shelters'
       and c.relname <> all (${"array[" + GLOBAL.map((g) => `'${g}'`).join(",") + "]"})
     order by 1
  loop
    execute format('alter table public.%I add column shelter_id uuid not null default %L references public.shelters(id)', r.relname, v_a);
    execute format('create index on public.%I (shelter_id)', r.relname);
    v_tables := v_tables + 1;
  end loop;
  -- Shaped like current_user_vet_id() (0102): one row per login, SECURITY DEFINER
  -- so it can read user_roles past user_roles' own policies.
  -- Created after the columns (it reads user_roles.shelter_id) and before the
  -- policies, which resolve the function when they are created.
  execute $fn$
    create function public.current_user_shelter_id() returns uuid
      language sql stable security definer set search_path = '' as
      $b$ select shelter_id from public.user_roles where user_id = (select auth.uid()) and archived_at is null $b$
  $fn$;
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     join pg_attribute a on a.attrelid = c.oid and a.attname = 'shelter_id'
     where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'shelters' order by 1
  loop
    execute format(
      'create policy tenant_isolation on public.%I as restrictive for all to public
         using (shelter_id = (select public.current_user_shelter_id()))
         with check (shelter_id = (select public.current_user_shelter_id()))', r.relname);
    v_pol := v_pol + 1;
  end loop;
  t1 := clock_timestamp();

  -- 3  snapshot every view (and anon-readable table) BEFORE shelter B has
  --    any rows: as a Lanna admin, and as anon. A view whose output changes
  --    once B has rows is reading across the tenant line, whether the leak
  --    is a row, a photo id or just a count in an aggregate.
  select ur.user_id into v_admin from public.user_roles ur join public.roles ro on ro.id = ur.role_id
   where ro.key = 'admin' and ur.archived_at is null limit 1;
  create temp table snap (who text, obj text, mode text, before text, after text);
  for r in
    select c.relname, c.relkind,
           case when c.relkind = 'r' then 'table'
                when coalesce(c.reloptions::text, '') like '%security_invoker=true%' then 'invoker' else 'OWNER' end m
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('v', 'r') order by 1
  loop
    if r.relkind = 'v' and has_table_privilege('authenticated', format('public.%I', r.relname), 'select') then
      insert into snap values ('admin', r.relname, r.m, pg_temp.try(v_admin,
        format('select md5(coalesce(string_agg(v::text, %L order by v::text), %L)) from public.%I v', '|', '', r.relname)), null);
    end if;
    if has_table_privilege('anon', format('public.%I', r.relname), 'select') then
      insert into snap values ('anon', r.relname, r.m, pg_temp.try(null,
        format('select md5(coalesce(string_agg(v::text, %L order by v::text), %L)) from public.%I v', '|', '', r.relname)), null);
    end if;
  end loop;

  -- 4  plant shelter B. Each canary is a clone of a row the public site or
  --    the staff app already shows, re-pointed at shelter B.
  --    a dog on the public pages, with its placement, photos, a vaccination
  --    and a prescription
  select id into v_src from public.public_resident_profiles limit 1;
  v_clone := pg_temp.plant('residents', v_src, jsonb_build_object('id', v_canary, 'name', 'CANARY_B_DOG',
    'resident_code', 'CANARY-B', 'microchip_number', null, 'drive_folder_id', null), v_b, v_clone);
  for r in select id from public.placement_history where resident_id = v_src and end_date is null loop
    v_clone := pg_temp.plant('placement_history', r.id, jsonb_build_object('resident_id', v_canary), v_b, v_clone);
  end loop;
  for r in select id from public.attachments where owner_type = 'resident' and owner_id = v_src loop
    v_clone := pg_temp.plant('attachments', r.id, jsonb_build_object('owner_id', v_canary, 'file_name', 'CANARY_B_PHOTO.jpg'), v_b, v_clone);
  end loop;
  for r in select id from public.immunization_records where archived_at is null limit 1 loop
    v_clone := pg_temp.plant('immunization_records', r.id, jsonb_build_object('resident_id', v_canary), v_b, v_clone);
  end loop;
  for r in select id from public.prescriptions where archived_at is null limit 1 loop
    v_clone := pg_temp.plant('prescriptions', r.id, jsonb_build_object('resident_id', v_canary, 'clinic_visit_id', null), v_b, v_clone);
  end loop;
  --    a recent adoption
  select resident_id into v_src2 from public.placement_history ph
   where placement_type = 'Adopt' and end_date is null order by start_date desc limit 1;
  if v_src2 is not null then
    v_clone := pg_temp.plant('residents', v_src2, jsonb_build_object('id', v_canary2, 'name', 'CANARY_B_ADOPTED',
      'resident_code', 'CANARY-B2', 'microchip_number', null, 'is_public_visible', true), v_b, v_clone);
    for r in select id from public.placement_history where resident_id = v_src2 and end_date is null loop
      v_clone := pg_temp.plant('placement_history', r.id, jsonb_build_object('resident_id', v_canary2, 'start_date', now()), v_b, v_clone);
    end loop;
  end if;
  --    a public project folder and its photos
  for r in select f.id from public.project_folders f where f.is_public and f.parent_folder_id is not null limit 1 loop
    v_clone := pg_temp.plant('project_folders', r.id, jsonb_build_object('id', v_folder, 'name', 'CANARY_B_PROJECT'), v_b, v_clone);
    for r2 in select id from public.attachments where owner_type = 'project' and owner_id = r.id loop
      v_clone := pg_temp.plant('attachments', r2.id, jsonb_build_object('owner_id', v_folder, 'file_name', 'CANARY_B_PROJECT.jpg'), v_b, v_clone);
    end loop;
  end loop;
  --    a published shelter friend
  for r in select sf.id, sf.contact_id from public.shelter_friends sf where sf.published limit 1 loop
    v_clone := pg_temp.plant('contacts', r.contact_id, jsonb_build_object('id', v_contact, 'name', 'CANARY_B_FRIEND'), v_b, v_clone);
    v_clone := pg_temp.plant('shelter_friends', r.id, jsonb_build_object('contact_id', v_contact), v_b, v_clone);
  end loop;
  --    a site page, an enclosure, a community outing, an impact baseline
  for r in select id from public.site_pages limit 1 loop
    v_clone := pg_temp.plant('site_pages', r.id, jsonb_build_object('slug', 'canary-b', 'title', 'CANARY_B_PAGE'), v_b, v_clone);
  end loop;
  -- site_content cannot be planted: its primary key is a boolean (one row
  -- for the whole database), so a second shelter has nowhere to put one.
  v_clone := v_clone || 'site_content(SINGLETON: id is boolean) ';
  for r in select e.id from public.enclosures e join public.zones z on z.id = e.zone_id where z.name <> 'Lifecycle' limit 1 loop
    v_clone := pg_temp.plant('enclosures', r.id, jsonb_build_object('name', 'CANARY_B_RUN'), v_b, v_clone);
  end loop;
  for r in select id from public.community_dog_outings limit 1 loop
    v_clone := pg_temp.plant('community_dog_outings', r.id, '{}'::jsonb, v_b, v_clone);
  end loop;
  for r in select id from public.impact_baselines limit 1 loop
    v_clone := pg_temp.plant('impact_baselines', r.id, jsonb_build_object('key', 'canary_b'), v_b, v_clone);
  end loop;

  -- 5  the same snapshot AFTER
  for r in select * from snap loop
    update snap set after = pg_temp.try(case when r.who = 'admin' then v_admin end,
      format('select md5(coalesce(string_agg(v::text, %L order by v::text), %L)) from public.%I v', '|', '', r.obj))
     where who = r.who and obj = r.obj;
  end loop;
  select count(*) filter (where who = 'admin'), count(*) filter (where who = 'anon') into v_n_admin, v_n_anon from snap;
  select coalesce(string_agg(obj || '(' || mode || ')', ' ' order by obj), '') into v_auth_leaks
    from snap where who = 'admin' and before is distinct from after;
  select coalesce(string_agg(obj || '(' || mode || ')', ' ' order by obj), '') into v_anon_leaks
    from snap where who = 'anon' and before is distinct from after;
  select coalesce(string_agg(obj || ':' || coalesce(before, 'null'), ' '), '') into v
    from snap where before like 'ERR%' or before is null;

  -- 6  base tables: any shelter-B row visible to the Lanna admin?
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     join pg_attribute a on a.attrelid = c.oid and a.attname = 'shelter_id'
     where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'shelters'
       and has_table_privilege('authenticated', c.oid, 'select') order by 1
  loop
    v2 := pg_temp.try(v_admin, format('select count(*)::text from public.%I where shelter_id = %L', r.relname, v_b));
    v_base_checked := v_base_checked + 1;
    if v2 is distinct from '0' then v_base_leaks := v_base_leaks || r.relname || '=' || v2 || ' '; end if;
  end loop;

  -- 7  security-definer RPCs on the canary, as the Lanna admin
  v_rpc := v_rpc || 'resident_is_deceased=' || coalesce(pg_temp.try(v_admin, format('select public.resident_is_deceased(%L)::text', v_canary)), 'null') || '; ';
  v_rpc := v_rpc || 'set_resident_microchip=' || coalesce(pg_temp.try(v_admin, format('select public.set_resident_microchip(%L, %L, current_date)::text', v_canary, '999000000000777')), 'ok') || ' -> chip now ';
  v_rpc := v_rpc || coalesce((select microchip_number from public.residents where id = v_canary), 'null') || '; ';
  v_rpc := v_rpc || 'set_resident_drive_folder=' || coalesce(pg_temp.try(v_admin, format('select public.set_resident_drive_folder(%L, %L)::text', v_canary, 'CANARY_FOLDER')), 'ok') || ' -> folder now ';
  v_rpc := v_rpc || coalesce((select drive_folder_id from public.residents where id = v_canary), 'null') || '; ';
  v_rpc := v_rpc || 'admin reads canary through residents table=' || pg_temp.try(v_admin, format('select count(*)::text from public.residents where id = %L', v_canary));

  raise exception '%', format(
    'HARNESS-OK | schema: %s tables got shelter_id + %s restrictive policies in %s ms | planted in B: %s | '
    'BASE TABLES as Lanna admin: %s checked, B rows visible in: [%s] | '
    'VIEWS as Lanna admin: %s snapshotted, output changed when B got rows: [%s] | '
    'ANON: %s objects snapshotted, output changed when B got rows: [%s] | '
    'snapshot errors: [%s] | '
    'RPC as Lanna admin on B''s dog: %s',
    v_tables, v_pol, round(extract(epoch from t1 - t0) * 1000), v_clone,
    v_base_checked, trim(v_base_leaks),
    v_n_admin, v_auth_leaks,
    v_n_anon, v_anon_leaks,
    v,
    v_rpc);
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
