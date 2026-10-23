// units-schema (0252): reads, write gate, legacy rows survive, unknown / archived / wrong-list units refused.
// Against DEV only, one transaction that is always rolled back; applies 0252's text inside it.
//
//   node scripts/check-units-schema.mjs            (from the repo root; dev only)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const migration = readFileSync("supabase/migrations/0252_units_of_measure_are_data.sql", "utf8");

const harness = `
begin;
create temp table res (k text, v text);
grant all on res to authenticated;
${migration}
do $t$
declare v_admin uuid; v_vol uuid; n int; v_id uuid;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id where r.key = 'admin' and ur.archived_at is null limit 1;
  select ur.user_id into v_vol from user_roles ur join roles r on r.id = ur.role_id where r.key = 'volunteer' and ur.archived_at is null limit 1;
  insert into res select 'seed_ingredient_units', count(*)::text from units where for_ingredients;
  insert into res select 'each_is_ingredient_only', (for_ingredients and not for_medicines)::text from units where name = 'each';

  -- legacy row: a free-text unit nobody has in the table still saves when untouched
  insert into diet_types (name, unit) values ('H-legacy', 'g');
  alter table diet_types disable trigger diet_types_check_unit;
  update diet_types set unit = 'scoop' where name = 'H-legacy';
  alter table diet_types enable trigger diet_types_check_unit;
  update diet_types set cost_per_unit = 5 where name = 'H-legacy';
  insert into res values ('legacy_row_still_saves', 'ok');

  begin insert into diet_types (name, unit) values ('H-bad', 'nonesuch'); insert into res values ('unknown_unit_refused', 'NOT refused');
  exception when others then insert into res values ('unknown_unit_refused', 'ok'); end;
  begin insert into diet_types (name, unit) values ('H-med', 'tablet'); insert into res values ('wrong_list_refused', 'NOT refused');
  exception when others then insert into res values ('wrong_list_refused', 'ok'); end;
  insert into diet_types (name, unit) values ('H-egg', 'EACH');
  insert into res values ('each_accepted', 'ok');
  begin insert into medication (name, dose_unit) values ('H-med2', 'cup'); insert into res values ('med_wrong_list_refused', 'NOT refused');
  exception when others then insert into res values ('med_wrong_list_refused', 'ok'); end;

  -- archived: stays on rows already using it, refused for new ones
  update units set archived_at = now() where name = 'portion';
  insert into diet_types (name, unit) values ('H-old', 'g'); alter table diet_types disable trigger diet_types_check_unit;
  update diet_types set unit = 'portion' where name = 'H-old'; alter table diet_types enable trigger diet_types_check_unit;
  update diet_types set cost_per_unit = 7 where name = 'H-old';
  insert into res values ('archived_unit_stays_on_row', 'ok');
  begin insert into diet_types (name, unit) values ('H-new', 'portion'); insert into res values ('archived_refused_for_new', 'NOT refused');
  exception when others then insert into res values ('archived_refused_for_new', 'ok'); end;

  -- access
  perform set_config('request.jwt.claims', json_build_object('sub', v_vol, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select count(*) into n from units;
  insert into res values ('volunteer_reads', (n > 0)::text);
  begin insert into units (name, for_ingredients) values ('H-nope', true); insert into res values ('volunteer_write_refused', 'NOT refused');
  exception when others then insert into res values ('volunteer_write_refused', 'ok'); end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin insert into units (name, for_ingredients) values ('H-pinch', true); insert into res values ('admin_write', 'ok');
  exception when others then insert into res values ('admin_write', sqlerrm); end;
  reset role;
end $t$;
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
let bad = 0;
for (const r of rows) { const ok = r.v === "ok" || r.v === "true" || /^\d+$/.test(r.v); if (!ok) bad++; console.log(`${ok ? "ok  " : "FAIL"} ${r.k}: ${r.v}`); }
if (bad) { console.error(`${bad} failed`); process.exit(1); }
