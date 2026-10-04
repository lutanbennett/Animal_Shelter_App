// Rollback harness for *_vets_readonly_for_vets.sql against DEV only. One
// transaction: what a vet's own JWT can do to vets before the file, the file
// (twice), then what each kind of session can do afterwards, then a
// deliberate `raise exception` carrying the evidence — so nothing can
// commit. Safe to run before or after the file is applied.
//
//   node scripts/check-vets-readonly.mjs     (from the repo root; dev only)
//
// It checks
//   0  before the file, while vet_rw_vets still exists, a vet's JWT CAN
//      rename a clinic — so the later refusals are the file's doing, not the
//      harness failing to reach RLS (skipped, and said so, once applied)
//   A  a vet still reads every clinic — the vet visit forms need the names
//   B  a vet cannot insert, update or delete a clinic, their own included,
//      through their own JWT — the Data API path the file closes
//   C  pg_policies: the only vet policy left on vets is a SELECT
//   D  management and admin still insert, update and delete, as
//      /management/vets does; staff and volunteer still only read
//   E  the service role still writes
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^\d+_vets_readonly_for_vets\.sql$/.test(f));
if (!file) throw new Error("no *_vets_readonly_for_vets.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;

-- Run one statement as a login (null = service role). Returns the row
-- count, or -1 if RLS refused it outright.
create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
    set local role service_role;
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
  end if;
  begin
    execute p_sql;
    get diagnostics v = row_count;
  exception when insufficient_privilege then v := -1;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values
  ('vet', gen_random_uuid()), ('mgmt', gen_random_uuid()), ('admin', gen_random_uuid()),
  ('staff', gen_random_uuid()), ('volunteer', gen_random_uuid()),
  ('own_clinic', gen_random_uuid()), ('other_clinic', gen_random_uuid()), ('new_clinic', gen_random_uuid());
grant select on harness_ids to authenticated, service_role;

do $setup$
declare r record;
begin
  insert into vets (id, name, clinic_name)
  select id, 'Harness ' || who, 'Harness clinic ' || who from harness_ids where who in ('own_clinic', 'other_clinic');
  for r in select * from harness_ids where who in ('vet', 'mgmt', 'admin', 'staff', 'volunteer') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-vets-ro-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role) select id, 'vet' from harness_ids where who = 'vet';
  -- 0127: a vet login's clinic is its linked doctor's (the home-clinic trigger links it)
  insert into vet_doctors (name, user_id, vet_id)
  select 'Harness vet doctor', id, (select id from harness_ids where who = 'own_clinic') from harness_ids where who = 'vet';
  insert into user_roles (user_id, role)
  select id, case who when 'mgmt' then 'management' else who end::app_role
  from harness_ids where who in ('mgmt', 'admin', 'staff', 'volunteer');
end $setup$;

create temp table harness_before (applied_already boolean, vet_rename bigint);
grant all on harness_before to authenticated, service_role;
insert into harness_before
select not exists (select 1 from pg_policies where tablename = 'vets' and policyname = 'vet_rw_vets'),
       pg_temp.try((select id from harness_ids where who = 'vet'),
         format('update vets set name = ''Renamed by vet'' where id = %L', (select id from harness_ids where who = 'other_clinic')));
-- Put the name back whatever happened, so the checks below start clean.
update vets set name = 'Harness other_clinic' where id = (select id from harness_ids where who = 'other_clinic');

${migration}
${migration}

do $h$
declare
  v_vet uuid := (select id from harness_ids where who = 'vet');
  v_mgmt uuid := (select id from harness_ids where who = 'mgmt');
  v_admin uuid := (select id from harness_ids where who = 'admin');
  v_staff uuid := (select id from harness_ids where who = 'staff');
  v_vol uuid := (select id from harness_ids where who = 'volunteer');
  v_own uuid := (select id from harness_ids where who = 'own_clinic');
  v_other uuid := (select id from harness_ids where who = 'other_clinic');
  v_new uuid := (select id from harness_ids where who = 'new_clinic');
  v_total bigint := (select count(*) from vets);
  v_applied boolean := (select applied_already from harness_before);
  v_before bigint := (select vet_rename from harness_before);
  v_bad text;
  n bigint;
  v_report text := '';
begin
  -- 0: the hole was real, and the harness reaches RLS.
  if v_applied then
    v_report := v_report || '0: skipped, file already applied on dev | ';
  elsif v_before <> 1 then
    raise exception 'HARNESS-FAIL 0: before the file a vet rename touched % rows, expected 1', v_before;
  else
    v_report := v_report || '0: before the file a vet renamed another clinic (1 row) | ';
  end if;

  -- A: a vet reads every clinic.
  n := pg_temp.try(v_vet, 'select * from vets');
  if n <> v_total then raise exception 'HARNESS-FAIL A: vet read % of % clinics', n, v_total; end if;
  v_report := v_report || format('A: vet reads %s/%s clinics | ', n, v_total);

  -- B: a vet cannot write, their own clinic included.
  n := pg_temp.try(v_vet, format('insert into vets (id, name) values (%L, ''Vet-made clinic'')', v_new));
  if n <> -1 then raise exception 'HARNESS-FAIL B: vet insert gave %', n; end if;
  n := pg_temp.try(v_vet, format('update vets set name = ''Renamed by vet'' where id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL B: vet update of another clinic touched % rows', n; end if;
  n := pg_temp.try(v_vet, format('update vets set name = ''Renamed by vet'' where id = %L', v_own));
  if n <> 0 then raise exception 'HARNESS-FAIL B: vet update of own clinic touched % rows', n; end if;
  n := pg_temp.try(v_vet, 'update vets set name = name');
  if n <> 0 then raise exception 'HARNESS-FAIL B: vet blanket update touched % rows', n; end if;
  n := pg_temp.try(v_vet, format('delete from vets where id in (%L, %L)', v_own, v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL B: vet delete touched % rows', n; end if;
  if (select name from vets where id = v_other) <> 'Harness other_clinic' then
    raise exception 'HARNESS-FAIL B: other clinic was renamed';
  end if;
  v_report := v_report || 'B: vet insert refused, update 0 (own, other, all), delete 0 | ';

  -- C: the only vet policy on vets is a SELECT.
  select string_agg(policyname || ':' || cmd, ', ') into v_bad
  from pg_policies where tablename = 'vets' and qual like '%''vet''%' and cmd <> 'SELECT';
  if v_bad is not null then raise exception 'HARNESS-FAIL C: vet write policy left: %', v_bad; end if;
  if not exists (select 1 from pg_policies where tablename = 'vets' and policyname = 'vet_read_vets' and cmd = 'SELECT') then
    raise exception 'HARNESS-FAIL C: vet_read_vets missing';
  end if;
  v_report := v_report || 'C: only vet_read_vets (SELECT) for vets | ';

  -- D: management and admin still write; staff and volunteer still only read.
  n := pg_temp.try(v_mgmt, format('insert into vets (id, name) values (%L, ''Mgmt clinic'')', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: management insert gave %', n; end if;
  n := pg_temp.try(v_mgmt, format('update vets set clinic_name = ''Edited'' where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: management update gave %', n; end if;
  n := pg_temp.try(v_admin, format('update vets set clinic_name = ''Edited again'' where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: admin update gave %', n; end if;
  n := pg_temp.try(v_mgmt, format('delete from vets where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: management delete gave %', n; end if;
  n := pg_temp.try(v_staff, 'select * from vets');
  if n <> v_total then raise exception 'HARNESS-FAIL D: staff read % of %', n, v_total; end if;
  n := pg_temp.try(v_vol, 'select * from vets');
  if n <> 0 then raise exception 'HARNESS-FAIL D: volunteer read % clinics (0134 took them away)', n; end if;
  n := pg_temp.try(v_staff, format('update vets set name = ''x'' where id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL D: staff update touched % rows', n; end if;
  v_report := v_report || 'D: management insert/update/delete 1, admin update 1, staff read all, volunteer none (0134), staff update 0 | ';

  -- E: the service role.
  n := pg_temp.try(null, format('update vets set clinic_name = ''Service'' where id = %L', v_other));
  if n <> 1 then raise exception 'HARNESS-FAIL E: service update gave %', n; end if;
  v_report := v_report || 'E: service role update 1';

  raise exception '%', format('HARNESS-OK %s ran twice | %s | %s', ${JSON.stringify(file).replace(/"/g, "'")},
    case when v_applied then 'applied on dev' else 'pending on dev' end, v_report);
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
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
