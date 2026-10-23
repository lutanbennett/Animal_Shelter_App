// Rollback harness for 0253_doctor_clinic_scope.sql against DEV only. Asserts the LIVE schema.
// A doctor linked only to clinic "own" must be refused on bulk_appointments (insert/update/delete/select) and on every
// clinic_visit attachment (bill or report) at clinic "other"; Admin, Management and Head of Medical must still pass.
// Ends in a deliberate raise so nothing commits.   node scripts/check-doctor-clinic-scope.mjs   (repo root; dev only)
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
    get diagnostics v = row_count;
  exception
    when insufficient_privilege then v := -1;
    when others then v := -2;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table hid (who text primary key, id uuid not null);
insert into hid select w, gen_random_uuid() from unnest(array['doctor','admin','mgmt','hom','own','oth','res','ovisit','xvisit','xbulk','xbill','xrep']) w;
grant select on hid to authenticated;
create function pg_temp.h(p text) returns uuid language sql as $$ select id from hid where who = p $$;

do $setup$
declare r record;
begin
  insert into clinics (id, name) values (pg_temp.h('own'), 'Scope own'), (pg_temp.h('oth'), 'Scope other');
  for r in select * from hid where who in ('doctor','admin','mgmt','hom') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-scope-' || r.who || '-' || r.id || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());
  end loop;
  insert into user_roles (user_id, role_id)
  select pg_temp.h(v.w), ro.id from (values ('doctor','doctor'),('admin','admin'),('mgmt','management'),('hom','head_of_medical')) v(w,k)
  join roles ro on ro.key = v.k;
  with d as (insert into doctors (name, user_id) values ('Scope doctor', pg_temp.h('doctor')) returning id)
    insert into doctor_clinics (clinic_id, doctor_id) select pg_temp.h('own'), id from d;
  insert into residents (id, name, species) values (pg_temp.h('res'), 'Scope res', 'Dog');
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, status) values
    (pg_temp.h('ovisit'), pg_temp.h('res'), pg_temp.h('own'), now(), 'completed'),
    (pg_temp.h('xvisit'), pg_temp.h('res'), pg_temp.h('oth'), now(), 'completed');
  insert into bulk_appointments (id, clinic_id, appointment_date) values (pg_temp.h('xbulk'), pg_temp.h('oth'), now());
  insert into attachments (id, owner_type, owner_id, drive_file_id, purpose) values
    (pg_temp.h('xbill'), 'clinic_visit', pg_temp.h('xvisit'), 'scopebill0001', 'bill'),
    (pg_temp.h('xrep'), 'clinic_visit', pg_temp.h('xvisit'), 'scoperep00001', 'report');
end $setup$;

do $h$
declare
  d uuid := pg_temp.h('doctor'); o uuid := pg_temp.h('oth'); xv uuid := pg_temp.h('xvisit');
  n bigint; w text; rep text := '';
begin
  n := pg_temp.try(d, format('insert into bulk_appointments (clinic_id, appointment_date) values (%L, now())', o));
  if n <> -1 then raise exception 'HARNESS-FAIL 1: doctor bulk insert at other gave %', n; end if;
  n := pg_temp.try(d, format('update bulk_appointments set reason = ''x'' where id = %L', pg_temp.h('xbulk')));
  if n <> 0 then raise exception 'HARNESS-FAIL 2: doctor updated % other bulk rows', n; end if;
  n := pg_temp.try(d, format('delete from bulk_appointments where id = %L', pg_temp.h('xbulk')));
  if n <> 0 then raise exception 'HARNESS-FAIL 3: doctor deleted % other bulk rows', n; end if;
  n := pg_temp.try(d, format('select 1 from bulk_appointments where id = %L', pg_temp.h('xbulk')));
  if n <> 1 then raise exception 'HARNESS-FAIL 4: doctor reads % of other bulk rows, expected 1 (read-only by design, 0110)', n; end if;
  n := pg_temp.try(d, format('select 1 from attachments where owner_type = ''clinic_visit'' and owner_id = %L', xv));
  if n <> 0 then raise exception 'HARNESS-FAIL 5: doctor reads % attachments on other clinic visit', n; end if;
  n := pg_temp.try(d, format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''clinic_visit'', %L, ''x1'', ''bill'')', xv));
  if n <> -1 then raise exception 'HARNESS-FAIL 6: doctor added bill at other gave %', n; end if;
  n := pg_temp.try(d, format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''clinic_visit'', %L, ''x2'', ''report'')', xv));
  if n <> -1 then raise exception 'HARNESS-FAIL 7: doctor added report at other gave %', n; end if;
  n := pg_temp.try(d, format('update attachments set file_name = ''x'' where id in (%L, %L)', pg_temp.h('xbill'), pg_temp.h('xrep')));
  if n <> 0 then raise exception 'HARNESS-FAIL 8: doctor updated % attachments at other', n; end if;
  n := pg_temp.try(d, format('delete from attachments where id in (%L, %L)', pg_temp.h('xbill'), pg_temp.h('xrep')));
  if n <> 0 then raise exception 'HARNESS-FAIL 9: doctor deleted % attachments at other', n; end if;
  rep := 'doctor refused at other: bulk insert/update/delete (select stays read-only by design), visit attachments bill+report insert/select/update/delete | ';

  foreach w in array array['admin','mgmt'] loop  -- head of medical holds neither visit.book nor medical.visits, so she never passed these; unchanged
    n := pg_temp.try(pg_temp.h(w), format('select 1 from bulk_appointments where id = %L', pg_temp.h('xbulk')));
    if n <> 1 then raise exception 'HARNESS-FAIL 10: % reads % of other bulk row', w, n; end if;
    n := pg_temp.try(pg_temp.h(w), format('select 1 from attachments where owner_type = ''clinic_visit'' and owner_id = %L', xv));
    if n <> 2 then raise exception 'HARNESS-FAIL 11: % reads % of 2 visit attachments', w, n; end if;
  end loop;
  foreach w in array array['admin','mgmt'] loop
    n := pg_temp.try(pg_temp.h(w), format('insert into bulk_appointments (clinic_id, appointment_date) values (%L, now())', o));
    if n <> 1 then raise exception 'HARNESS-FAIL 12: % bulk insert gave %', w, n; end if;
    n := pg_temp.try(pg_temp.h(w), format('update bulk_appointments set reason = ''x'' where id = %L', pg_temp.h('xbulk')));
    if n <> 1 then raise exception 'HARNESS-FAIL 13: % bulk update gave %', w, n; end if;
    n := pg_temp.try(pg_temp.h(w), format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''clinic_visit'', %L, ''m1'', ''bill'')', xv));
    if n <> 1 then raise exception 'HARNESS-FAIL 14: % bill insert gave %', w, n; end if;
    n := pg_temp.try(pg_temp.h(w), format('update attachments set file_name = ''x'' where id = %L', pg_temp.h('xbill')));
    if n <> 1 then raise exception 'HARNESS-FAIL 15: % attachment update gave %', w, n; end if;
  end loop;
  rep := rep || 'admin/management still read; admin/management still write';
  raise exception 'HARNESS-OK 0253 | %', rep;
end $h$;
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
