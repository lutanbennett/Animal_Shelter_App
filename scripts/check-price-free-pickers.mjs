// price-free-pickers (0151): the medicine and diet pickers read picker_medications / picker_diet_types, and the
// medication and diet_types read policies no longer carry reference.add_while_recording or resident.register.
// Against DEV only, one transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-price-free-pickers.mjs            (from the repo root; dev only)
//   node scripts/check-price-free-pickers.mjs --verbose  (also list every case)
//
// Per principal, 1 = the statement saw or changed a row, 0 = refused:
//   table read   select from medication / diet_types (what carries cost_per_unit)
//   view read    select from picker_medications / picker_diet_types (id, name, unit, no price)
//   add          insert into medication, with no RETURNING (the add-while-recording path)
// The point: a role holding only the add cell or only the register cell reads the pickers and NOT the
// price tables; the cells that are meant to see prices (stock.medications, stock.diets) still read both. The doctor is
// unchanged on the tables (doctor_read_*, the doctor half of the Security item and C10).
// The doctor reads neither view on dev, which holds the Director's draft matrix (the doctor has no medical.prescriptions or
// medical.diet there); the 0132 seed gives the doctor both, and then the views admit it. See the decision file.
// Then sweeps: the two views expose exactly the columns the decision file lists, and neither select policy names
// the add cell or the register cell.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
const CUSTOM = {
  c_none: { cells: [] },
  c_med_read: { cells: [["stock.medications", 1]] },
  c_add: { cells: [["reference.add_while_recording", 2]] },
  c_diet_read: { cells: [["stock.diets", 1]] },
  c_register: { cells: [["resident.register", 2]] },
  c_vol_medical: {
    floor: "volunteer",
    cells: [["medical.prescriptions", 2], ["medical.diet", 2], ["stock.count", 2], ["stock.delivery", 2], ["stock.purchasing", 2]],
  },
};
// No staff principal: 0173 retired Staff and a live staff login can no longer be made; the custom roles below
// that borrowed staff as their floor borrow management now, so only their cells decide.
const REAL = ["admin", "management", "volunteer", "doctor"];
const P = [...REAL, "norole", ...Object.keys(CUSTOM)];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const MED = randomUUID(), DIET = randomUUID();

const PROBES = {
  med_table: `select 1 from medication where id = '${MED}'`,
  med_view: `select 1 from picker_medications where id = '${MED}'`,
  med_add: `insert into medication (id, name) values ('${randomUUID()}', 'Harness added med')`,
  diet_table: `select 1 from diet_types where id = '${DIET}'`,
  diet_view: `select 1 from picker_diet_types where id = '${DIET}'`,
};
// expected 1/0 per principal; anything not listed is 0
const EXPECT = {
  med_table: ["admin", "management", "doctor", "c_med_read"],
  med_view: ["admin", "management", "c_med_read", "c_add", "c_vol_medical"],
  med_add: ["admin", "management", "doctor", "c_add"],
  diet_table: ["admin", "management", "doctor", "c_diet_read"],
  diet_view: ["admin", "management", "c_diet_read", "c_register", "c_vol_medical"],
};

const probes = [];
for (const [name, q] of Object.entries(PROBES)) {
  for (const who of P) probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${name}', $q$${q}$q$);`);
}

const harness = `
begin;
create temp table res (who text, probe text, n bigint);
grant all on res to authenticated;
create function pg_temp.probe(p_who text, p_uid uuid, p_probe text, p_sql text) returns void language plpgsql as $f$
declare v bigint := -2;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
    begin
      execute p_sql; get diagnostics v = row_count;
    exception when insufficient_privilege then v := -1; when others then v := -2;
    end;
    reset role;
    raise exception using errcode = 'P0999', message = 'probe-rollback';
  exception when sqlstate 'P0999' then null;
  end;
  insert into res values (p_who, p_probe, v);
end $f$;

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-pfp-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into roles (key, name, kind, legacy_role, scope_residents, scope_contacts) values
    ${Object.entries(CUSTOM).map(([c, d]) => `('harness_pfp_${c}', 'Harness ${c}', 'custom', '${d.floor ?? "management"}', 'all', 'full')`).join(",\n    ")};
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r join (values
      ${Object.entries(CUSTOM).flatMap(([c, d]) => d.cells.map(([a, l]) => `('harness_pfp_${c}', '${a}', ${l})`)).join(",\n      ")}
    ) as v(rkey, act, lvl) on v.rkey = r.key;
  ${Object.keys(CUSTOM).map((c) => `insert into user_roles (user_id, role_id, role) select ${lit(ID[c])}, id, '${CUSTOM[c].floor ?? "management"}' from roles where key = 'harness_pfp_${c}';`).join("\n  ")}
  insert into medication (id, name, cost_per_unit) values (${lit(MED)}, 'Harness med', 12.5);
  insert into diet_types (id, name, cost_per_unit, daily_qty_small, daily_qty_medium, daily_qty_large) values (${lit(DIET)}, 'Harness diet', 3.5, 1, 1, 1);
end $setup$;

do $run$ begin
${probes.join("\n")}
end $run$;

do $sweep$ begin
  insert into res select 'sweep', 'medication_view_cols', count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'picker_medications' and column_name in ('id', 'name', 'dose_unit');
  insert into res select 'sweep', 'medication_view_extra', count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'picker_medications' and column_name not in ('id', 'name', 'dose_unit', 'name_th'); -- name_th: 0166, the Thai name, not a price
  insert into res select 'sweep', 'diet_view_cols', count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'picker_diet_types'
     and column_name in ('id', 'name', 'unit', 'daily_qty_small', 'daily_qty_medium', 'daily_qty_large', 'is_standard');
  insert into res select 'sweep', 'diet_view_extra', count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'picker_diet_types'
     and column_name not in ('id', 'name', 'unit', 'daily_qty_small', 'daily_qty_medium', 'daily_qty_large', 'is_standard', 'name_th'); -- name_th: 0166
  insert into res select 'sweep', 'select_names_add_or_register', count(*) from pg_policies
   where schemaname = 'public' and tablename in ('medication', 'diet_types') and cmd = 'SELECT'
     and (coalesce(qual, '') like '%add_while_recording%' or coalesce(qual, '') like '%resident.register%');
end $sweep$;
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
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 1500)}`);
const rows = JSON.parse(m[1]);
const get = (who, probe) => rows.find((r) => r.who === who && r.probe === probe)?.n;

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };
for (const probe of Object.keys(PROBES)) {
  for (const who of P) {
    const exp = EXPECT[probe].includes(who);
    const n = get(who, probe);
    const label = `${probe} as ${who}: ${exp ? "allowed" : "refused"}`;
    if (n === -2) fail(`${label} - the statement itself errored (-2); the fixture is wrong, not the policy`);
    else if ((n >= 1) === exp) pass(label);
    else fail(`${label} - got ${n}`);
  }
}
const sweep = (k) => get("sweep", k);
const eq = (k, want, what) => (sweep(k) === want ? pass(what) : fail(`${what} - got ${sweep(k)}`));
eq("medication_view_cols", 3, "picker_medications has id, name, dose_unit");
eq("medication_view_extra", 0, "picker_medications has no other column");
eq("diet_view_cols", 7, "picker_diet_types has its seven columns");
eq("diet_view_extra", 0, "picker_diet_types has no other column");
eq("select_names_add_or_register", 0, "neither select policy names the add cell or the register cell");
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (the pickers read without prices; only the price cells read the tables; the doctor is unchanged)");
process.exitCode = fails ? 1 : 0;
