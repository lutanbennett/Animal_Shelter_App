// diets-app: the number the item exists for. Splitting the Standard diet into kibble, chicken and rice cuts the
// month's kibble need to a quarter, and chicken and rice appear in the forecast Purchasing reads.
// Against DEV only, one transaction that is always rolled back.
//
//   node scripts/check-diets-app.mjs            (from the repo root; dev only)
//
//   split      Standard's one ingredient (today: all of it is "kibble") becomes kibble 1/4, chicken 3/8, rice 3/8
//              of the same daily amount, for every size. 4 cups a day -> 1 cup kibble + 1.5 cup chicken + 1.5 cup rice.
//   proves     kibble need after = 25% of before; chicken and rice rows exist; the three together equal the old total
//   forecast   stock_diet_forecast (what Purchasing calls) shows the same three ingredients
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const harness = `
begin;
create temp table res (k text, v text);
do $h$
declare
  v_admin uuid; v_diet uuid; v_kibble uuid; v_chicken uuid; v_rice uuid; v_unit text;
  b_qty numeric; b_res bigint; a_k numeric; a_c numeric; a_r numeric; s_k numeric; s_c numeric; s_r numeric;
  v_from date := date '2026-10-01'; v_to date := date '2026-10-31';
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where r.key = 'admin' and ur.archived_at is null limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal1')::text, true);

  select d.id, di.diet_type_id, dt.unit into v_diet, v_kibble, v_unit
    from diets d join diet_ingredients di on di.diet_id = d.id join diet_types dt on dt.id = di.diet_type_id
   where d.is_standard limit 1;
  if v_diet is null then insert into res values ('skipped', 'no standard diet on dev'); return; end if;
  insert into res values ('unit', v_unit);

  select quantity, resident_count into b_qty, b_res from diet_forecast(v_from, v_to) where diet_type_id = v_kibble;
  insert into res values ('before_kibble', coalesce(b_qty, 0)::text);
  insert into res values ('residents_on_standard', coalesce(b_res, 0)::text);

  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large) values ('ZZ chicken', v_unit, 1, 1, 1) returning id into v_chicken;
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large) values ('ZZ rice', v_unit, 1, 1, 1) returning id into v_rice;
  -- the 0239 bridge gave each a same-named recipe; the app removes it, so does this
  delete from diets where name in ('ZZ chicken', 'ZZ rice');

  update diet_ingredients set qty_small = qty_small * 0.25, qty_medium = qty_medium * 0.25, qty_large = qty_large * 0.25
   where diet_id = v_diet and diet_type_id = v_kibble;
  insert into diet_ingredients (diet_id, diet_type_id, qty_small, qty_medium, qty_large)
    select v_diet, v_chicken, qty_small * 1.5, qty_medium * 1.5, qty_large * 1.5 from diet_ingredients where diet_id = v_diet and diet_type_id = v_kibble;
  insert into diet_ingredients (diet_id, diet_type_id, qty_small, qty_medium, qty_large)
    select v_diet, v_rice, qty_small * 1.5, qty_medium * 1.5, qty_large * 1.5 from diet_ingredients where diet_id = v_diet and diet_type_id = v_kibble;

  select quantity into a_k from diet_forecast(v_from, v_to) where diet_type_id = v_kibble;
  select quantity into a_c from diet_forecast(v_from, v_to) where diet_type_id = v_chicken;
  select quantity into a_r from diet_forecast(v_from, v_to) where diet_type_id = v_rice;
  select quantity into s_k from stock_diet_forecast(v_from, v_to) where diet_type_id = v_kibble;
  select quantity into s_c from stock_diet_forecast(v_from, v_to) where diet_type_id = v_chicken;
  select quantity into s_r from stock_diet_forecast(v_from, v_to) where diet_type_id = v_rice;
  insert into res values ('after_kibble', coalesce(a_k, 0)::text), ('after_chicken', coalesce(a_c, 0)::text), ('after_rice', coalesce(a_r, 0)::text);
  insert into res values ('stock_kibble', coalesce(s_k, 0)::text), ('stock_chicken', coalesce(s_c, 0)::text), ('stock_rice', coalesce(s_r, 0)::text);
end $h$;
do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 2000)}`);
const rows = JSON.parse(m[1]);
const get = (k) => rows.find((r) => r.k === k)?.v;
if (get("skipped")) { console.log(`SKIPPED: ${get("skipped")}`); process.exit(0); }

const n = (k) => Number(get(k));
const before = n("before_kibble");
let fails = 0;
const check = (ok, what) => { if (!ok) fails++; console.log(`${ok ? "ok   " : "FAIL "} ${what}`); };
console.log(`Standard on dev: ${get("residents_on_standard")} residents, unit ${get("unit")}, month of Oct 2026`);
console.log(`kibble need before the split: ${before}`);
console.log(`after: kibble ${n("after_kibble")}, chicken ${n("after_chicken")}, rice ${n("after_rice")}`);
check(before > 0, "there is a kibble need to compare");
check(Math.abs(n("after_kibble") - before * 0.25) < 1e-6, "kibble need falls to a quarter");
check(n("after_chicken") > 0 && n("after_rice") > 0, "chicken and rice appear in the forecast");
check(Math.abs(n("after_kibble") + n("after_chicken") + n("after_rice") - before) < 1e-6, "the three together equal the old total");
check(n("stock_kibble") === n("after_kibble") && n("stock_chicken") === n("after_chicken") && n("stock_rice") === n("after_rice"),
  "Purchasing's forecast (stock_diet_forecast) shows the same three ingredients");
console.log(fails ? "\nRESULT: RED" : "\nRESULT: GREEN");
process.exitCode = fails ? 1 : 0;
