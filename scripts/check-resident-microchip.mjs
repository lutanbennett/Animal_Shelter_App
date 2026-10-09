// Rollback harness for 0113_resident_microchip_number.sql and
// 0116_set_resident_microchip.sql against DEV only.
// One transaction: the migration (twice), assertions against real rows, then
// a deliberate `raise exception` carrying the evidence — nothing can commit.
//
//   node scripts/check-resident-microchip.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0113_resident_microchip_number.sql"), "utf8");

const fn = readFileSync(join(root, "supabase/migrations/0116_set_resident_microchip.sql"), "utf8");
// 0155 (q8) replaces the function body with a has_permission('resident.microchip') check and gives Management the cell
const fn2 = readFileSync(join(root, "supabase/migrations/0155_director_answers_schema.sql"), "utf8");

const sql = `
begin;
create temp table h_pre on commit drop as
  select count(*) filter (where microchip_number is not null or microchip_implanted_on is not null) as n from residents;
${migration}
-- a second run of the whole file must be harmless
${migration}
${fn}
${fn}
${fn2}

do $h$
declare
  v_a uuid; v_b uuid; v_dead uuid;
  v_rows int; v_set int; v_n int;
  v_rejected boolean;
  v_vet uuid := gen_random_uuid(); v_staff uuid := gen_random_uuid(); v_vol uuid := gen_random_uuid();
  v_mgmt uuid := gen_random_uuid(); v_unl uuid := gen_random_uuid(); v_own uuid := gen_random_uuid(); v_oth uuid := gen_random_uuid();
  v_in uuid; v_out uuid; v_before jsonb; v_after jsonb; v_err text;
begin
  -- A. the replay back-filled nothing (real rows may carry a chip by now: compare with before)
  select count(*), count(*) filter (where microchip_number is not null or microchip_implanted_on is not null)
    into v_rows, v_set from residents;
  if v_set <> (select n from h_pre) then raise exception 'FAIL A the replay back-filled % rows', v_set - (select n from h_pre); end if;

  -- B. shape: text and date, both nullable
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'residents' and is_nullable = 'YES'
     and ((column_name = 'microchip_number' and data_type = 'text')
       or (column_name = 'microchip_implanted_on' and data_type = 'date'));
  if v_n <> 2 then raise exception 'FAIL B % of 2 columns have the expected type and nullability', v_n; end if;

  -- C. many residents with no chip do not collide
  insert into residents (name) values ('harness 0113 a'), ('harness 0113 b');
  select id into v_a from residents where name = 'harness 0113 a';
  select id into v_b from residents where name = 'harness 0113 b';

  -- D. the check: exactly 15 digits, nothing else
  update residents set microchip_number = '985112345678901' where id = v_a;
  update residents set microchip_number = null where id = v_a;
  update residents set microchip_number = '000000000000000', microchip_implanted_on = '2026-01-31' where id = v_a;
  select count(*) into v_n from residents where id = v_a
    and microchip_number = '000000000000000' and microchip_implanted_on = date '2026-01-31';
  if v_n <> 1 then raise exception 'FAIL D leading zeros or the date did not round-trip'; end if;
  for v_n in 1..7 loop
    v_rejected := false;
    begin
      update residents set microchip_number = (array[
        '98511234567890',       -- 14 digits
        '9851123456789012',     -- 16 digits
        '985 112 345 678 901',  -- spaces
        '985-112-345-678-901',  -- dashes
        '98511234567890a',      -- a letter
        '123456789',            -- legacy 9-digit, ruled out
        ''                      -- empty string is not null
      ])[v_n] where id = v_b;
    exception when check_violation then v_rejected := true; end;
    if not v_rejected then raise exception 'FAIL D invalid chip variant % accepted', v_n; end if;
  end loop;

  -- E. unique where set: a duplicate is refused, on update and on insert
  v_rejected := false;
  begin update residents set microchip_number = '000000000000000' where id = v_b;
  exception when unique_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL E duplicate chip accepted on update'; end if;
  v_rejected := false;
  begin insert into residents (name, microchip_number) values ('harness 0113 c', '000000000000000');
  exception when unique_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL E duplicate chip accepted on insert'; end if;
  -- ...and clearing the first frees the number
  update residents set microchip_number = null where id = v_a;
  update residents set microchip_number = '000000000000000' where id = v_b;

  -- F. locked on death: a deceased resident's chip cannot be set or changed,
  -- while a bio edit (0052's open columns) still goes through.
  select r.id into v_dead from residents r where resident_is_deceased(r.id) limit 1;
  if v_dead is null then raise exception 'FAIL F setup: no deceased resident in dev'; end if;
  update residents set bio = coalesce(bio, '') where id = v_dead;
  v_rejected := false;
  begin update residents set microchip_number = '111111111111111' where id = v_dead;
  exception when restrict_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL F chip number changed on a deceased resident'; end if;
  v_rejected := false;
  begin update residents set microchip_implanted_on = '2026-01-01' where id = v_dead;
  exception when restrict_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL F implant date changed on a deceased resident'; end if;

  -- G. set_resident_microchip (0116)
  insert into vets (id, name, clinic_name) values (v_own, 'Harness own', 'Harness own clinic'), (v_oth, 'Harness other', 'Harness other clinic');
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-0116-' || u || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from unnest(array[v_vet, v_staff, v_vol, v_unl, v_mgmt]) u;
  insert into user_roles (user_id, role) values (v_vet, 'vet'), (v_unl, 'vet');
  -- 0127: a vet login's clinic is its linked doctor's (the home-clinic trigger links it)
  insert into doctors (name, user_id, clinic_id) values ('Harness vet doctor', v_vet, v_own);
  insert into user_roles (user_id, role) values (v_staff, 'staff'), (v_vol, 'volunteer'), (v_mgmt, 'management');
  insert into residents (name) values ('harness 0116 in'), ('harness 0116 out');
  select id into v_in from residents where name = 'harness 0116 in';
  select id into v_out from residents where name = 'harness 0116 out';
  -- the 0026 lock refuses a visit on a deceased resident, so lift it just for this setup row
  perform set_config('app.deceased_lock_bypass', 'on', true);
  insert into clinic_visits (resident_id, clinic_id, appointment_date, status) values
    (v_in, v_own, now() - interval '2 days', 'completed'),
    (v_out, v_oth, now() - interval '2 days', 'completed'),
    (v_dead, v_own, now() - interval '2 days', 'completed');

  perform set_config('app.deceased_lock_bypass', '', true);

  -- G1 vet, in scope: sets the chip and date, and no other column changes
  perform set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
  select to_jsonb(r) - 'microchip_number' - 'microchip_implanted_on' into v_before from residents r where id = v_in;
  set local role authenticated;
  perform set_resident_microchip(v_in, '985112345678901', date '2026-02-02');
  reset role;
  select to_jsonb(r) - 'microchip_number' - 'microchip_implanted_on' into v_after from residents r where id = v_in;
  if v_before is distinct from v_after then raise exception 'FAIL G1 another column changed'; end if;
  select count(*) into v_n from residents where id = v_in and microchip_number = '985112345678901' and microchip_implanted_on = date '2026-02-02';
  if v_n <> 1 then raise exception 'FAIL G1 chip not written'; end if;
  -- G1b correcting and clearing work too
  set local role authenticated;
  perform set_resident_microchip(v_in, '985112345678902', null);
  perform set_resident_microchip(v_in, null, null);
  reset role;
  select count(*) into v_n from residents where id = v_in and microchip_number is null and microchip_implanted_on is null;
  if v_n <> 1 then raise exception 'FAIL G1b correct / clear failed'; end if;

  -- G2 refusals. Each must fail with the named error; none may write.
  set local role authenticated;
  -- G2a vet, resident outside clinic scope
  v_rejected := false;
  begin perform set_resident_microchip(v_out, '985112345678903', null);
  exception when insufficient_privilege then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL G2a vet wrote outside their clinic scope'; end if;
  -- G2b vet, deceased resident (in scope)
  v_rejected := false;
  begin perform set_resident_microchip(v_dead, '985112345678904', null);
  exception when restrict_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL G2b vet wrote on a deceased resident'; end if;
  perform set_resident_microchip(v_in, '985112345678905', null);
  reset role;

  -- G2c duplicate chip, G2d malformed numbers, G2e staff on a deceased resident
  perform set_config('request.jwt.claims', json_build_object('sub', v_staff, 'role', 'authenticated')::text, true);
  set local role authenticated;
  v_rejected := false;
  begin perform set_resident_microchip(v_out, '985112345678905', null);
  exception when unique_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL G2c duplicate chip accepted'; end if;
  foreach v_err in array array['98511234567890', '985 112 345 678 905', 'abcdefghijklmno', ''] loop
    v_rejected := false;
    begin perform set_resident_microchip(v_out, v_err, null);
    exception when check_violation then v_rejected := true; end;
    if not v_rejected then raise exception 'FAIL G2d malformed chip % accepted', quote_literal(v_err); end if;
  end loop;
  v_rejected := false;
  begin perform set_resident_microchip(v_dead, '985112345678906', null);
  exception when restrict_violation then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL G2e staff wrote on a deceased resident'; end if;

  -- G3 staff writes any resident
  perform set_resident_microchip(v_out, '985112345678907', date '2026-03-03');
  reset role;
  select count(*) into v_n from residents where id = v_out and microchip_number = '985112345678907';
  if v_n <> 1 then raise exception 'FAIL G3 staff write did not land'; end if;

  -- G3b Management writes a chip (0155, q8): the handbook said it could and the function refused it
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgmt, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform set_resident_microchip(v_out, '985112345678909', date '2026-04-04');
  v_rejected := false;
  begin perform set_resident_microchip(v_dead, '985112345678910', null);
  exception when restrict_violation then v_rejected := true; end;
  reset role;
  if not v_rejected then raise exception 'FAIL G3b management wrote on a deceased resident'; end if;
  select count(*) into v_n from residents where id = v_out and microchip_number = '985112345678909' and microchip_implanted_on = date '2026-04-04';
  if v_n <> 1 then raise exception 'FAIL G3b management write did not land'; end if;

  -- G4 roles that must not: volunteer, a vet with no clinic, anon
  foreach v_err in array array['vol', 'unlinked', 'anon'] loop
    perform set_config('request.jwt.claims', case v_err
      when 'vol' then json_build_object('sub', v_vol, 'role', 'authenticated')::text
      when 'unlinked' then json_build_object('sub', v_unl, 'role', 'authenticated')::text
      else '{"role":"anon"}' end, true);
    v_rejected := false;
    begin
      execute case v_err when 'anon' then 'set local role anon' else 'set local role authenticated' end;
      perform set_resident_microchip(v_in, '985112345678908', null);
    exception when insufficient_privilege then v_rejected := true; end;
    reset role;
    if not v_rejected then raise exception 'FAIL G4 % was allowed to set a chip', v_err; end if;
  end loop;
  select count(*) into v_n from residents where id = v_in and microchip_number = '985112345678905';
  if v_n <> 1 then raise exception 'FAIL G4 a refused call changed the row'; end if;

  raise exception 'HARNESS-OK existing rows=% back-filled=0 by the replay | shape: text + date, nullable | many nulls coexist | check rejects 14 digits, 16 digits, spaces, dashes, a letter, legacy 9-digit and empty string; accepts 15 digits with leading zeros | partial unique rejects a duplicate on update and insert and frees on clear | deceased resident: chip and date locked, bio still editable | file ran twice | 0116 set_resident_microchip: vet in scope writes, corrects and clears with no other column changed; vet out of scope, vet or staff on a deceased resident, duplicate, 14-digit / spaced / letters / empty, volunteer, unlinked vet and anon all refused; staff write allowed | 0155: management write allowed, and refused on a deceased resident', v_rows;
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
