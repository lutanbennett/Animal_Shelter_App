// Rollback harness for 0307_intake_date_deceased.sql against DEV only, on the LIVE functions.
// One transaction, then a deliberate raise carrying the evidence, so nothing commits.
//   node scripts/check-intake-date-deceased.mjs     (from the repo root; dev only)
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
create temp table who (who text primary key, uid uuid);
insert into who values ('card', gen_random_uuid()), ('none', gen_random_uuid());
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0307-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now() from who;
insert into roles (key, name, kind) values ('h0307_card', 'h', 'custom'), ('h0307_none', 'h', 'custom');
insert into role_permissions (role_id, activity, level)
  select r.id, a, 2 from roles r, (values ('resident.correct_intake_date'), ('resident.record')) v(a) where r.key = 'h0307_card';
insert into role_permissions (role_id, activity, level) select id, 'resident.record', 2 from roles where key = 'h0307_none';
insert into user_roles (user_id, role_id) select w.uid, r.id from who w join roles r on r.key = 'h0307_' || w.who;
grant select on who to authenticated;

do $$
declare
  v_dead uuid; v_live uuid; v_enc uuid; v_enc2 uuid; v_life uuid; v_deadenc uuid; v_diet uuid;
  v_wid uuid; v_did uuid; v_pid uuid; v_today date := shelter_today();
  v_d date; v_report text := '';
  v_stmt text; v_i int; v_flag text; v_ok int := 0;
  v_cases text[] := array[
    'update residents set name = ''x'' where id = %1$L',
    'update residents set intake_date = intake_date - 1 where id = %1$L',
    'update residents set intake_date = intake_date - 1, name = ''x'' where id = %1$L',
    'delete from residents where id = %1$L',
    'update placement_history set start_date = start_date - interval ''1 day'' where id = %2$L',
    'update placement_history set notes = ''n'' where resident_id = %1$L and placement_type = ''ChangeEnclosure''',
    'delete from placement_history where resident_id = %1$L and placement_type = ''ChangeEnclosure''',
    'insert into placement_history (resident_id, placement_type, start_date) values (%1$L, ''ChangeEnclosure'', now())',
    'update resident_diets set start_date = start_date - 1 where id = %3$L',
    'update resident_diets set updated_at = now() - interval ''1 day'' where id = %3$L',
    'delete from resident_diets where id = %3$L',
    'insert into resident_diets (resident_id, diet_id, start_date) select %1$L, diet_id, start_date from resident_diets where id = %3$L',
    'update weight set date = date - 1 where id = %4$L',
    'update weight set weight_kg = 9 where id = %4$L',
    'delete from weight where id = %4$L',
    'insert into weight (resident_id, date, weight_kg) values (%1$L, current_date, 5)'];
begin
  select id into v_life from zones where name = 'Lifecycle';
  select id into v_deadenc from enclosures where zone_id = v_life and name = 'Deceased';
  select e.id into v_enc from enclosures e where e.zone_id <> v_life order by e.name limit 1;
  select e.id into v_enc2 from enclosures e where e.zone_id <> v_life and e.id <> v_enc order by e.name limit 1;
  select id into v_diet from diets limit 1;

  -- a resident: intake 10 days ago, moved 5 days ago, died 2 days ago
  insert into residents (name, intake_date) values ('harness-0307 dead', v_today - 10) returning id into v_dead;
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
    select v_dead, 'Intake', (v_today - 10)::timestamptz, e.zone_id, v_enc from enclosures e where e.id = v_enc;
  insert into resident_diets (resident_id, diet_id, start_date) values (v_dead, v_diet, v_today - 10);
  insert into weight (resident_id, date, weight_kg) values (v_dead, v_today - 10, 5) returning id into v_wid;
  insert into weight (resident_id, date, weight_kg) values (v_dead, v_today - 4, 6);
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    select v_dead, 'ChangeEnclosure', (v_today - 5)::timestamptz, e.zone_id, v_enc2, v_enc from enclosures e where e.id = v_enc2;
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (v_dead, 'Deceased', (v_today - 2)::timestamptz, v_life, v_deadenc, v_enc2);
  if not resident_is_deceased(v_dead) then raise exception 'SETUP resident is not deceased'; end if;
  select id into v_did from resident_diets where resident_id = v_dead;
  select id into v_pid from placement_history where resident_id = v_dead and placement_type = 'Intake';

  -- ===== DIRECTION 2 FIRST (the one that matters): the lock still refuses everything else, flag off AND flag on.
  -- Run as the table owner so RLS cannot be what refuses: the trigger is under test. Each must raise restrict_violation.
  foreach v_flag in array array['', 'on'] loop
    perform set_config('app.intake_date_correction_lock', v_flag, true);
    v_i := 0;
    foreach v_stmt in array v_cases loop
      v_i := v_i + 1;
      -- with the flag on, the pure single-column moves (cases 2, 5, 9, 13) are the opening itself: proved in direction 1
      if v_flag = 'on' and v_i in (2, 5, 9, 13) then continue; end if;
      begin
        execute format(v_stmt, v_dead, v_pid, v_did, v_wid);
        raise exception 'FAIL D2 flag=% case % was accepted', v_flag, v_i;
      exception when restrict_violation then v_ok := v_ok + 1;
      end;
    end loop;
  end loop;
  perform set_config('app.intake_date_correction_lock', '', true);
  v_report := v_report || ' | D2 ' || v_ok || ' writes refused (16 with the flag off, 12 with it on: other columns, inserts, deletes)';

  -- ===== DIRECTION 1: a login holding correct_intake_date corrects a deceased resident's intake date
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'card'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform correct_intake_date(v_dead, v_today - 12);
  reset role;
  if (select intake_date from residents where id = v_dead) <> v_today - 12 then raise exception 'FAIL D1 intake_date not moved'; end if;
  if shelter_date((select start_date from placement_history where id = v_pid)) <> v_today - 12 then raise exception 'FAIL D1 intake placement not moved'; end if;
  if (select start_date from resident_diets where id = v_did) <> v_today - 12 then raise exception 'FAIL D1 diet not moved'; end if;
  if (select date from weight where id = v_wid) <> v_today - 12 then raise exception 'FAIL D1 weight not moved'; end if;
  if (select date from weight where resident_id = v_dead and weight_kg = 6) <> v_today - 4 then raise exception 'FAIL D1 a later weight moved'; end if;
  if coalesce(current_setting('app.intake_date_correction_lock', true), '') <> '' then raise exception 'FAIL D1 flag left on'; end if;
  v_report := v_report || ' | D1 card login moved intake date, intake placement, diet and weight on a deceased resident; later weight untouched; flag reset';

  -- the closed record is closed again straight after, in the same transaction
  begin
    update residents set intake_date = intake_date - 1 where id = v_dead;
    raise exception 'FAIL D3 lock open after the correction';
  exception when restrict_violation then null;
  end;
  v_report := v_report || ' | D3 lock closed again after the call';

  -- ===== a login WITHOUT the card is refused
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'none'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform correct_intake_date(v_dead, v_today - 13);
    reset role; raise exception 'FAIL D4 login without the card corrected a deceased intake date';
  exception when sqlstate '42501' then null;
  end;
  reset role;
  if (select intake_date from residents where id = v_dead) <> v_today - 12 then raise exception 'FAIL D4 date changed'; end if;
  v_report := v_report || ' | D4 login without the card refused (42501), nothing changed';

  -- ===== a living resident still works (no regression of 0302)
  insert into residents (name, intake_date) values ('harness-0307 live', v_today - 3) returning id into v_live;
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'card'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform correct_intake_date(v_live, v_today - 4);
  reset role;
  if (select intake_date from residents where id = v_live) <> v_today - 4 then raise exception 'FAIL D5 living resident not corrected'; end if;
  v_report := v_report || ' | D5 living resident still corrected';

  raise exception 'HARNESS-OK 0307 (live)%', v_report;
end $$;
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
