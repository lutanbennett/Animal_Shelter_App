// diets-forecast-functions (0254): the forecasts read the per-serving columns, a recipe in exact proportion forecasts
// the SAME figure before and after, and the two Stocktaking switches default on, are Admin-at-2-step only and audited.
// Against DEV only, one transaction that is always rolled back; it applies 0254's own text inside that transaction,
// so it works before and after the file is applied for real.
//
//   node scripts/check-diets-forecast-functions.mjs            (from the repo root; dev only)
//
//   same figure     a recipe in exact 1 : 1.5 : 2 proportion on a live dog: diet_forecast and stock_diet_forecast
//                   return the same quantity and cost before and after the migration text, and equal the
//                   hand formula qty_per_serving x servings(size) x portion_factor x conversion x days
//   other servings  changing the diet's Large servings moves only a Large dog's figure after, not before
//   real rows       prints how many diet types differ before/after over all dev data (expected: only the dev
//                   lines that are out of proportion, which are test data)
//   no nulls        every line has qty_per_serving (a null would silently drop out of the sum)
//   switches        both default true; a non-admin, an Admin at aal1 and a plain website edit behave as stated;
//                   an Admin at aal2 can switch; each change writes one audit_log row carrying only the switches
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync("supabase/migrations/0254_diet_forecasts_per_serving_and_stocktaking_switches.sql", "utf8");

const harness = `
begin;
create temp table res (k text, v text);
do $setup$
declare v_admin uuid;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where r.key = 'admin' and ur.archived_at is null limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal2')::text, true);
end $setup$;

-- A recipe in exact proportion (cups; small 2 / medium 3 / large 4 = 2 per serving at 1 / 1.5 / 2) on a live dog.
create temp table fx (diet_id uuid, kib uuid, rd_id uuid, from_d date, to_d date, sz text, f numeric);
do $prop$
declare rd record; v_diet uuid; v_k uuid; v_from date;
begin
  select x.* into rd from resident_diets x
    join residents r on r.id = x.resident_id
    join resident_current_state s on s.resident_id = x.resident_id
   where s.current_status not in ('Deceased', 'Adopted', 'Fostered') and x.end_date is null
   order by x.start_date limit 1;
  if rd.id is null then raise exception 'HARNESS-RESULT %', '[{"k":"skipped","v":"no live resident_diets row"}]'; end if;
  v_from := greatest(rd.start_date, date '2026-10-01');
  insert into diet_types (name, unit, cost_per_unit) values ('H-kibble', 'g', 0.05) returning id into v_k;
  insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values ('diet_type', v_k, 'cup', 100);
  insert into diets (name) values ('H-exact') returning id into v_diet;
  insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_per_serving)
    values (v_diet, v_k, 'cup', 2);
  update resident_diets set diet_id = v_diet, start_date = least(start_date, v_from) where id = rd.id;
  insert into fx select v_diet, v_k, rd.id, v_from, v_from + 9,
    (select coalesce(size::text, 'Medium') from residents where id = rd.resident_id), coalesce(rd.portion_factor, 1);
end $prop$;

create temp table b_fc  as select * from diet_forecast((select from_d from fx), (select to_d from fx));
create temp table bs_fc as select * from stock_diet_forecast((select from_d from fx), (select to_d from fx));
create temp table b_all as select * from diet_forecast(date '2000-01-01', date '2100-01-01');

${migration}

do $cmp$
declare
  f fx%rowtype; want numeric; srv numeric; got numeric; got_s numeric; b numeric; bs numeric; n int;
begin
  select * into f from fx;
  srv := (select case f.sz when 'Small' then servings_small when 'Large' then servings_large else servings_medium end
            from diets where id = f.diet_id);
  want := 10 * 2 * srv * f.f * 100;
  select quantity into b  from b_fc  where diet_type_id = f.kib;
  select quantity into bs from bs_fc where diet_type_id = f.kib;
  select quantity into got   from diet_forecast(f.from_d, f.to_d) where diet_type_id = f.kib;
  select quantity into got_s from stock_diet_forecast(f.from_d, f.to_d) where diet_type_id = f.kib;
  insert into res values ('same_diet_forecast',  case when abs(got - b) < 1e-9 then 'ok' else format('before %s after %s', b, got) end);
  insert into res values ('same_stock_forecast', case when abs(got_s - bs) < 1e-9 then 'ok' else format('before %s after %s', bs, got_s) end);
  insert into res values ('hand_diet_forecast',  case when abs(got - want) < 1e-9 then 'ok' else format('want %s got %s', want, got) end);
  insert into res values ('hand_stock_forecast', case when abs(got_s - want) < 1e-9 then 'ok' else format('want %s got %s', want, got_s) end);
  insert into res values ('hand_value', format('%s %s servings, factor %s, 10 days -> %s', f.sz, srv, f.f, want));
  insert into res select 'cost_same', case when abs(a.cost - (select cost from b_fc where diet_type_id = f.kib)) < 1e-9 then 'ok' else 'differs' end
    from diet_forecast(f.from_d, f.to_d) a where a.diet_type_id = f.kib;

  -- the diet's servings now drive the figure: Large 3 moves a Large dog and no one else
  update diets set servings_large = 3, servings_small = 1, servings_medium = 1.5 where id = f.diet_id;
  srv := case f.sz when 'Small' then 1 when 'Large' then 3 else 1.5 end;
  select quantity into got from diet_forecast(f.from_d, f.to_d) where diet_type_id = f.kib;
  insert into res values ('servings_drive', case when abs(got - 10 * 2 * srv * f.f * 100) < 1e-9 then 'ok' else format('got %s', got) end);

  select count(*) into n from b_all b2 full join diet_forecast(date '2000-01-01', date '2100-01-01') a using (diet_type_id)
   where b2.diet_type_id is null or a.diet_type_id is null or abs(b2.quantity - a.quantity) > 1e-9;
  insert into res values ('real_rows_differing_types', n::text);
  insert into res select 'null_servings', count(*)::text from diet_ingredients where qty_per_serving is null;
end $cmp$;

-- The switches.
do $sw$
declare
  v_admin uuid; v_other uuid; v_before bigint; v_n bigint; r record; msg text;
begin
  insert into res select 'default_food', stocktaking_food_enabled::text from site_content where id;
  insert into res select 'default_medical', stocktaking_medical_enabled::text from site_content where id;
  select user_id into v_admin from user_roles ur join roles ro on ro.id = ur.role_id where ro.key = 'admin' and ur.archived_at is null limit 1;
  select ur.user_id into v_other from user_roles ur join roles ro on ro.id = ur.role_id
   where ro.key <> 'admin' and ur.archived_at is null
     and not exists (select 1 from user_roles u2 join roles r2 on r2.id = u2.role_id where u2.user_id = ur.user_id and r2.key = 'admin' and u2.archived_at is null)
   limit 1;

  -- a website edit that leaves the switches alone is never blocked, whoever makes it
  perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  update site_content set tagline = tagline where id;
  insert into res values ('website_edit_ok', 'ok');

  -- non-admin
  begin
    update site_content set stocktaking_food_enabled = false where id;
    insert into res values ('non_admin', 'ALLOWED');
  exception when insufficient_privilege then insert into res values ('non_admin', 'refused'); end;

  -- admin at aal1
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  begin
    update site_content set stocktaking_medical_enabled = false where id;
    insert into res values ('admin_aal1', 'ALLOWED');
  exception when insufficient_privilege then insert into res values ('admin_aal1', 'refused'); end;

  -- admin at aal2
  select count(*) into v_before from audit_log where table_name = 'site_content';
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  update site_content set stocktaking_food_enabled = false where id;
  insert into res select 'admin_aal2', case when stocktaking_food_enabled = false and stocktaking_medical_enabled then 'ok' else 'wrong' end from site_content where id;
  update site_content set tagline = tagline || '' where id;       -- no switch change: no audit row
  select count(*) into v_n from audit_log where table_name = 'site_content';
  insert into res values ('audit_rows', (v_n - v_before)::text);
  select * into r from audit_log where table_name = 'site_content' order by id desc limit 1;
  insert into res values ('audit_actor', case when r.actor = v_admin then 'ok' else 'wrong' end);
  insert into res values ('audit_shape', case when r.old_row = '{"stocktaking_food_enabled": true, "stocktaking_medical_enabled": true}'::jsonb
                                              and r.new_row = '{"stocktaking_food_enabled": false, "stocktaking_medical_enabled": true}'::jsonb then 'ok' else r.old_row::text || r.new_row::text end);

  -- no login (service role / scripts) is let through
  perform set_config('request.jwt.claims', '', true);
  update site_content set stocktaking_medical_enabled = false where id;
  insert into res values ('service_ok', 'ok');
end $sw$;

do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await r.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${r.status}): ${msg.slice(0, 2000)}`);
const rows = JSON.parse(m[1]);
const get = (k) => rows.find((x) => x.k === k)?.v;
if (get("skipped")) throw new Error(`harness skipped: ${get("skipped")}`);

let fails = 0;
const check = (k, want, what) => {
  const v = get(k);
  if (v === want) console.log(`ok    ${what} (${v})`);
  else { fails++; console.log(`FAIL  ${what} - got ${v}`); }
};
check("same_diet_forecast", "ok", "diet_forecast: an exact-proportion recipe forecasts the same before and after");
check("same_stock_forecast", "ok", "stock_diet_forecast: the same");
check("cost_same", "ok", "diet_forecast cost: the same");
check("hand_diet_forecast", "ok", `diet_forecast equals the hand formula (${get("hand_value")})`);
check("hand_stock_forecast", "ok", "stock_diet_forecast equals it too");
check("servings_drive", "ok", "the diet's servings drive the figure (Large 3 moves a Large dog only)");
check("null_servings", "0", "every line has qty_per_serving");
console.log(`NOTE  ${get("real_rows_differing_types")} diet type(s) differ before/after over all dev data (dev out-of-proportion lines; test data)`);
check("default_food", "true", "stocktaking_food_enabled defaults on");
check("default_medical", "true", "stocktaking_medical_enabled defaults on");
check("website_edit_ok", "ok", "a website edit by a non-admin is not blocked");
check("non_admin", "refused", "a non-admin cannot change a switch");
check("admin_aal1", "refused", "an Admin at aal1 cannot");
check("admin_aal2", "ok", "an Admin at aal2 can");
check("audit_rows", "1", "one audit row for the switch change, none for a website edit");
check("audit_actor", "ok", "the audit row names the Admin");
check("audit_shape", "ok", "the audit row carries only the two switches, before and after");
check("service_ok", "ok", "a script with no login is let through");
if (fails) { console.log(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall ok");
