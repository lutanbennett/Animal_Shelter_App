// Rollback harness for clinic_visits.doctor_name (0074_vet_doctor_name.sql)
// against DEV only, live schema: 0172 renamed vet_appointments to clinic_visits,
// so the 0074 file no longer replays (docs/decisions/2026-10-02-replay-or-assert-live.md).
// One transaction: assertions against real rows, then a deliberate
// `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-doctor-name.mjs     (from the repo root; dev only)
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

do $h$
declare
  v_res uuid; v_clinic uuid; v_id uuid; v_got text;
  v_rows int; v_nonnull int; v_long text := repeat('ก', 500);
  v_rejected boolean := false;
begin
  -- A. the column is there, text and nullable (a visit's doctor is optional)
  select count(*), count(doctor_name) into v_rows, v_nonnull from clinic_visits;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clinic_visits'
                  and column_name = 'doctor_name' and data_type = 'text' and is_nullable = 'YES')
  then raise exception 'FAIL A clinic_visits.doctor_name is not a nullable text column'; end if;

  select s.resident_id into v_res from resident_current_state s
   where s.current_status in ('Resident', 'Unassigned') limit 1;
  select id into v_clinic from clinics limit 1;
  if v_res is null then raise exception 'FAIL setup: no living resident'; end if;

  -- B. insert: trimmed, blank -> null, missing -> null, inner spacing kept
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (v_res, v_clinic, now(), '  Dr Somchai  ') returning id, doctor_name into v_id, v_got;
  if v_got is distinct from 'Dr Somchai' then raise exception 'FAIL B spaces: [%]', v_got; end if;

  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (v_res, v_clinic, now(), E'\\tDr  Nok\\n') returning doctor_name into v_got;
  if v_got is distinct from 'Dr  Nok' then raise exception 'FAIL B tab/newline or inner spacing: [%]', v_got; end if;

  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (v_res, v_clinic, now(), '') returning doctor_name into v_got;
  if v_got is not null then raise exception 'FAIL B empty stored as [%]', v_got; end if;

  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (v_res, v_clinic, now(), E'   \\t ') returning doctor_name into v_got;
  if v_got is not null then raise exception 'FAIL B whitespace-only stored as [%]', v_got; end if;

  insert into clinic_visits (resident_id, clinic_id, appointment_date)
    values (v_res, v_clinic, now()) returning doctor_name into v_got;
  if v_got is not null then raise exception 'FAIL B omitted stored as [%]', v_got; end if;

  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (v_res, v_clinic, now(), v_long) returning doctor_name into v_got;
  if v_got is distinct from v_long then raise exception 'FAIL B 500 Thai characters did not round-trip'; end if;

  -- C. update: trimmed; cleared to null; untouched by edits to other columns
  update clinic_visits set doctor_name = ' Dr Ploy ' where id = v_id returning doctor_name into v_got;
  if v_got is distinct from 'Dr Ploy' then raise exception 'FAIL C update trim: [%]', v_got; end if;
  update clinic_visits set notes = 'harness 0074' where id = v_id returning doctor_name into v_got;
  if v_got is distinct from 'Dr Ploy' then raise exception 'FAIL C other-column edit changed it: [%]', v_got; end if;
  update clinic_visits set doctor_name = '  ' where id = v_id returning doctor_name into v_got;
  if v_got is not null then raise exception 'FAIL C cleared to [%]', v_got; end if;

  -- D. the constraint holds on its own, with the trigger out of the way
  alter table clinic_visits disable trigger user; -- all of them: 0102's doctor-link trigger also trims doctor_name
  begin
    insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
      values (v_res, v_clinic, now(), ' untrimmed');
  exception when check_violation then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL D constraint accepted an untrimmed name'; end if;
  v_rejected := false;
  begin
    insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
      values (v_res, v_clinic, now(), '');
  exception when check_violation then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL D constraint accepted an empty string'; end if;
  alter table clinic_visits enable trigger user;

  raise exception 'HARNESS-OK live schema | existing rows=% with a name=% | column text, nullable | insert trim, tab/newline, blank->null, whitespace->null, omitted->null, 500 Thai chars | update trim, other-column edit, clear->null | constraint rejects untrimmed and empty with trigger disabled', v_rows, v_nonnull;
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
