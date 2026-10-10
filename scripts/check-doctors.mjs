// Rollback harness for the doctors list (0102_vet_doctors_and_vet_accounts.sql,
// now doctors + doctor_clinics after 0125 and 0172) against DEV only.
// One transaction: assertions against the LIVE schema and real rows, then a
// deliberate `raise exception` carrying the evidence — so nothing commits.
//
// It no longer replays 0102: 0108, 0110 and 0125 redefine its objects (0125
// moved the clinic guarantee onto doctor_clinics; 0172 renamed the tables and
// dropped doctors' own clinic column), so a replay would put
// the old bodies back and test a schema that no longer exists
// (docs/decisions/2026-10-02-replay-or-assert-live.md). The multi-clinic rules
// are in check-doctor-multi-clinic.mjs.
//
//   node scripts/check-doctors.mjs     (from the repo root; dev only)
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
  v_res uuid; v_dead uuid; v_clinic uuid; v_clinic2 uuid;
  v_mgmt uuid; v_doctoruser uuid;
  v_a uuid; v_b uuid; v_c uuid; v_d1 uuid; v_d2 uuid; v_d3 uuid;
  v_got text; v_n int; v_unlinked int; v_rejected boolean;
  v_evidence text := '';
begin
  -- A. backfill: every named visit with a clinic is linked, and its name is the list's
  select count(*) into v_unlinked from clinic_visits
   where doctor_name is not null and clinic_id is not null and doctor_id is null;
  if v_unlinked <> 0 then raise exception 'FAIL A % named visits left unlinked', v_unlinked; end if;
  select count(*) into v_n from clinic_visits a join doctors d on d.id = a.doctor_id
   where a.doctor_name is distinct from d.name
      or not exists (select 1 from doctor_clinics dc where dc.doctor_id = d.id and dc.clinic_id = a.clinic_id);
  if v_n <> 0 then raise exception 'FAIL A % linked visits disagree with the list', v_n; end if;
  select count(*) into v_n from doctors;
  v_evidence := v_evidence || format('backfill: %s doctor(s), 0 unlinked; ', v_n);

  select s.resident_id into v_res from resident_current_state s
   where s.current_status in ('Resident', 'Unassigned') limit 1;
  select r.id into v_dead from residents r where resident_is_deceased(r.id) limit 1;
  select id into v_clinic from clinics order by name limit 1;
  select id into v_clinic2 from clinics where id <> v_clinic order by name limit 1;
  -- a management login, the non-doctor control (was staff until 0173 retired it: a live staff row is
  -- refused). Dev may hold no live one: turn an archived staff account into management (rolled back)
  select user_id into v_mgmt from user_roles where role = 'management' and archived_at is null limit 1;
  if v_mgmt is null then
    select user_id into v_mgmt from user_roles where role = 'staff' and archived_at is not null limit 1;
    update user_roles set role = 'management', archived_at = null where user_id = v_mgmt;
  end if;
  select user_id into v_doctoruser from user_roles where role = 'doctor' and archived_at is null limit 1;
  if v_res is null or v_clinic2 is null or v_mgmt is null or v_doctoruser is null then
    raise exception 'FAIL setup: res % clinic2 % management % doctoruser %', v_res, v_clinic2, v_mgmt, v_doctoruser;
  end if;

  -- B. a typed name adds a doctor; another spelling of it links to the same one
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (v_res, v_clinic, now(), '  Dr Harness Somchai ') returning id, doctor_id, doctor_name into v_a, v_d1, v_got;
  if v_d1 is null or v_got is distinct from 'Dr Harness Somchai' then raise exception 'FAIL B first: % [%]', v_d1, v_got; end if;
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (v_res, v_clinic, now(), E'dr  harness\\tsomchai') returning id, doctor_id, doctor_name into v_b, v_d2, v_got;
  if v_d2 is distinct from v_d1 or v_got is distinct from 'Dr Harness Somchai' then
    raise exception 'FAIL B variant: % vs % [%]', v_d2, v_d1, v_got; end if;
  select count(*) into v_n from doctors d join doctor_clinics dc on dc.doctor_id = d.id
   where dc.clinic_id = v_clinic and doctor_name_key(d.name) = 'dr harness somchai';
  if v_n <> 1 then raise exception 'FAIL B % list rows for one doctor', v_n; end if;

  -- C. choosing by id fills the name; a doctor from another clinic is refused
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id)
    values (v_res, v_clinic, now(), v_d1) returning doctor_name into v_got;
  if v_got is distinct from 'Dr Harness Somchai' then raise exception 'FAIL C by id: [%]', v_got; end if;
  v_rejected := false;
  begin
    insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (v_res, v_clinic2, now(), v_d1);
  exception when foreign_key_violation then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL C another clinic''s doctor was accepted'; end if;

  -- D. no clinic: free text, no link. Blank: no doctor.
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (v_res, null, now(), ' Dr Nowhere ') returning doctor_id, doctor_name into v_d3, v_got;
  if v_d3 is not null or v_got is distinct from 'Dr Nowhere' then raise exception 'FAIL D no clinic: % [%]', v_d3, v_got; end if;
  update clinic_visits set doctor_name = '  ' where id = v_b returning doctor_id, doctor_name into v_d3, v_got;
  if v_d3 is not null or v_got is not null then raise exception 'FAIL D cleared: % [%]', v_d3, v_got; end if;

  -- E. moving a visit to another clinic relinks the name there; other edits leave it alone
  update clinic_visits set notes = 'harness 0102' where id = v_a returning doctor_id into v_d3;
  if v_d3 is distinct from v_d1 then raise exception 'FAIL E other-column edit changed the doctor'; end if;
  update clinic_visits set clinic_id = v_clinic2 where id = v_a returning doctor_id into v_d2;
  if v_d2 is null or v_d2 = v_d1 or not exists (select 1 from doctor_clinics where doctor_id = v_d2 and clinic_id = v_clinic2) then
    raise exception 'FAIL E relink: %', v_d2; end if;
  update clinic_visits set clinic_id = v_clinic where id = v_a;  -- back, for F

  -- F. a rename reaches every linked visit, a deceased resident's too
  if v_dead is not null then
    perform set_config('app.deceased_lock_bypass', 'on', true);
    insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id)
      values (v_dead, v_clinic, now(), v_d1) returning id into v_c;
    perform set_config('app.deceased_lock_bypass', '', true);
  end if;
  update doctors set name = 'Dr Harness Somchai K.' where id = v_d1;
  select count(*) into v_n from clinic_visits where doctor_id = v_d1 and doctor_name <> 'Dr Harness Somchai K.';
  if v_n <> 0 then raise exception 'FAIL F % visits kept the old name', v_n; end if;
  if coalesce(current_setting('app.deceased_lock_bypass', true), '') <> '' then
    raise exception 'FAIL F the bypass leaked past the rename'; end if;
  select active into v_rejected from doctors where id = v_d1;
  if not v_rejected then raise exception 'FAIL F rename changed active'; end if;
  -- a rename onto another doctor's spelling is refused
  insert into doctors (name) values ('Somchai Harness') returning id into v_d2;
  insert into doctor_clinics (clinic_id, doctor_id) values (v_clinic, v_d2);
  v_rejected := false;
  begin
    update doctors set name = 'dr harness somchai k.' where id = v_d2;
  exception when unique_violation then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL F duplicate rename accepted'; end if;
  v_evidence := v_evidence || format('rename reached %s visits (deceased included: %s); ',
    (select count(*) from clinic_visits where doctor_id = v_d1), v_dead is not null);

  -- G. merge: visits move and take the survivor's spelling; the other row goes
  update clinic_visits set doctor_id = v_d2 where id = v_a;
  -- merge checks current_user_role(), so act as an admin
  perform set_config('request.jwt.claims', json_build_object('sub',
    (select user_id from user_roles where role = 'admin' and archived_at is null limit 1), 'role', 'authenticated')::text, true);
  perform merge_doctors(v_d1, v_d2);
  if exists (select 1 from doctors where id = v_d1) then raise exception 'FAIL G merged doctor still listed'; end if;
  select count(*) into v_n from clinic_visits where doctor_id = v_d2 and doctor_name <> 'Somchai Harness';
  if v_n <> 0 then raise exception 'FAIL G % merged visits kept another name', v_n; end if;
  if coalesce(current_setting('app.deceased_lock_bypass', true), '') <> '' then
    raise exception 'FAIL G the bypass leaked past the merge'; end if;
  -- 0125: a merge may cross clinics (the "same person as..." merge); the survivor then works at both
  insert into doctors (name) values ('Dr Elsewhere') returning id into v_d3;
  insert into doctor_clinics (clinic_id, doctor_id) values (v_clinic2, v_d3);
  perform merge_doctors(v_d3, v_d2);
  if not exists (select 1 from doctor_clinics where doctor_id = v_d2 and clinic_id = v_clinic2) then
    raise exception 'FAIL G cross-clinic merge did not give the survivor the other clinic'; end if;
  v_rejected := false;
  begin delete from doctors where id = v_d2;
  exception when foreign_key_violation then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL G a doctor with visits was deleted'; end if;

  -- H. booking in one call: the doctor is set and linked; the old call shape still works
  select count(*), min(doctor_name) into v_n, v_got
    from schedule_bulk_appointments(array[v_res, v_res], v_clinic, now(), 'harness', null, 'scheduled', ' somchai HARNESS ');
  if v_n <> 2 or v_got is distinct from 'Somchai Harness' then raise exception 'FAIL H rpc: % rows [%]', v_n, v_got; end if;
  select count(*) into v_n from clinic_visits where reason = 'harness' and doctor_id = v_d2;
  if v_n <> 2 then raise exception 'FAIL H rpc rows not linked: %', v_n; end if;
  select count(*) into v_n from schedule_bulk_appointments(p_resident_ids => array[v_res], p_clinic_id => v_clinic,
    p_appointment_date => now(), p_reason => 'harness old shape', p_notes => null, p_status => 'scheduled');
  if v_n <> 1 then raise exception 'FAIL H old call shape'; end if;

  -- I. doctor login -> clinic. 0127: a login's clinics are its linked doctor's
  -- (user_roles.vet_id and current_user_vet_id() are gone); 0125's harness covers the model.
  perform set_config('request.jwt.claims', '{}', true); -- as the owner: linking a login is an aal2 admin's act (0125 guard)
  insert into doctors (name, user_id) values ('Harness login doctor', v_doctoruser) returning id into v_d3;
  insert into doctor_clinics (clinic_id, doctor_id) values (v_clinic, v_d3);
  perform set_config('request.jwt.claims', json_build_object('sub', v_doctoruser, 'role', 'authenticated')::text, true);
  if current_user_clinic_ids() is distinct from array[v_clinic] then raise exception 'FAIL I current_user_clinic_ids for the doctor: %', current_user_clinic_ids(); end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgmt, 'role', 'authenticated')::text, true);
  if current_user_clinic_ids() <> '{}'::uuid[] then raise exception 'FAIL I current_user_clinic_ids for management'; end if;
  perform set_config('request.jwt.claims', '{}', true);

  raise exception 'HARNESS-OK %| typed name adds, variant spelling links to the same doctor, one list row | by id fills name, other clinic refused | no clinic stays free text, blank clears | clinic change relinks, other edits keep | rename reaches visits, bypass restored, duplicate rename refused | merge moves visits and clinics, used doctor undeletable | rpc links both rows, old call shape works | doctor login clinics come from the linked doctor, management gets none, current_user_clinic_ids | live schema, no replay', v_evidence;
end;
$h$;
rollback;
`;

// RLS, as each role, in its own rolled-back transaction: the policies are
// what the app actually meets.
const rls = `
begin;
do $h$
declare v_clinic uuid; v_res uuid; v_mgmt uuid; v_vol uuid; v_id uuid; v_n int; v_rejected boolean := false;
begin
  select id into v_clinic from clinics order by name limit 1;
  select s.resident_id into v_res from resident_current_state s where s.current_status in ('Resident', 'Unassigned') limit 1;
  -- a management login books (was staff until 0173 retired it: a live staff row is refused).
  -- Dev may hold no live management or volunteer account: turn archived staff accounts into
  -- them (all rolled back)
  select user_id into v_mgmt from user_roles where role = 'management' and archived_at is null limit 1;
  if v_mgmt is null then
    select user_id into v_mgmt from user_roles where role = 'staff' and archived_at is not null limit 1;
    update user_roles set role = 'management', archived_at = null where user_id = v_mgmt;
  end if;
  select user_id into v_vol from user_roles where role = 'volunteer' and archived_at is null limit 1;
  if v_vol is null then
    select user_id into v_vol from user_roles where role in ('staff', 'management') and user_id <> v_mgmt and archived_at is not null limit 1;
    update user_roles set role = 'volunteer', archived_at = null where user_id = v_vol;
  end if;
  perform set_config('harness.clinic', v_clinic::text, true);
  perform set_config('harness.res', v_res::text, true);
  perform set_config('harness.mgmt', v_mgmt::text, true);
  perform set_config('harness.vol', coalesce(v_vol::text, ''), true);
end;
$h$;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('harness.mgmt'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $h$
declare v_id uuid; v_got text;
begin
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
    values (current_setting('harness.res')::uuid, current_setting('harness.clinic')::uuid, now(), 'Dr Mgmt Harness')
    returning doctor_id, doctor_name into v_id, v_got;
  if v_id is null then raise exception 'FAIL RLS management booking did not add the doctor'; end if;
  update doctors set name = 'Dr Mgmt Harness Two' where id = v_id;
  select doctor_name into v_got from clinic_visits where doctor_id = v_id limit 1;
  if v_got <> 'Dr Mgmt Harness Two' then raise exception 'FAIL RLS management rename: [%]', v_got; end if;
end;
$h$;
reset role;

do $h$
begin
  if current_setting('harness.vol') = '' then return; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', current_setting('harness.vol'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform 1 from doctors limit 1;
  begin
    with d as (insert into doctors (name) values ('Dr Volunteer') returning id)
      insert into doctor_clinics (clinic_id, doctor_id) select current_setting('harness.clinic')::uuid, id from d;
    raise exception 'FAIL RLS a volunteer added a doctor';
  exception when insufficient_privilege then null;
  end;
  begin
    perform merge_doctors(gen_random_uuid(), gen_random_uuid());
    raise exception 'FAIL RLS a volunteer could merge';
  exception when insufficient_privilege then null;
  end;
end;
$h$;
reset role;

set local role anon;
do $h$
begin
  begin
    perform 1 from doctors;
    raise exception 'FAIL RLS anon read doctors';
  exception when insufficient_privilege then null;
  end;
  begin
    perform current_user_clinic_ids();
    raise exception 'FAIL RLS anon could call current_user_clinic_ids';
  exception when insufficient_privilege then null;
  end;
  raise exception 'HARNESS-OK rls: management booking adds and renames a doctor | volunteer (%) reads, cannot add or merge | anon cannot read the list or call current_user_clinic_ids',
    case when current_setting('harness.vol') = '' then 'no volunteer on dev, skipped' else 'checked' end;
end;
$h$;
rollback;
`;

let ok = true;
for (const [label, query] of [["behaviour", sql], ["rls", rls]]) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  let msg = text;
  try { msg = JSON.parse(text).message ?? text; } catch {}
  console.log(`${label}: status ${res.status}`);
  console.log(msg);
  if (!/HARNESS-OK/.test(msg)) ok = false;
}
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = ok ? 0 : 1;
