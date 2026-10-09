// Rollback harness for Recent changes → Undo (DB-6 part 3) against DEV only.
// It runs, as a signed-in admin under the real RLS, the same writes
// undoChange (src/app/admin/recent-changes/actions.ts) issues: the changed
// columns written back for an edit, and the old_row put back for a delete
// (jsonb_populate_record stands in for PostgREST's insert of a json object).
// One transaction ending in a deliberate `raise exception` carrying the
// evidence, so nothing can commit.
//
//   node scripts/check-audit-undo.mjs     (from the repo root; dev only)
//
// Asserts, per docs/decisions/2026-10-02-audit-undo.md:
//   A  an admin's edit undo applies, and the trigger (0121) records it as a
//      new UPDATE row under the ADMIN's login, not as null/system
//   B  a hard-deleted weight, prescription, visit, vaccination and contact
//      goes back from old_row with every column equal, and each undo is one
//      INSERT audit row under the admin's login
//   C  a deleted weight whose day has since been taken by a live reading is
//      refused by the partial unique index (23505), and is accepted once
//      that reading is archived (the "slot taken" case, both ways)
//   D  a deleted prescription whose visit is gone is refused (23503)
//   E  a deleted resident's image has no microchip fields (why a resident
//      delete is not offered for undo), and a staff login reads no audit rows
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

create temp table harness (k text primary key, id uuid);

-- Runs a statement as a login; returns 'ok' or the SQLSTATE and message.
create function pg_temp.run(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text := 'ok';
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
  exception when others then v := sqlstate || ' ' || sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

-- Put a deleted row back from an audit image, as the admin would.
create function pg_temp.reinsert(p_uid uuid, p_table text, p_audit bigint) returns text language plpgsql as $f$
begin
  return pg_temp.run(p_uid, format(
    'insert into %1$I select * from jsonb_populate_record(null::%1$I, (select old_row from audit_log where id = %2$s))',
    p_table, p_audit));
end $f$;

create function pg_temp.last_audit(p_table text, p_id uuid, p_op text) returns bigint language sql as $f$
  select max(id) from audit_log where table_name = p_table and row_id = p_id and op = p_op
$f$;

do $setup$
declare
  v_admin uuid := gen_random_uuid();
  v_staff uuid := gen_random_uuid();
  v_res uuid;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'harness-undo-' || u || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from unnest(array[v_admin, v_staff]) u;
  insert into user_roles (user_id, role) values (v_admin, 'admin'), (v_staff, 'staff');
  select id into v_res from record_intake(
    p_name => 'Harness audit undo', p_intake_date => date '2026-08-01', p_weight_kg => 10,
    p_diet_type_id => (select id from diet_types order by is_standard desc nulls last limit 1));
  insert into harness values ('admin', v_admin), ('staff', v_staff), ('res', v_res);
end $setup$;

do $h$
declare
  v_admin uuid := (select id from harness where k = 'admin');
  v_staff uuid := (select id from harness where k = 'staff');
  v_res uuid := (select id from harness where k = 'res');
  v_type uuid := (select id from immunization_types order by name limit 1);
  v_med uuid := (select id from medication order by name limit 1);
  v_freq uuid := (select id from frequency order by label limit 1);
  v_visit uuid := gen_random_uuid();
  v_w uuid; v_w2 uuid; v_rx uuid; v_rx_visit uuid; v_i uuid; v_c uuid;
  v_before jsonb; v_a bigint; v_r text; v_n int;
  v_report text := '';
begin
  -- A: edit undo is one UPDATE under the admin, and is itself logged.
  insert into contacts (name, type) values ('Harness contact', (enum_range(null::contact_type))[1]) returning id into v_c;
  update contacts set phone = '081 000 0000' where id = v_c;
  v_a := pg_temp.last_audit('contacts', v_c, 'UPDATE');
  select count(*) into v_n from audit_log where table_name = 'contacts' and row_id = v_c;
  v_r := pg_temp.run(v_admin, format('update contacts set phone = %L where id = %L and phone = %L',
    (select old_row ->> 'phone' from audit_log where id = v_a), v_c, '081 000 0000'));
  if v_r <> 'ok' then raise exception 'HARNESS-FAIL A: edit undo refused: %', v_r; end if;
  if (select phone from contacts where id = v_c) is not null then raise exception 'HARNESS-FAIL A: phone not restored'; end if;
  if (select count(*) from audit_log where table_name = 'contacts' and row_id = v_c) <> v_n + 1 then
    raise exception 'HARNESS-FAIL A: the undo did not write exactly one audit row';
  end if;
  if (select actor from audit_log where table_name = 'contacts' and row_id = v_c order by id desc limit 1) is distinct from v_admin then
    raise exception 'HARNESS-FAIL A: the undo is not recorded under the admin';
  end if;
  v_report := v_report || 'A: edit undo applies and is logged as a new UPDATE by the admin | ';

  -- B: delete undo for five tables, full-row equality, INSERT logged under the admin.
  insert into clinic_visits (id, resident_id, appointment_date, reason) values (v_visit, v_res, date '2026-08-10', 'harness');
  insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-12', 11) returning id into v_w;
  insert into immunization_records (resident_id, immunization_type_id, date_administered)
    values (v_res, v_type, date '2026-08-12') returning id into v_i;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity)
    values (v_res, v_med, v_freq, date '2026-08-12', 1) returning id into v_rx;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity, clinic_visit_id)
    values (v_res, v_med, v_freq, date '2026-08-13', 1, v_visit) returning id into v_rx_visit;

  v_before := to_jsonb((select x from weight x where id = v_w));
  delete from weight where id = v_w;
  v_r := pg_temp.reinsert(v_admin, 'weight', pg_temp.last_audit('weight', v_w, 'DELETE'));
  if v_r <> 'ok' then raise exception 'HARNESS-FAIL B: weight not put back: %', v_r; end if;
  if to_jsonb((select x from weight x where id = v_w)) is distinct from v_before then raise exception 'HARNESS-FAIL B: weight differs after undo'; end if;
  if not exists (select 1 from audit_log where id = pg_temp.last_audit('weight', v_w, 'INSERT') and actor = v_admin) then
    raise exception 'HARNESS-FAIL B: weight undo has no INSERT audit row under the admin';
  end if;

  v_before := to_jsonb((select x from immunization_records x where id = v_i));
  delete from immunization_records where id = v_i;
  v_r := pg_temp.reinsert(v_admin, 'immunization_records', pg_temp.last_audit('immunization_records', v_i, 'DELETE'));
  if v_r <> 'ok' then raise exception 'HARNESS-FAIL B: immunization not put back: %', v_r; end if;
  if to_jsonb((select x from immunization_records x where id = v_i)) is distinct from v_before then raise exception 'HARNESS-FAIL B: immunization differs'; end if;

  v_before := to_jsonb((select x from prescriptions x where id = v_rx));
  delete from prescriptions where id = v_rx;
  v_r := pg_temp.reinsert(v_admin, 'prescriptions', pg_temp.last_audit('prescriptions', v_rx, 'DELETE'));
  if v_r <> 'ok' then raise exception 'HARNESS-FAIL B: prescription not put back: %', v_r; end if;
  if to_jsonb((select x from prescriptions x where id = v_rx)) is distinct from v_before then raise exception 'HARNESS-FAIL B: prescription differs'; end if;

  v_before := to_jsonb((select x from contacts x where id = v_c));
  delete from contacts where id = v_c;
  v_r := pg_temp.reinsert(v_admin, 'contacts', pg_temp.last_audit('contacts', v_c, 'DELETE'));
  if v_r <> 'ok' then raise exception 'HARNESS-FAIL B: contact not put back: %', v_r; end if;
  if to_jsonb((select x from contacts x where id = v_c)) is distinct from v_before then raise exception 'HARNESS-FAIL B: contact differs'; end if;

  -- a visit: its prescription goes first (the child cannot outlive it)
  v_before := to_jsonb((select x from clinic_visits x where id = v_visit));
  delete from prescriptions where id = v_rx_visit;
  v_a := pg_temp.last_audit('prescriptions', v_rx_visit, 'DELETE');
  delete from clinic_visits where id = v_visit;
  v_r := pg_temp.reinsert(v_admin, 'clinic_visits', pg_temp.last_audit('clinic_visits', v_visit, 'DELETE'));
  if v_r <> 'ok' then raise exception 'HARNESS-FAIL B: visit not put back: %', v_r; end if;
  if to_jsonb((select x from clinic_visits x where id = v_visit)) is distinct from v_before then raise exception 'HARNESS-FAIL B: visit differs'; end if;
  v_report := v_report || 'B: weight, vaccination, prescription, contact and visit go back identical, logged as INSERT by the admin | ';

  -- C: the slot taken, then freed.
  delete from weight where id = v_w;
  insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-12', 12) returning id into v_w2;
  v_r := pg_temp.reinsert(v_admin, 'weight', pg_temp.last_audit('weight', v_w, 'DELETE'));
  if v_r not like '23505%' then raise exception 'HARNESS-FAIL C: a taken day was not refused: %', v_r; end if;
  update weight set archived_at = now() where id = v_w2;
  v_r := pg_temp.reinsert(v_admin, 'weight', pg_temp.last_audit('weight', v_w, 'DELETE'));
  if v_r <> 'ok' then raise exception 'HARNESS-FAIL C: refused although the other reading is archived: %', v_r; end if;
  v_report := v_report || 'C: a taken day refuses with 23505, an archived one does not | ';

  -- D: the visit is gone again, so the prescription that pointed at it cannot return.
  delete from clinic_visits where id = v_visit;
  v_r := pg_temp.reinsert(v_admin, 'prescriptions', v_a);
  if v_r not like '23503%' then raise exception 'HARNESS-FAIL D: a prescription on a deleted visit was not refused: %', v_r; end if;
  v_report := v_report || 'D: a row whose visit is gone refuses with 23503 | ';

  -- E: a deleted resident's image has no chip; staff read no audit rows.
  update residents set microchip_number = '985112345678901' where id = v_res;
  delete from weight where resident_id = v_res;
  delete from immunization_records where resident_id = v_res;
  delete from prescriptions where resident_id = v_res;
  delete from clinic_visits where resident_id = v_res;
  delete from resident_diets where resident_id = v_res;
  delete from placement_history where resident_id = v_res;
  delete from residents where id = v_res;
  if (select old_row from audit_log where id = pg_temp.last_audit('residents', v_res, 'DELETE')) ? 'microchip_number' then
    raise exception 'HARNESS-FAIL E: the resident image carries the chip number, so the decision''s reason is stale';
  end if;
  v_r := pg_temp.run(v_staff, 'select 1 / (case when exists (select 1 from audit_log) then 0 else 1 end)');
  if v_r <> 'ok' then raise exception 'HARNESS-FAIL E: staff can read audit_log: %', v_r; end if;
  v_report := v_report || 'E: resident image has no chip number; staff read no audit rows | ';

  raise exception '%', format('HARNESS-OK %s', v_report);
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
