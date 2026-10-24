// diets-readers-per-serving (0258): the feeding sheet's figures do not move, and the bridge cannot blank a recipe.
// Against DEV only, one transaction that is always rolled back; it applies 0258's own text inside that
// transaction, so it works before and after the file is applied for real.
//
//   node scripts/check-diets-readers-per-serving.mjs            (from the repo root; dev only)
//
//   before/after  special_diet_list rows are captured, 0258 runs, and every row is compared: a line in the
//                 1 : 1.5 : 2 proportion must give the same daily_quantity; a line out of proportion is listed
//                 (it now follows qty_per_serving, which is the point of the chain)
//   columns       the view keeps its columns and their order
//   nullable      qty_small / medium / large accept NULL, and their CHECKs are still there
//   bridge        an update setting qty_small to NULL leaves qty_per_serving untouched; an edit to Small still re-derives it
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync("supabase/migrations/0258_diets_readers_per_serving.sql", "utf8");

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

-- A fixture so there is always something to compare: a special diet in exact proportion on a live dog.
do $fx$
declare rd record; v_diet uuid; v_k uuid;
begin
  select x.* into rd from resident_diets x
    join residents r on r.id = x.resident_id
    join resident_current_state s on s.resident_id = x.resident_id
   where s.current_status not in ('Deceased', 'Adopted', 'Fostered') and x.end_date is null
   order by x.start_date limit 1;
  if rd.id is null then insert into res values ('fixture_skipped', 'no live resident_diets row'); return; end if;
  insert into diet_types (name, unit, cost_per_unit) select 'H2-kibble', unit, 50 from diet_types limit 1 returning id into v_k;
  insert into diets (name) values ('H2-exact') returning id into v_diet;
  insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_small, qty_medium, qty_large)
    values (v_diet, v_k, null, 2, 3, 4);
  update resident_diets set diet_id = v_diet, start_date = least(start_date, shelter_today()) where id = rd.id;
  insert into res values ('fixture_diet', v_diet::text);
end $fx$;

create temp table before_rows as select * from special_diet_list;
create temp table before_cols as
  select a.attname, a.attnum from pg_attribute a where a.attrelid = 'special_diet_list'::regclass and a.attnum > 0 and not a.attisdropped;

${migration}

do $cmp$
declare v_diet uuid; v_cols_before text; v_cols_after text;
begin
  insert into res select 'rows_before', count(*)::text from before_rows;
  insert into res select 'rows_after', count(*)::text from special_diet_list;
  insert into res
    select 'moved_in_proportion', count(*)::text
      from before_rows b
      join special_diet_list a on a.resident_diet_id = b.resident_diet_id and a.diet_type_id = b.diet_type_id
      join diet_ingredients di on di.diet_id = a.diet_id and di.diet_type_id = a.diet_type_id
      join diets d on d.id = di.diet_id
     where abs(a.daily_quantity - b.daily_quantity) > 1e-9
       and abs(di.qty_medium - d.servings_medium / d.servings_small * di.qty_small) <= 0.005
       and abs(di.qty_large - d.servings_large / d.servings_small * di.qty_small) <= 0.005;
  insert into res
    select 'unmatched_rows', count(*)::text
      from before_rows b full join special_diet_list a
        on a.resident_diet_id = b.resident_diet_id and a.diet_type_id = b.diet_type_id
     where a.resident_diet_id is null or b.resident_diet_id is null;
  insert into res
    select 'other_columns_changed', count(*)::text
      from before_rows b join special_diet_list a on a.resident_diet_id = b.resident_diet_id and a.diet_type_id = b.diet_type_id
     where (to_jsonb(a) - 'daily_quantity') is distinct from (to_jsonb(b) - 'daily_quantity');
  insert into res
    select 'moved_out_of_proportion', coalesce(json_agg(json_build_object('diet', a.diet_name, 'ingredient', a.ingredient_name,
             'was', b.daily_quantity, 'now', a.daily_quantity)), '[]')::text
      from before_rows b
      join special_diet_list a on a.resident_diet_id = b.resident_diet_id and a.diet_type_id = b.diet_type_id
     where abs(a.daily_quantity - b.daily_quantity) > 1e-9;
  select string_agg(attname, ',' order by attnum) into v_cols_before from before_cols;
  select string_agg(a.attname, ',' order by a.attnum) into v_cols_after
    from pg_attribute a where a.attrelid = 'special_diet_list'::regclass and a.attnum > 0 and not a.attisdropped;
  insert into res values ('columns_same', (v_cols_before = v_cols_after)::text);

  insert into res select 'not_null_left', count(*)::text from information_schema.columns
   where table_name = 'diet_ingredients' and table_schema = 'public'
     and column_name in ('qty_small', 'qty_medium', 'qty_large') and is_nullable = 'NO';
  insert into res select 'checks_left', count(*)::text from pg_constraint
   where conrelid = 'diet_ingredients'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ~ 'qty_(small|medium|large) >';

  v_diet := (select v::uuid from res where k = 'fixture_diet');
  if v_diet is not null then
    insert into res select 'serving_filled', qty_per_serving::text from diet_ingredients where diet_id = v_diet;
    update diet_ingredients set qty_small = null where diet_id = v_diet;
    insert into res select 'bridge_blank', coalesce(qty_per_serving::text, 'NULL') from diet_ingredients where diet_id = v_diet;
    update diet_ingredients set qty_small = null, qty_medium = null, qty_large = null where diet_id = v_diet;
    insert into res select 'bridge_all_null', coalesce(qty_per_serving::text, 'NULL') from diet_ingredients where diet_id = v_diet;
    update diet_ingredients set qty_small = 5 where diet_id = v_diet;
    insert into res select 'bridge_edit', qty_per_serving::text from diet_ingredients where diet_id = v_diet;
  end if;
end $cmp$;

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

let fails = 0, ok = 0;
const check = (k, want, what) => {
  const v = get(k);
  if (v === want || (v !== undefined && !isNaN(Number(v)) && !isNaN(Number(want)) && Number(v) === Number(want))) { ok++; console.log(`ok    ${what} (${v})`); } else { fails++; console.log(`FAIL  ${what} - got ${v}`); }
};
console.log(`feeding sheet: ${get("rows_before")} row(s) before, ${get("rows_after")} after`);
check("unmatched_rows", "0", "the same rows appear before and after");
check("other_columns_changed", "0", "every column other than daily_quantity is unchanged");
check("columns_same", "true", "the view keeps its columns and their order");
check("moved_in_proportion", "0", "no daily_quantity moves for a line in proportion");
check("not_null_left", "0", "qty_small / medium / large accept NULL");
check("checks_left", "3", "the three CHECK (qty_x > 0) constraints are still there");
if (get("fixture_skipped")) console.log(`NOTE  fixture and bridge checks skipped: ${get("fixture_skipped")}`);
else {
  check("serving_filled", "2", "the fixture line got qty_per_serving 2");
  check("bridge_blank", "2", "blanking qty_small leaves qty_per_serving untouched");
  check("bridge_all_null", "2", "blanking all three leaves qty_per_serving untouched");
  check("bridge_edit", "5", "an edit to Small still re-derives the serving");
}
const out = JSON.parse(get("moved_out_of_proportion") ?? "[]");
console.log(`\n${out.length} line(s) moved (out of proportion, so they now follow qty_per_serving; each is Lutan's call):`);
for (const o of out) console.log(`  ${o.diet} / ${o.ingredient}: was ${o.was}, now ${o.now}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
