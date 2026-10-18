// Doctor's report vs bill on a clinic visit (migration 0220). Against DEV only; one transaction that always rolls back.
//
//   node scripts/check-doctor-report-schema.mjs
//
// THE GATE: a clinic_visit attachment is now a bill OR a report. Two ways to get it wrong, both silent:
//   - a report read as a bill  -> it shows in the Bills inbox / bill photos as money owed;
//   - a bill read as a report  -> existing bill photos vanish from the Bills inbox.
// Asserts, as real JWTs through RLS:
//   S  source: loadBillPhotos() and the Bills inbox "already has a bill" query both filter purpose = 'bill'
//   A  no attachment has a null/unknown purpose; a row inserted without purpose is a bill
//   B  a bill and a report on one visit: the bill query returns only the bill
//   C  management can add and remove a report; a volunteer (no medical.visits) sees none and cannot add one
//   D  a doctor adds/reads a report at the OWN clinic (insert and record_attachment); is refused at ANOTHER clinic;
//      is refused a BILL even at their own clinic; cannot read a bill
//   E  purpose 'report' on a non-visit owner is refused by the database
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

let srcFails = 0;
const filter = /\.eq\("purpose",\s*"bill"\)/;
const photos = readFileSync("src/lib/bills/photos.ts", "utf8");
if (!filter.test(photos)) { srcFails++; console.log("FAIL S: src/lib/bills/photos.ts does not filter purpose = 'bill'"); }
const inbox = readFileSync("src/app/bills/page.tsx", "utf8");
const at = inbox.indexOf('.in("owner_type", ["stock_receipt", "clinic_visit"])');
if (at < 0 || !filter.test(inbox.slice(at, at + 400))) { srcFails++; console.log("FAIL S: src/app/bills/page.tsx held-bill query does not filter purpose = 'bill'"); }

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

create temp table ids (who text primary key, id uuid not null);
insert into ids select w, gen_random_uuid() from unnest(array['doctor','mgmt','vol','own_clinic','oth_clinic','res','own_visit','oth_visit']) w;
grant select on ids to authenticated;
create function pg_temp.hid(p text) returns uuid language sql as $$ select id from ids where who = p $$;

do $setup$
declare r record;
begin
  insert into clinics (id, name) values (pg_temp.hid('own_clinic'), 'Harness own'), (pg_temp.hid('oth_clinic'), 'Harness other');
  for r in select * from ids where who in ('doctor','mgmt','vol') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-report-' || r.who || '-' || r.id || '@example.invalid', '{}'::jsonb, jsonb_build_object('full_name','Harness '||r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role_id)
  select v.c0, ro.id from (values (pg_temp.hid('doctor'),'doctor'), (pg_temp.hid('mgmt'),'management'), (pg_temp.hid('vol'),'volunteer')) v(c0, k)
  join roles ro on ro.key = v.k;
  with d as (insert into doctors (name, user_id) values ('Harness doctor', pg_temp.hid('doctor')) returning id)
    insert into doctor_clinics (clinic_id, doctor_id) select pg_temp.hid('own_clinic'), id from d;
  insert into residents (id, name, species) values (pg_temp.hid('res'), 'Harness report', 'Dog');
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, status) values
    (pg_temp.hid('own_visit'), pg_temp.hid('res'), pg_temp.hid('own_clinic'), now() - interval '2 days', 'completed'),
    (pg_temp.hid('oth_visit'), pg_temp.hid('res'), pg_temp.hid('oth_clinic'), now() - interval '3 days', 'completed');
end $setup$;

do $h$
declare
  v_doc uuid := pg_temp.hid('doctor'); v_m uuid := pg_temp.hid('mgmt'); v_v uuid := pg_temp.hid('vol');
  v_ov uuid := pg_temp.hid('own_visit'); v_xv uuid := pg_temp.hid('oth_visit');
  n bigint; v_rep text := '';
begin
  -- A
  n := (select count(*) from attachments where purpose is null or purpose not in ('bill','report'));
  if n <> 0 then raise exception 'HARNESS-FAIL A: % rows with a bad purpose', n; end if;
  insert into attachments (owner_type, owner_id, drive_file_id) values ('clinic_visit', v_ov, 'harnessBillDefault1');
  if (select purpose from attachments where drive_file_id = 'harnessBillDefault1') <> 'bill' then raise exception 'HARNESS-FAIL A: default purpose is not bill'; end if;
  v_rep := v_rep || 'A: no bad purpose, default is bill | ';

  -- B
  insert into attachments (owner_type, owner_id, drive_file_id, purpose) values ('clinic_visit', v_ov, 'harnessReport00001', 'report');
  n := (select count(*) from attachments where owner_type = 'clinic_visit' and owner_id = v_ov and purpose = 'bill');
  if n <> 1 then raise exception 'HARNESS-FAIL B: bill query gave % rows on the visit, expected 1', n; end if;
  if exists (select 1 from attachments where owner_type = 'clinic_visit' and purpose = 'bill' and drive_file_id = 'harnessReport00001') then
    raise exception 'HARNESS-FAIL B: the report is read as a bill';
  end if;
  v_rep := v_rep || 'B: bill query returns the bill only | ';

  -- E
  n := pg_temp.try(v_m, format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''resident'', %L, ''harnessBadRep0001'', ''report'')', pg_temp.hid('res')));
  if n >= 0 then raise exception 'HARNESS-FAIL E: a report on a resident was accepted'; end if;
  v_rep := v_rep || 'E: report on a non-visit refused | ';

  -- C
  n := pg_temp.try(v_m, format('select 1 from attachments where owner_type = ''clinic_visit'' and purpose = ''report'' and owner_id = %L', v_ov));
  if n <> 1 then raise exception 'HARNESS-FAIL C: management sees % reports, expected 1', n; end if;
  n := pg_temp.try(v_m, format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''clinic_visit'', %L, ''harnessMgmtRep0001'', ''report'')', v_ov));
  if n <> 1 then raise exception 'HARNESS-FAIL C: management adding a report gave %', n; end if;
  n := pg_temp.try(v_m, 'delete from attachments where drive_file_id = ''harnessMgmtRep0001''');
  if n <> 1 then raise exception 'HARNESS-FAIL C: management removing a report gave %', n; end if;
  n := pg_temp.try(v_v, format('select 1 from attachments where owner_type = ''clinic_visit'' and owner_id = %L', v_ov));
  if n <> 0 then raise exception 'HARNESS-FAIL C: volunteer sees % visit attachments', n; end if;
  n := pg_temp.try(v_v, format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''clinic_visit'', %L, ''harnessVolRep00001'', ''report'')', v_ov));
  if n <> -1 then raise exception 'HARNESS-FAIL C: volunteer added a report: %', n; end if;
  v_rep := v_rep || 'C: management sees/adds/removes, volunteer sees none and cannot add | ';

  -- D
  n := pg_temp.try(v_doc, format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''clinic_visit'', %L, ''harnessDocRep00001'', ''report'')', v_ov));
  if n <> 1 then raise exception 'HARNESS-FAIL D: doctor adding a report at own clinic gave %', n; end if;
  n := pg_temp.try(v_doc, format('select record_attachment(''clinic_visit'', %L, ''harnessDocRep00002'', null, null, null, null, ''report'')', v_ov));
  if n <> 1 then raise exception 'HARNESS-FAIL D: record_attachment report at own clinic gave %', n; end if;
  n := pg_temp.try(v_doc, format('select 1 from attachments where owner_type = ''clinic_visit'' and owner_id = %L and purpose = ''report'' and drive_file_id = ''harnessDocRep00001''', v_ov));
  if n <> 1 then raise exception 'HARNESS-FAIL D: doctor cannot read back own report (%)', n; end if;
  n := pg_temp.try(v_doc, format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''clinic_visit'', %L, ''harnessDocRep00003'', ''report'')', v_xv));
  if n <> -1 then raise exception 'HARNESS-FAIL D: doctor added a report at another clinic: %', n; end if;
  n := pg_temp.try(v_doc, format('select record_attachment(''clinic_visit'', %L, ''harnessDocRep00004'', null, null, null, null, ''report'')', v_xv));
  if n >= 0 then raise exception 'HARNESS-FAIL D: record_attachment let the doctor file a report at another clinic'; end if;
  n := pg_temp.try(v_doc, format('insert into attachments (owner_type, owner_id, drive_file_id, purpose) values (''clinic_visit'', %L, ''harnessDocBill0001'', ''bill'')', v_ov));
  if n <> -1 then raise exception 'HARNESS-FAIL D: doctor added a BILL: %', n; end if;
  n := pg_temp.try(v_doc, format('select record_attachment(''clinic_visit'', %L, ''harnessDocBill0002'')', v_ov));
  if n >= 0 then raise exception 'HARNESS-FAIL D: record_attachment let the doctor file a bill'; end if;
  n := pg_temp.try(v_doc, 'select 1 from attachments where drive_file_id = ''harnessBillDefault1''');
  if n <> 0 then raise exception 'HARNESS-FAIL D: doctor read a bill (%)', n; end if;
  v_rep := v_rep || 'D: doctor own clinic add/read ok, other clinic refused, bill refused and unreadable';

  raise exception '%', 'HARNESS-OK 0220 | ' || v_rep;
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
process.exitCode = /HARNESS-OK/.test(msg) && !srcFails ? 0 : 1;
