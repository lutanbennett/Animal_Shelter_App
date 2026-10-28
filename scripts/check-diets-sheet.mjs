// diets-sheet-schema (0242): a recipe made since recipes reaches the Feed Special Diets sheet and intake.
// Dev only, one transaction, always rolled back.   node scripts/check-diets-sheet.mjs
//   Diabetic (2 ingredients, not standard) -> record_intake(p_diet_id) -> special_diet_list has one row per
//   ingredient at the resident's size times portion_factor; the Standard diet stays off the sheet; picker_diets lists both.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const harness = `
begin;
create temp table res (k text, v text);
grant all on res to authenticated;
do $h$
declare
  v_admin uuid; v_a uuid; v_b uuid; v_diet uuid; v_std uuid; v_res uuid; v_n bigint; v_q text; v_pick bigint;
begin
  v_admin := gen_random_uuid();
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-diets-seed-' || v_admin || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());
  insert into user_roles (user_id, role_id) select v_admin, id from roles where key = 'admin';
  -- 0239: diet_types is the ingredient list now; a recipe is a diets row with servings per size, and each ingredient carries qty_per_serving.
  insert into diet_types (name) values ('ZZ pumpkin') returning id into v_a;
  insert into diet_types (name) values ('ZZ turkey') returning id into v_b;
  insert into diets (name, servings_small, servings_medium, servings_large) values ('ZZ Diabetic', 1, 2, 3) returning id into v_diet;
  insert into diet_ingredients (diet_id, diet_type_id, qty_per_serving) values (v_diet, v_a, 0.1), (v_diet, v_b, 0.25);
  select id into v_std from diets where is_standard;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select (record_intake(p_name => 'ZZ Sheet Pup', p_intake_date => shelter_today(), p_size => 'Medium', p_diet_id => v_diet)).id into v_res;
  update resident_diets set portion_factor = 0.5, meals_per_day = 2 where resident_id = v_res;
  select count(*) into v_n from special_diet_list where resident_id = v_res and diet_id = v_diet;
  select string_agg(ingredient_name || '=' || daily_quantity, ',' order by ingredient_name) into v_q from special_diet_list where resident_id = v_res;
  select count(*) into v_pick from picker_diets where id in (v_diet, v_std);
  begin
    perform record_intake(p_name => 'ZZ no diet', p_intake_date => shelter_today());
    insert into res values ('nodiet', 'accepted');
  exception when others then insert into res values ('nodiet', 'refused'); end;
  reset role;
  insert into res values ('rows', v_n::text), ('qty', v_q), ('picker', v_pick::text);
  insert into res values ('std_on_sheet', (select count(*) from special_diet_list where diet_id = v_std)::text);
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
let fails = 0;
const check = (ok, what) => { if (!ok) fails++; console.log(`${ok ? "ok   " : "FAIL "} ${what}`); };
console.log("sheet rows:", get("qty"));
check(get("rows") === "2", "the new recipe gives one sheet row per ingredient");
// numeric scale is the view's business (0.10, 0.250), so compare the numbers: 0.1 and 0.25 per serving x 2 servings (Medium) x portion 0.5
check((get("qty") ?? "").split(",").map((p) => p.split("=").map((x, i) => (i ? Number(x) : x)).join("=")).join(",") === "ZZ pumpkin=0.1,ZZ turkey=0.25", "medium size times portion 0.5");
check(get("picker") === "2" || get("picker") === "1", "picker_diets lists the new diet (and Standard if one is set)");
check(get("std_on_sheet") === "0", "Standard stays off the special diets sheet");
check(get("nodiet") === "refused", "intake without a diet is refused");
console.log(fails ? "\nRESULT: RED" : "\nRESULT: GREEN");
process.exitCode = fails ? 1 : 0;
