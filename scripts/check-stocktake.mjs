// Rollback harness for 0088_record_stocktake.sql against DEV only.
// One transaction: the migration (twice), harness logins, calls to
// record_stocktake() as each of them, then a deliberate `raise exception`
// carrying the evidence — so nothing can commit.
//
//   node scripts/check-stocktake.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0088_record_stocktake.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

create temp table who (who text primary key, uid uuid);
insert into who values
  ('management', gen_random_uuid()), ('admin', gen_random_uuid()),
  ('staff', gen_random_uuid()), ('roleless', gen_random_uuid()), ('anon', null);
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0088-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from who where uid is not null;
insert into user_roles (user_id, role)
select uid, who::app_role from who where who in ('management', 'admin', 'staff');
grant select on who to authenticated, anon;

-- Call record_stocktake as a login (null = anon). Returns the result as
-- text, or 'ERR <sqlstate> <message>'. The call's writes are kept unless
-- it raised; the caller undoes them with its own sub-block.
create function pg_temp.as_login(p_who text, p_med jsonb, p_diet jsonb) returns text language plpgsql as $f$
declare v_uid uuid; v text;
begin
  select uid into v_uid from who where who = p_who;
  if v_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    set local role anon;
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
  end if;
  begin
    select row_to_json(r)::text into v from record_stocktake(p_med, p_diet) r;
  exception when others then v := 'ERR ' || sqlstate || ' ' || sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $h$
declare
  m1 uuid; m2 uuid; m3 uuid; d1 uuid;
  v text; v_n int;
  v_old_stock numeric; v_old_at timestamptz;
  v_report text := '';
  list jsonb;
begin
  select id into m1 from medication order by name limit 1;
  select id into m2 from medication order by name offset 1 limit 1;
  select id into m3 from medication order by name offset 2 limit 1;
  select id into d1 from diet_types order by name limit 1;
  if m3 is null or d1 is null then raise exception 'FAIL setup: need 3 medications and a diet type in dev'; end if;

  -- Plant an old count on m2 (to show re-saving the same figure restamps)
  -- and on m3 (the row left out of the list, which must not move).
  alter table medication disable trigger medication_stock_1_keep;
  alter table medication disable trigger medication_stock_2_stamp;
  update medication set stock_on_hand = 40, stock_counted_at = '2000-01-01' where id in (m2, m3);
  alter table medication enable trigger medication_stock_1_keep;
  alter table medication enable trigger medication_stock_2_stamp;

  list := jsonb_build_array(jsonb_build_object('id', m1, 'count', 12.5), jsonb_build_object('id', m2, 'count', 40));

  -- A. management saves two medications and a diet type in one call
  v := pg_temp.as_login('management', list, jsonb_build_array(jsonb_build_object('id', d1, 'count', 0)));
  if v not like '{"medication_updated":2,"diet_types_updated":1,"counted_at":%' then raise exception 'FAIL A: %', v; end if;
  v_report := v_report || ' | management: ' || v;
  select count(*) into v_n from medication where id in (m1, m2) and stock_counted_at = now();
  if v_n <> 2 then raise exception 'FAIL A: % of 2 medications stamped now()', v_n; end if;
  if (select stock_on_hand from medication where id = m1) <> 12.5 then raise exception 'FAIL A: m1 count not written'; end if;
  -- B. unchanged figure (m2, 40 → 40) restamped: a count that confirmed it
  if (select stock_counted_at from medication where id = m2) <> now() then raise exception 'FAIL B: same figure not restamped'; end if;
  -- C. zero is a count (out of stock), stamped the same instant
  if (select stock_on_hand from diet_types where id = d1) <> 0
     or (select stock_counted_at from diet_types where id = d1) <> now() then
    raise exception 'FAIL C: diet type zero count not written with the same stamp';
  end if;
  -- D. the unlisted row did not move
  select stock_on_hand, stock_counted_at into v_old_stock, v_old_at from medication where id = m3;
  if v_old_stock <> 40 or v_old_at <> '2000-01-01' then raise exception 'FAIL D: unlisted medication changed to % at %', v_old_stock, v_old_at; end if;

  -- E. admin may too; one list may be null
  v := pg_temp.as_login('admin', null, jsonb_build_array(jsonb_build_object('id', d1, 'count', 3)));
  if v not like '{"medication_updated":0,"diet_types_updated":1,%' then raise exception 'FAIL E admin: %', v; end if;
  v := pg_temp.as_login('admin', '[]', null);
  if v not like '{"medication_updated":0,"diet_types_updated":0,%' then raise exception 'FAIL E empty: %', v; end if;

  -- F. refusals — each must leave m1 as it was (12.5), even when a valid row came first
  foreach list in array array[
    jsonb_build_array(jsonb_build_object('id', m1, 'count', 99), jsonb_build_object('id', m2, 'count', null)),
    jsonb_build_array(jsonb_build_object('id', m1, 'count', 99), jsonb_build_object('id', m2)),
    jsonb_build_array(jsonb_build_object('id', m1, 'count', 99), jsonb_build_object('id', m2, 'count', '7')),
    jsonb_build_array(jsonb_build_object('id', m1, 'count', 99), jsonb_build_object('id', m2, 'count', -1)),
    jsonb_build_array(jsonb_build_object('id', m1, 'count', 99), jsonb_build_object('id', m1, 'count', 98)),
    jsonb_build_array(jsonb_build_object('id', m1, 'count', 99), jsonb_build_object('id', gen_random_uuid(), 'count', 1)),
    jsonb_build_array(jsonb_build_object('count', 99)),
    jsonb_build_array(jsonb_build_object('id', m1, 'count', 99), jsonb_build_object('id', 'not-a-uuid', 'count', 1)),
    jsonb_build_object('id', m1, 'count', 99)
  ] loop
    v := pg_temp.as_login('management', list, null);
    if v not like 'ERR P0001 %' then raise exception 'FAIL F: % was not refused cleanly: %', list, v; end if;
    if (select stock_on_hand from medication where id = m1) <> 12.5 then raise exception 'FAIL F: % wrote m1', list; end if;
    v_report := v_report || ' | ' || substr(v, 10, 60);
  end loop;
  -- a bad diet list stops the medication list in the same call
  v := pg_temp.as_login('management', jsonb_build_array(jsonb_build_object('id', m1, 'count', 99)),
                        jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'count', 1)));
  if v not like 'ERR P0001 %' or (select stock_on_hand from medication where id = m1) <> 12.5 then
    raise exception 'FAIL F: a bad diet list still wrote medication: %', v;
  end if;

  v := pg_temp.as_login('management', null,
                        jsonb_build_array(jsonb_build_object('id', d1, 'count', 1), jsonb_build_object('id', upper(d1::text), 'count', 2)));
  if v <> 'ERR P0001 The same diet type is listed twice.' then raise exception 'FAIL F: diet duplicate (case-insensitive id): %', v; end if;

  -- G. who is refused: staff and role-less by the function's own guard, anon by the grant
  v := pg_temp.as_login('staff', jsonb_build_array(jsonb_build_object('id', m1, 'count', 1)), null);
  if v <> 'ERR P0001 Not authorized to record a stocktake.' then raise exception 'FAIL G staff: %', v; end if;
  v := pg_temp.as_login('roleless', jsonb_build_array(jsonb_build_object('id', m1, 'count', 1)), null);
  if v <> 'ERR P0001 Not authorized to record a stocktake.' then raise exception 'FAIL G roleless: %', v; end if;
  v := pg_temp.as_login('anon', jsonb_build_array(jsonb_build_object('id', m1, 'count', 1)), null);
  if v not like 'ERR 42501 permission denied for function record_stocktake%' then raise exception 'FAIL G anon: %', v; end if;
  if (select stock_on_hand from medication where id = m1) <> 12.5 then raise exception 'FAIL G: a refused caller wrote m1'; end if;

  -- H. grants as written
  if has_function_privilege('anon', 'record_stocktake(jsonb, jsonb)', 'execute')
     or not has_function_privilege('authenticated', 'record_stocktake(jsonb, jsonb)', 'execute')
     or not has_function_privilege('service_role', 'record_stocktake(jsonb, jsonb)', 'execute') then
    raise exception 'FAIL H: grants not anon-no / authenticated-yes / service_role-yes';
  end if;

  raise exception 'HARNESS-OK file ran twice | A 2 meds + 1 diet in one call, all stamped now() | B same figure restamps | C zero is a count | D unlisted row untouched | E admin ok, null and [] lists ok | F refused, nothing written:% | bad diet list stops the meds | G staff and role-less refused by the guard, anon by the grant | H grants', v_report;
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
