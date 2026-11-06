// Rollback harness for 0319 (profile-photo guards) and 0320 (deceased widen) against DEV only.
// One transaction ending in a deliberate `raise exception` that carries the evidence, so nothing commits.
//   node scripts/check-resident-record-guards.mjs
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// expect_fail(label, sql): the statement MUST raise; expect_ok(label, sql): it MUST NOT.
const sql = `
begin;
do $h$
declare
  r uuid; d uuid; a_ok uuid; a_new uuid; a_priv uuid; a_med uuid; a_old uuid; a_vid uuid;
  got text; pid uuid; bt uuid;
  procedure_dummy int;
begin
  select ur.user_id into pid from user_roles ur join roles ro on ro.id = ur.role_id where ur.archived_at is null and ro.key = 'admin' limit 1;
  perform set_config('request.jwt.claims', '', true); -- setup as the script, so no approve-on-save stamp

  -- ===== 0319: photo guards =====
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0319', 'Dog', true, 'R-H319A') returning id into r;
  -- distinct drive_file_id per row (a shared id makes is_public_drive_file() true for both)
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_at, approved_at) values
    ('resident', r, 'h319-cur', 'cur.jpg', 'Shelter', now() - interval '5 days', now()) returning id into a_ok;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_at, approved_at) values
    ('resident', r, 'h319-old', 'old.jpg', 'Shelter', now() - interval '4 days', now()) returning id into a_old;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_at) values
    ('resident', r, 'h319-new', 'new.jpg', 'Shelter', now() - interval '1 day') returning id into a_new;            -- never reviewed
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_at, private_only_at) values
    ('resident', r, 'h319-priv', 'priv.jpg', 'Shelter', now() - interval '2 days', now()) returning id into a_priv;  -- refused
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_at, approved_at) values
    ('resident', r, 'h319-med', 'med.jpg', 'Medical', now() - interval '3 days', now()) returning id into a_med;     -- approved but Medical
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_at, approved_at) values
    ('resident', r, 'h319-vid', 'clip.mp4', 'Shelter', now() - interval '3 days', now()) returning id into a_vid;    -- approved but a video

  perform set_config('request.jwt.claims', json_build_object('sub', pid, 'role', 'authenticated')::text, true);
  -- the insert trigger stamps approval itself (script = approved), so set the wanted states by UPDATE as the script
  update attachments set approved_at = null, approved_by = null where drive_file_id = 'h319-new';
  update attachments set approved_at = null, approved_by = null, private_only_at = now() where drive_file_id = 'h319-priv';
  if (select approval from attachments where drive_file_id = 'h319-new') is not null or (select approval from attachments where drive_file_id = 'h319-priv') <> 'private_only' then raise exception 'FAIL 0 setup states'; end if;
  -- direct set: each ineligible file refused, an approved picture accepted
  begin perform set_resident_profile_photo(r, 'h319-new'); raise exception 'FAIL 1a unreviewed photo accepted';
  exception when others then if sqlerrm like 'FAIL%' or sqlerrm like 'Not authorized%' then raise; end if; end;
  begin perform set_resident_profile_photo(r, 'h319-priv'); raise exception 'FAIL 1b private_only photo accepted';
  exception when others then if sqlerrm like 'FAIL%' or sqlerrm like 'Not authorized%' then raise; end if; end;
  begin perform set_resident_profile_photo(r, 'h319-med'); raise exception 'FAIL 1c Medical photo accepted';
  exception when others then if sqlerrm like 'FAIL%' or sqlerrm like 'Not authorized%' then raise; end if; end;
  begin perform set_resident_profile_photo(r, 'h319-vid'); raise exception 'FAIL 1d video accepted';
  exception when others then if sqlerrm like 'FAIL%' or sqlerrm like 'Not authorized%' then raise; end if; end;
  perform set_resident_profile_photo(r, 'h319-cur');
  if (select profile_photo_drive_file_id from residents where id = r) <> 'h319-cur' then raise exception 'FAIL 1e approved photo not set'; end if;

  -- fallback: delete the current picture; only the approved, non-Medical, non-video one is promoted (newest eligible = h319-old)
  perform delete_resident_photo(a_ok);
  got := (select profile_photo_drive_file_id from residents where id = r);
  if got is distinct from 'h319-old' then raise exception 'FAIL 2a fallback promoted % (wanted h319-old)', coalesce(got, 'NULL'); end if;
  perform delete_resident_photo(a_old);
  got := (select profile_photo_drive_file_id from residents where id = r);
  if got is not null then raise exception 'FAIL 2b only unreviewed/private/Medical/video left but % promoted', got; end if;

  -- ===== 0320: deceased widen =====
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0320', 'Dog', false, 'R-H320A') returning id into d;
  insert into placement_history (resident_id, placement_type, start_date) values (d, 'Intake', now() - interval '30 days');
  -- seed one row per table while alive
  insert into weight (resident_id, date, weight_kg, notes) values (d, current_date - 3, 10, 'n');
  insert into procedures (resident_id, procedure_type_id, date, notes) values (d, (select id from procedure_types limit 1), current_date - 3, 'n');
  insert into blood_tests (resident_id, date, results, blood_test_type_id) values (d, current_date - 3, 'r', (select id from blood_test_types limit 1)) returning id into bt;
  insert into prescriptions (resident_id, medication_id, start_date, notes) values (d, (select id from medication limit 1), current_date - 3, 'n');
  insert into immunization_records (resident_id, immunization_type_id, date_administered, notes) values (d, (select id from immunization_types limit 1), current_date - 3, 'n');
  insert into placement_history (resident_id, placement_type, start_date, enclosure_id) values (d, 'Deceased', now() - interval '1 day', (select e.id from enclosures e join zones z on z.id = e.zone_id where z.name = 'Lifecycle' and e.name = 'Deceased'));
  if not resident_is_deceased(d) then
    -- deceased needs a Deceased zone enclosure in some data sets; report rather than guess
    raise exception 'FAIL 3 harness resident is not deceased (setup)';
  end if;

  -- allowed: notes on each table; late blood test row; blood result text
  update weight set notes = 'late note' where resident_id = d;
  update procedures set notes = 'late note' where resident_id = d;
  update prescriptions set notes = 'late note' where resident_id = d;
  update immunization_records set notes = 'late note' where resident_id = d;
  update placement_history set notes = 'late note' where resident_id = d and placement_type = 'Intake';
  update blood_tests set results = 'late result' where id = bt;
  insert into blood_tests (resident_id, date, results, blood_test_type_id) values (d, current_date, 'arrived after death', (select id from blood_test_types limit 1));

  -- still refused: a column that was NOT opened, INSERT elsewhere, DELETE everywhere
  begin update weight set weight_kg = 99 where resident_id = d; raise exception 'FAIL 4a weight_kg changed';
  exception when restrict_violation then null; end;
  begin update procedures set date = current_date where resident_id = d; raise exception 'FAIL 4b procedure_type changed';
  exception when restrict_violation then null; end;
  begin update blood_tests set date = current_date where id = bt; raise exception 'FAIL 4c blood test date changed';
  exception when restrict_violation then null; end;
  begin update placement_history set end_date = now() where resident_id = d and placement_type = 'Intake'; raise exception 'FAIL 4d placement end_date changed';
  exception when restrict_violation then null; end;
  begin update prescriptions set start_date = current_date where resident_id = d; raise exception 'FAIL 4e prescription start_date changed';
  exception when restrict_violation then null; end;
  begin update immunization_records set batch_number = 'zz' where resident_id = d; raise exception 'FAIL 4f batch_number changed';
  exception when restrict_violation then null; end;
  begin update weight set notes = 'x', weight_kg = 1 where resident_id = d; raise exception 'FAIL 4g notes plus another column accepted';
  exception when restrict_violation then null; end;
  begin insert into weight (resident_id, date, weight_kg) values (d, current_date, 5); raise exception 'FAIL 5a weight INSERT accepted';
  exception when restrict_violation then null; end;
  begin insert into prescriptions (resident_id, medication_id, start_date) values (d, (select id from medication limit 1), current_date); raise exception 'FAIL 5b prescription INSERT accepted';
  exception when restrict_violation then null; end;
  begin insert into placement_history (resident_id, placement_type, start_date) values (d, 'Intake', now()); raise exception 'FAIL 5c placement INSERT accepted';
  exception when restrict_violation then null; end;
  begin delete from weight where resident_id = d; raise exception 'FAIL 6a weight DELETE accepted';
  exception when restrict_violation then null; end;
  begin delete from blood_tests where id = bt; raise exception 'FAIL 6b blood test DELETE accepted';
  exception when restrict_violation then null; end;

  raise exception 'HARNESS-OK 0319: unreviewed, private_only, Medical and video photos refused by set; approved accepted; fallback promotes only an approved non-Medical picture and leaves NULL when none | 0320: notes allowed on weight/procedures/prescriptions/immunizations/placements, blood result text and a late blood test INSERT allowed | un-opened columns, notes-plus-other, INSERT elsewhere and every DELETE still refused';
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
