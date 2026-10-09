// Rollback harness for 0121_audit_log.sql against DEV only. One transaction:
// the file (twice), then the audit trail exercised as the roles that matter,
// then a deliberate `raise exception` carrying the evidence, so nothing can
// commit. Safe to run before or after the file is applied.
//
//   node scripts/check-audit-log.mjs     (from the repo root; dev only)
//
// Writes are recorded (DB-6)
//   A1  insert, update and delete on each of the seven tables write one row
//       with the right op, row_id and images
//   A2  actor is the session's login (staff, vet, admin); null for the owner
//   A3  residents' images omit microchip_number and microchip_implanted_on;
//       the other tables keep every column
//   A4  an update that changes nothing writes no row
// Reading
//   R1  an admin reads audit_log; staff, volunteer and vet read zero rows
//   R2  a vet's or staff member's write is recorded though they cannot read it
// History is not rewritable
//   W1  no API role can insert, update, delete or truncate audit_log
//       (admin included); the owner cannot update, delete or truncate either
//   W2  record_audit() and audit_log_refuse_change() are not executable by
//       anon or authenticated
//
// Exits 0 when every assertion held. Writes nothing even on success. The
// anon refusal on the Data API is asserted by scripts/check-public-views.mjs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0121_audit_log.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

-- Run one statement as a login; returns 'ok' or the error text.
create function pg_temp.run(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text := 'ok';
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
  exception when others then v := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

-- How many audit_log rows a login can see.
create function pg_temp.visible(p_uid uuid) returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select count(*) into v from audit_log;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $h$
declare
  v_vol uuid := gen_random_uuid(); v_staff uuid := gen_random_uuid();
  v_vet_u uuid := gen_random_uuid(); v_admin uuid := gen_random_uuid();
  v_res uuid := gen_random_uuid(); v_carer uuid := gen_random_uuid();
  v_vet uuid := gen_random_uuid(); v_appt uuid := gen_random_uuid();
  v_med uuid := gen_random_uuid(); v_imm uuid := gen_random_uuid();
  v_w uuid := gen_random_uuid(); v_rx uuid := gen_random_uuid();
  v_ir uuid := gen_random_uuid(); v_att uuid := gen_random_uuid();
  v_r text; v_n bigint; v_uid uuid; v_row audit_log; v_tbl text; v_id uuid;
begin
  foreach v_uid in array array[v_vol, v_staff, v_vet_u, v_admin] loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-audit-' || v_uid || '@example.invalid', '{}'::jsonb, '{"full_name":"Harness"}'::jsonb, now(), now());
  end loop;
  insert into user_roles (user_id, role) values
    (v_vol, 'volunteer'), (v_staff, 'staff'), (v_vet_u, 'vet'), (v_admin, 'admin');

  -- A1/A2: owner-made rows have a null actor
  insert into contacts (id, name, type) values (v_carer, 'Harness carer', 'Carer');
  select * into v_row from audit_log where row_id = v_carer;
  if v_row.op <> 'INSERT' or v_row.table_name <> 'contacts' or v_row.old_row is not null
     or v_row.new_row ->> 'name' <> 'Harness carer' or v_row.actor is not null
  then raise exception 'FAIL A1/A2 contact insert by the owner: %', to_jsonb(v_row); end if;

  insert into vets (id, name, clinic_name) values (v_vet, 'Harness vet', 'Harness clinic');
  insert into residents (id, name, species) values (v_res, 'Harness A', 'Dog');
  insert into medication (id, name) values (v_med, 'Harness med ' || v_med);
  insert into immunization_types (id, name, interval_months) values (v_imm, 'Harness imm ' || v_imm, 12);

  -- A3: the microchip stays out of residents' images
  v_r := pg_temp.run(v_staff, format($q$update residents set microchip_number = '985112345678901', microchip_implanted_on = '2026-01-01', behaviour_notes = 'chipped' where id = %L$q$, v_res));
  if v_r <> 'ok' then raise exception 'FAIL A3 staff chip update: %', v_r; end if;
  select * into v_row from audit_log where row_id = v_res and op = 'UPDATE';
  if v_row.id is null then raise exception 'FAIL A1 resident update wrote no row'; end if;
  if v_row.actor is distinct from v_staff then raise exception 'FAIL A2 resident update actor %', v_row.actor; end if;
  if v_row.new_row ? 'microchip_number' or v_row.old_row ? 'microchip_number'
     or v_row.new_row ? 'microchip_implanted_on' or v_row.old_row ? 'microchip_implanted_on'
     or v_row.new_row::text like '%985112345678901%'
  then raise exception 'FAIL A3 microchip leaked into the audit image: %', to_jsonb(v_row); end if;
  if v_row.old_row ->> 'behaviour_notes' is not distinct from 'chipped' or v_row.new_row ->> 'behaviour_notes' <> 'chipped'
  then raise exception 'FAIL A1 resident update images wrong: %', to_jsonb(v_row); end if;
  if not (v_row.new_row ? 'name' and v_row.new_row ? 'species')
  then raise exception 'FAIL A3 residents lost ordinary columns'; end if;

  -- A4: a no-change update writes nothing
  select count(*) into v_n from audit_log where row_id = v_res;
  v_r := pg_temp.run(v_staff, format($q$update residents set behaviour_notes = 'chipped' where id = %L$q$, v_res));
  if (select count(*) from audit_log where row_id = v_res) <> v_n
  then raise exception 'FAIL A4 a no-change update wrote an audit row'; end if;
  -- ...and neither does one that only changes an excluded column
  v_r := pg_temp.run(v_staff, format($q$update residents set microchip_implanted_on = '2026-02-02' where id = %L$q$, v_res));
  if (select count(*) from audit_log where row_id = v_res) <> v_n
  then raise exception 'FAIL A4 an excluded-column-only update wrote an audit row'; end if;

  -- A1/A2: the other tables, insert / update / delete as a vet (R2: a vet
  -- cannot read what its own write produced)
  v_r := pg_temp.run(v_admin, format($q$insert into clinic_visits (id, resident_id, clinic_id, appointment_date, reason) values (%L, %L, %L, now() - interval '1 day', 'check')$q$, v_appt, v_res, v_vet));
  if v_r <> 'ok' then raise exception 'FAIL A1 vet appointment insert: %', v_r; end if;
  v_r := pg_temp.run(v_admin, format($q$insert into weight (id, resident_id, date, weight_kg) values (%L, %L, current_date, 12.5)$q$, v_w, v_res));
  if v_r <> 'ok' then raise exception 'FAIL A1 weight insert: %', v_r; end if;
  v_r := pg_temp.run(v_admin, format($q$insert into prescriptions (id, resident_id, medication_id, start_date) values (%L, %L, %L, current_date)$q$, v_rx, v_res, v_med));
  if v_r <> 'ok' then raise exception 'FAIL A1 prescription insert: %', v_r; end if;
  v_r := pg_temp.run(v_admin, format($q$insert into immunization_records (id, resident_id, immunization_type_id, date_administered) values (%L, %L, %L, current_date)$q$, v_ir, v_res, v_imm));
  if v_r <> 'ok' then raise exception 'FAIL A1 immunization insert: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into attachments (id, owner_type, owner_id, drive_file_id, file_name) values (%L, 'resident', %L, 'harness-file', 'x.jpg')$q$, v_att, v_res));
  if v_r <> 'ok' then raise exception 'FAIL A1 attachment insert: %', v_r; end if;

  v_r := pg_temp.run(v_admin, format($q$update weight set weight_kg = 13 where id = %L$q$, v_w));
  if v_r <> 'ok' then raise exception 'FAIL A1 weight update: %', v_r; end if;
  v_r := pg_temp.run(v_admin, format($q$update prescriptions set notes = 'n' where id = %L$q$, v_rx));
  if v_r <> 'ok' then raise exception 'FAIL A1 prescription update: %', v_r; end if;
  v_r := pg_temp.run(v_admin, format($q$update clinic_visits set notes = 'n' where id = %L$q$, v_appt));
  if v_r <> 'ok' then raise exception 'FAIL A1 appointment update: %', v_r; end if;
  v_r := pg_temp.run(v_admin, format($q$update immunization_records set notes = 'n' where id = %L$q$, v_ir));
  if v_r <> 'ok' then raise exception 'FAIL A1 immunization update: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$update attachments set file_name = 'y.jpg' where id = %L$q$, v_att));
  if v_r <> 'ok' then raise exception 'FAIL A1 attachment update: %', v_r; end if;
  update contacts set phone = '0812345678' where id = v_carer;

  -- Deletes: through the owner for tables with delete policies that vary
  v_r := pg_temp.run(v_admin, format($q$delete from weight where id = %L$q$, v_w));
  if v_r <> 'ok' then raise exception 'FAIL A1 weight delete: %', v_r; end if;
  delete from prescriptions where id = v_rx;
  delete from immunization_records where id = v_ir;
  delete from clinic_visits where id = v_appt;
  v_r := pg_temp.run(v_staff, format($q$delete from attachments where id = %L$q$, v_att));
  if v_r <> 'ok' then raise exception 'FAIL A1 attachment delete: %', v_r; end if;
  delete from contacts where id = v_carer;

  for v_tbl, v_id in
    select * from (values
      ('weight', v_w), ('prescriptions', v_rx), ('immunization_records', v_ir),
      ('clinic_visits', v_appt), ('attachments', v_att), ('contacts', v_carer)
    ) t (a, b)
  loop
    select count(*) into v_n from audit_log
     where table_name = v_tbl and row_id = v_id and op = 'INSERT' and old_row is null and new_row is not null;
    if v_n <> 1 then raise exception 'FAIL A1 % INSERT rows: %', v_tbl, v_n; end if;
    select count(*) into v_n from audit_log
     where table_name = v_tbl and row_id = v_id and op = 'DELETE' and old_row is not null and new_row is null;
    if v_n <> 1 then raise exception 'FAIL A1 % DELETE rows: %', v_tbl, v_n; end if;
    select count(*) into v_n from audit_log
     where table_name = v_tbl and row_id = v_id and op = 'UPDATE' and old_row <> new_row;
    if v_n <> 1 then raise exception 'FAIL A1 % UPDATE rows: %', v_tbl, v_n; end if;
  end loop;
  -- A2: the delete of a weight carries the vet's login and the last values
  select * into v_row from audit_log where row_id = v_w and op = 'DELETE';
  if v_row.actor is distinct from v_admin or (v_row.old_row ->> 'weight_kg')::numeric <> 13
  then raise exception 'FAIL A2 weight delete actor/before-image: %', to_jsonb(v_row); end if;
  select * into v_row from audit_log where row_id = v_att and op = 'UPDATE';
  if v_row.actor is distinct from v_staff or v_row.old_row ->> 'file_name' <> 'x.jpg' or v_row.new_row ->> 'file_name' <> 'y.jpg'
  then raise exception 'FAIL A2 attachment update actor/images: %', to_jsonb(v_row); end if;

  -- R1: only admin reads
  if pg_temp.visible(v_admin) < 15 then raise exception 'FAIL R1 admin sees only % rows', pg_temp.visible(v_admin); end if;
  foreach v_uid in array array[v_vol, v_staff, v_vet_u] loop
    if pg_temp.visible(v_uid) <> 0 then raise exception 'FAIL R1 % read audit_log', v_uid; end if;
  end loop;

  -- W1: no API role writes; admin included
  foreach v_uid in array array[v_vol, v_staff, v_vet_u, v_admin] loop
    v_r := pg_temp.run(v_uid, format($q$insert into audit_log (table_name, row_id, op, new_row) values ('weight', %L, 'INSERT', '{}')$q$, v_res));
    if v_r not like '%permission denied%' then raise exception 'FAIL W1 insert as %: %', v_uid, v_r; end if;
    v_r := pg_temp.run(v_uid, $q$update audit_log set actor = null$q$);
    if v_r not like '%permission denied%' then raise exception 'FAIL W1 update as %: %', v_uid, v_r; end if;
    v_r := pg_temp.run(v_uid, $q$delete from audit_log$q$);
    if v_r not like '%permission denied%' then raise exception 'FAIL W1 delete as %: %', v_uid, v_r; end if;
    v_r := pg_temp.run(v_uid, $q$truncate audit_log$q$);
    if v_r not like '%permission denied%' then raise exception 'FAIL W1 truncate as %: %', v_uid, v_r; end if;
  end loop;
  -- ...the service role too (it bypasses RLS, so only the grant stops it)
  set local role service_role;
  begin
    update audit_log set actor = null;
    raise exception 'FAIL W1 service_role updated audit_log';
  exception when insufficient_privilege then null; end;
  begin
    delete from audit_log;
    raise exception 'FAIL W1 service_role deleted from audit_log';
  exception when insufficient_privilege then null; end;
  reset role;
  -- ...and the owner is stopped by the trigger
  begin
    update audit_log set actor = null;
    raise exception 'FAIL W1 the owner updated audit_log';
  exception when insufficient_privilege then null; end;
  begin
    delete from audit_log where row_id = v_w;
    raise exception 'FAIL W1 the owner deleted from audit_log';
  exception when insufficient_privilege then null; end;
  begin
    truncate audit_log;
    raise exception 'FAIL W1 the owner truncated audit_log';
  exception when insufficient_privilege then null; end;

  -- W2: the trigger functions are not callable from the API
  if has_function_privilege('anon', 'record_audit()', 'execute')
     or has_function_privilege('authenticated', 'record_audit()', 'execute')
     or has_function_privilege('anon', 'audit_log_refuse_change()', 'execute')
     or has_function_privilege('authenticated', 'audit_log_refuse_change()', 'execute')
  then raise exception 'FAIL W2 a trigger function is executable by an API role'; end if;
  if has_table_privilege('anon', 'audit_log', 'select') then raise exception 'FAIL W1 anon can select audit_log'; end if;

  raise exception 'HARNESS-OK file ran twice | A1 insert/update/delete recorded on residents, contacts, prescriptions, clinic_visits, weight, attachments, immunization_records | A2 actor is the session login (staff, admin), null for the owner | A3 residents images omit microchip_number and microchip_implanted_on | A4 no-change and excluded-column-only updates write nothing | R1 admin reads, volunteer/staff/vet see zero rows | R2 staff writes recorded though they cannot read the log | W1 no API role (admin, service_role included) inserts, updates, deletes or truncates; the owner is refused by the trigger | W2 trigger functions not executable by anon/authenticated';
end
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
