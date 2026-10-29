// diets-recipes-schema: a recipe expands into its ingredients, in the ingredient's base unit.
// Restated 2026-10-29. It used to apply 0239's own text inside the transaction and compare the forecasts
// before and after (the back-fill changed nothing), plus the old-app bridge. RETIRED, reason: those proved a
// one-time migration that has long since run on every database, and the bridge triggers were dropped in 0243,
// so they cannot run and could never fail for a live reason. KEPT: recipe expansion through unit conversions
// and the unknown-unit refusal, now on the per-serving shape (0250/0260: qty_per_serving x diets.servings_*).
// Against DEV only, one transaction that is always rolled back.
//
//   node scripts/check-diets-recipes-schema.mjs            (from the repo root; dev only)
//
//   recipe   a three-ingredient recipe in cups, converted to g, expands to each ingredient's own line
//            in diet_forecast and stock_diet_forecast
//   guards   a serving unit with no conversion is refused
//   live     every resident_diets row points at a recipe
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const harness = `
begin;
create temp table res (k text, v text);
do $setup$
declare v_admin uuid;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where r.key = 'admin' and ur.archived_at is null limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal1')::text, true);
end $setup$;

insert into res select 'resident_diets_without_recipe', count(*)::text from resident_diets where diet_id is null;

-- Recipe expansion: re-point one live diet row at a new three-ingredient recipe in cups.
do $recipe$
declare
  rd record; v_diet uuid; v_k uuid; v_c uuid; v_r uuid;
  v_from date; v_to date; got numeric; want numeric; sz resident_size; f numeric; sv numeric;
begin
  select x.* into rd from resident_diets x
    join residents r on r.id = x.resident_id
    join resident_current_state s on s.resident_id = x.resident_id
   where s.current_status not in ('Deceased', 'Adopted', 'Fostered') and x.end_date is null
   order by x.start_date limit 1;
  if rd.id is null then insert into res values ('recipe_skipped', 'no live resident_diets row'); return; end if;
  select coalesce(size, 'Medium') into sz from residents where id = rd.resident_id;
  f := coalesce(rd.portion_factor, 1);
  sv := case sz when 'Small' then 1 when 'Large' then 3 else 2 end;
  v_from := greatest(rd.start_date, date '2026-10-01'); v_to := v_from + 9;

  insert into diet_types (name, unit, cost_per_unit)
    values ('H-kibble', 'g', 0.05), ('H-chicken', 'g', 0.12), ('H-rice', 'g', 0.03);
  select id into v_k from diet_types where name = 'H-kibble';
  select id into v_c from diet_types where name = 'H-chicken';
  select id into v_r from diet_types where name = 'H-rice';
  insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values
    ('diet_type', v_k, 'cup', 100), ('diet_type', v_c, 'cup', 150), ('diet_type', v_r, 'cup', 200);
  insert into diets (name, servings_small, servings_medium, servings_large) values ('H-standard', 1, 2, 3) returning id into v_diet;
  insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_per_serving) values
    (v_diet, v_k, 'cup', 1), (v_diet, v_c, 'cup', 1.5), (v_diet, v_r, 'CUP', 1.5);
  update resident_diets set diet_id = v_diet, start_date = least(start_date, v_from) where id = rd.id;

  select quantity into got from diet_forecast(v_from, v_to) where diet_type_id = v_k;
  want := 10 * sv * 1 * 100 * f;
  insert into res values ('recipe_kibble', case when abs(got - want) < 1e-9 then 'ok' else format('got %s want %s', got, want) end);
  select quantity into got from diet_forecast(v_from, v_to) where diet_type_id = v_c;
  want := 10 * sv * 1.5 * 150 * f;
  insert into res values ('recipe_chicken', case when abs(got - want) < 1e-9 then 'ok' else format('got %s want %s', got, want) end);
  select quantity into got from stock_diet_forecast(v_from, v_to) where diet_type_id = v_r;
  want := 10 * sv * 1.5 * 200 * f;
  insert into res values ('recipe_rice_stock', case when abs(got - want) < 1e-9 then 'ok' else format('got %s want %s', got, want) end);

  begin
    insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_per_serving)
      values (v_diet, v_k, 'scoop', 1);
    insert into res values ('unknown_unit_refused', 'NOT refused');
  exception when others then insert into res values ('unknown_unit_refused', 'ok');
  end;
end $recipe$;

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

let fails = 0, ok = 0;
const check = (k, want, what) => {
  const v = get(k);
  if (v === want) { ok++; console.log(`ok    ${what} (${v})`); } else { fails++; console.log(`FAIL  ${what} - got ${v}`); }
};
check("resident_diets_without_recipe", "0", "every resident diet points at a recipe");
for (const k of ["recipe_kibble", "recipe_chicken", "recipe_rice_stock", "unknown_unit_refused"]) check(k, "ok", k);
if (get("recipe_skipped")) console.log(`NOTE  recipe checks skipped: ${get("recipe_skipped")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
