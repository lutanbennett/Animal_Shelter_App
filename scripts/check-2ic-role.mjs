// 2ic-role (0143): the 2IC, the third configured role. Against DEV only, one transaction that is always
// rolled back, each login's own JWT.
//
//   node scripts/check-2ic-role.mjs            (from the repo root; dev only)
//   node scripts/check-2ic-role.mjs --verbose  (also list every passing check)
//
// Principals: the 2IC ("sic"), three synthetic one-cell roles built inside the transaction ("po" holds only
// stock.purchasing, "co" only stock.count, "dl" only stock.delivery), admin, management, staff, volunteer, a
// vet, and a login with no role. The three one-cell roles are the proof that the stock jobs are separable:
// each can read every figure its own job needs without being given the other two cells.
//   her screens   views, counts, conversions, receipts, the forecast wrappers and record_stocktake() answer her
//                 and answer each one-cell role for its own job only
//   her limits    no price (cost_per_unit is not in either view and not on the tables), no stock correction, no
//                 medication or diet write, no resident record, medical, contacts, money, job photo or job delete
//   her tasks     her own recurring tasks, and the maintenance board (0141's cells light 0141's policies)
//   controls      admin, management and staff still read and write what they did before; volunteer, vet and
//                 no role still read nothing
//   the cells     role_permissions of second_in_command are exactly the union of its jobs in jobs.ts
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { bundleOfRole } = await import(pathToFileURL(join(process.cwd(), "src/lib/permissions/jobs.ts")).href);

const lit = (id) => `'${id}'::uuid`;
const P = ["sic", "po", "co", "dl", "admin", "management", "staff", "volunteer", "vet", "norole"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), OWN = randomUUID(), ZONE = randomUUID(), JOB = randomUUID();
const RJ_MINE = randomUUID();

const NONE = Object.fromEntries(P.map((p) => [p, 0]));
const who = (...names) => ({ ...NONE, ...Object.fromEntries(names.map((n) => [n, 1])) });
const OLD = ["admin", "management", "staff"]; // the roles that read and wrote stock before this PR
const ANY_STOCK = who("sic", "po", "co", "dl", ...OLD); // any one of the three cells
const BUYERS = who("sic", "po", "dl", ...OLD); // stock.purchasing or stock.delivery
const DELIVERERS = who("sic", "dl", ...OLD); // stock.delivery
const COUNTERS = who("sic", "co", ...OLD); // stock.count
const PURCHASERS = who("sic", "po", "admin", "management"); // stock.purchasing (staff does not hold it)
const MANAGERS = who("admin", "management");
const ONLY_SIC = "sic-zero"; // only she is asserted, and she must reach nothing
const SIC_ONE = "sic-one"; // only she is asserted, and she must reach it (her cell comes from the Director's draft)

// [name, sql, expectation]
const probes = [
  // her screens: the figures
  ["stock_medications", `select 1 from stock_medications limit 1`, ANY_STOCK],
  ["stock_diet_types", `select 1 from stock_diet_types limit 1`, ANY_STOCK],
  ["stock_vendors", `select 1 from stock_vendors limit 1`, BUYERS],
  ["stock_counts", `select 1 from stock_counts limit 1`, ANY_STOCK],
  ["item_unit_conversions", `select 1 from item_unit_conversions limit 1`, ANY_STOCK],
  ["stock_receipts read", `select 1 from stock_receipts limit 1`, BUYERS],
  // her screens: the writes
  ["record a delivery (its unit is stamped)", `with i as (insert into stock_receipts (item_kind, medication_id, quantity) select 'medication', id, 1 from stock_medications limit 1 returning unit) select 1 from i where unit is not null`, DELIVERERS],
  ["delete a delivery", `delete from stock_receipts where id = (select id from stock_receipts limit 1)`, DELIVERERS],
  ["record_stocktake", `select * from record_stocktake('[]'::jsonb, '[]'::jsonb)`, COUNTERS],
  ["purchasing forecast, medicines", `select count(*) from stock_medication_forecast(current_date, current_date + 30)`, PURCHASERS],
  ["purchasing forecast, diets", `select count(*) from stock_diet_forecast(current_date, current_date + 30)`, PURCHASERS],
  // her limits: no price, and none of Management's stock work
  ["cost_per_unit, medicine view", `select cost_per_unit from stock_medications limit 1`, NONE],
  ["cost_per_unit, diet view", `select cost_per_unit from stock_diet_types limit 1`, NONE],
  ["daily quantities, diet view", `select daily_qty_small from stock_diet_types limit 1`, NONE],
  ["medication table", `select 1 from medication limit 1`, who(...OLD, "vet")],
  ["diet_types table", `select 1 from diet_types limit 1`, who(...OLD, "vet")],
  ["contacts", `select 1 from contacts limit 1`, who(...OLD)],
  ["correct a stock figure", `select record_stock_correction('medication', (select id from medication limit 1), 1)`, MANAGERS],
  ["change a stock figure directly", `update medication set stock_on_hand = 1 where id = (select id from medication limit 1)`, MANAGERS],
  ["add a medicine", `insert into medication (name, dose_unit) values ('probe', 'tablet')`, who("admin", "management", "staff", "vet")],
  ["change a conversion", `update item_unit_conversions set note = 'probe' where id = (select id from item_unit_conversions limit 1)`, MANAGERS],
  ["change a delivery", `update stock_receipts set note = 'probe' where id = (select id from stock_receipts limit 1)`, who()],  // 0145 (C8): no update policy on stock_receipts for anyone; a wrong delivery is deleted and recorded again
  // her limits: nothing outside the whiteboard
  ["residents", `select 1 from residents where id = '${R}'`, ONLY_SIC],
  ["resident_list_view", `select 1 from resident_list_view where resident_id = '${R}'`, ONLY_SIC],
  // RE-BASELINED 2026-10-06 (director-draft-apply): the draft ticks row 17 (weights) and 15 (prescribe) for the 2IC
  ["weight", `select 1 from weight where resident_id = '${R}'`, SIC_ONE],
  ["prescriptions", `select 1 from prescriptions where resident_id = '${R}'`, SIC_ONE],
  ["attachments", `select 1 from attachments limit 1`, who("sic", "vet", ...OLD)], // RE-BASELINED 2026-10-07 (0152): her maintenance.photos cell reads a job's attachments
  ["assistant_actions", `select 1 from assistant_actions limit 1`, ONLY_SIC],
  ["insert placement", `insert into placement_history (resident_id, placement_type, start_date) values ('${R}', 'SendToHospital', now() + interval '1 minute')`, ONLY_SIC],
  ["delete a job", `delete from maintenance where id = '${JOB}'`, who(...OLD)],
  ["add a job photo", `insert into maintenance_photos (maintenance_id, drive_file_id) values ('${JOB}', 'probe')`, who("sic", ...OLD)], // RE-BASELINED 2026-10-07 (0152): the draft gives her maintenance.photos
  ["set up a recurring task", `insert into recurring_jobs (title, repeat, weekdays) values ('probe', 'weekly', '{1}')`, MANAGERS],
  // what she can do beyond stock: who and where, the board, her own tasks (0141's cells, 0141's policies)
  ["resident_who_and_where", `select 1 from resident_who_and_where where id = '${R}'`, who("sic", "volunteer", "po", "co", "dl")], // the borrowed volunteer floor
  ["maintenance board", `select 1 from maintenance where id = '${JOB}'`, who("sic", ...OLD)],
  ["create a job", `insert into maintenance (title, zone_id) values ('probe', '${ZONE}')`, who("sic", ...OLD)],
  ["move a job on", `update maintenance set status = 'In Progress' where id = '${JOB}'`, who("sic", ...OLD)],
  ["mark my recurring task done", `select record_recurring_job('${RJ_MINE}', current_date, 'done')`, who("sic", "admin", "management")],
];

const lines = [];
for (const [name, sql] of probes) {
  for (const p of P) lines.push(`  perform pg_temp.probe('${p}', ${lit(ID[p])}, $n$${name}$n$, $q$${sql}$q$);`);
}

const harness = `
begin;
create temp table res (who text, tbl text, n bigint);
grant all on res to authenticated;
create function pg_temp.probe(p_who text, p_uid uuid, p_name text, p_sql text) returns void language plpgsql as $f$
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
  insert into res values (p_who, p_name, v);
end $f$;

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-sic-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${["admin", "management", "staff", "volunteer", "vet"].map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id, role) select ${lit(ID.sic)}, id, legacy_role from roles where key = 'second_in_command';
  -- three roles that each hold ONE of her stock cells, to show the jobs stand alone
  insert into roles (key, name, kind, opens_app, home_path, legacy_role, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
    values ('harness_po', 'Harness purchasing only', 'custom', true, '/home', 'volunteer', 'all', 'any', 'name_type', 'medical_only', false),
           ('harness_co', 'Harness count only', 'custom', true, '/home', 'volunteer', 'all', 'any', 'name_type', 'medical_only', false),
           ('harness_dl', 'Harness delivery only', 'custom', true, '/home', 'volunteer', 'all', 'any', 'name_type', 'medical_only', false);
  insert into role_permissions (role_id, activity, level)
    select r.id, c.activity, 2 from roles r join (values ('harness_po', 'stock.purchasing'), ('harness_co', 'stock.count'), ('harness_dl', 'stock.delivery')) as c(k, activity) on c.k = r.key;
  insert into user_roles (user_id, role_id, role) select ${lit(ID.po)}, id, legacy_role from roles where key = 'harness_po';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.co)}, id, legacy_role from roles where key = 'harness_co';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.dl)}, id, legacy_role from roles where key = 'harness_dl';
  insert into vets (id, name, clinic_name) values (${lit(OWN)}, 'Harness own', 'Harness own');
  insert into vet_doctors (name, user_id, vet_id) values ('Harness vet', ${lit(ID.vet)}, ${lit(OWN)});
  insert into zones (id, name) values (${lit(ZONE)}, 'Harness zone');
  insert into residents (id, name, species) values (${lit(R)}, 'Harness resident', 'Dog');
  insert into weight (resident_id, date, weight_kg) values (${lit(R)}, current_date - 1, 5);
  insert into prescriptions (resident_id, medication_id, start_date) values (${lit(R)}, (select id from medication order by id limit 1), current_date);
  insert into maintenance (id, title, zone_id) values (${lit(JOB)}, 'Harness job', ${lit(ZONE)});
  insert into recurring_jobs (id, title, repeat, weekdays, starts_on)
    values (${lit(RJ_MINE)}, 'Harness mine', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7);
  insert into recurring_job_assignees (job_id, user_id) values (${lit(RJ_MINE)}, ${lit(ID.sic)});
end $setup$;

do $run$ begin
${lines.join("\n")}
end $run$;

-- the forecast wrappers carry copies of the two forecast queries: as the 2IC they must give what management's
-- originals give (they read private.resident_current_state because the public view is empty to a volunteer floor)
do $cmp$
declare m_orig numeric; m_orig_n bigint; d_orig numeric; d_orig_n bigint; m_sic numeric; m_sic_n bigint; d_sic numeric; d_sic_n bigint;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(ID.management)}, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select coalesce(sum(quantity), 0), count(*) into m_orig, m_orig_n from medication_forecast(current_date, current_date + 26);
  select coalesce(sum(quantity), 0), count(*) into d_orig, d_orig_n from diet_forecast(current_date, current_date + 26);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(ID.sic)}, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select coalesce(sum(quantity), 0), count(*) into m_sic, m_sic_n from stock_medication_forecast(current_date, current_date + 26);
  select coalesce(sum(quantity), 0), count(*) into d_sic, d_sic_n from stock_diet_forecast(current_date, current_date + 26);
  reset role;
  insert into res values ('cmp', 'medication forecast equals the original', case when m_orig = m_sic and m_orig_n = m_sic_n then 0 else 1 end);
  insert into res values ('cmp', 'diet forecast equals the original', case when d_orig = d_sic and d_orig_n = d_sic_n then 0 else 1 end);
  insert into res values ('cmp', 'forecasts are not trivially empty', case when m_orig_n > 0 and d_orig_n > 0 then 0 else 1 end);
end $cmp$;

do $role$ begin
  insert into res select 'role', 'row', 0 where exists (select 1 from roles where key = 'second_in_command' and kind = 'custom' and legacy_role = 'volunteer' and opens_app and name_th is not null and archived_at is null);
  insert into res select 'role', 'cell:' || rp.activity || ':' || rp.level, 0 from role_permissions rp join roles r on r.id = rp.role_id where r.key = 'second_in_command';
  insert into res select 'role', 'diet-forecast-has-no-cost', 0 where not exists (select 1 from pg_proc where proname = 'stock_diet_forecast' and pg_get_function_result(oid) ilike '%cost%');
end $role$;
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
const get = (who, tbl) => rows.find((r) => r.who === who && r.tbl === tbl)?.n;

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };

for (const [name, , exp] of probes) {
  if (exp === ONLY_SIC) {
    const n = get("sic", name);
    if (n <= 0) pass(`${name} as sic: refused or empty`); else fail(`${name}: the 2IC reaches ${n} row(s)`);
    continue;
  }
  if (exp === SIC_ONE) {
    const n = get("sic", name);
    if (n >= 1) pass(`${name} as sic: reached (the draft gives it)`); else fail(`${name}: the 2IC should reach it by the draft and got ${n}`);
    continue;
  }
  for (const p of P) {
    const n = get(p, name), want = exp[p];
    const label = `${name} as ${p}: ${want ? "allowed" : "refused"}`;
    if ((n >= 1) === Boolean(want)) pass(label);
    else fail(`${label} — got ${n}`);
  }
}

for (const name of ["medication forecast equals the original", "diet forecast equals the original"]) {
  if (get("cmp", name) === 0) pass(`${name} (as the 2IC, against management's original)`);
  else fail(`${name}: the wrapper and the original differ`);
}
if (get("cmp", "forecasts are not trivially empty") === 0) pass("the forecasts compared hold rows");
else console.log("NOTE  the dev forecasts are empty, so the comparison above proves little");
if (get("role", "row") === 0) pass("role row: custom, borrows volunteer, opens the app, has a Thai name"); else fail("role row second_in_command missing or wrong shape");
if (get("role", "diet-forecast-has-no-cost") === 0) pass("stock_diet_forecast() returns no cost column"); else fail("stock_diet_forecast() returns a cost column");
const have = new Map(rows.filter((r) => r.who === "role" && r.tbl.startsWith("cell:")).map((r) => r.tbl.split(":").slice(1)).map(([a, l]) => [a, Number(l)]));
const want = new Map([...bundleOfRole("second_in_command")].map(([a, l]) => [a, l === "edit" ? 2 : 1]));
// RE-BASELINED 2026-10-06 (director-draft-apply): the cells beyond her jobs are the Director's ticks, draft 2
const { cellsFor } = await import(pathToFileURL(join(process.cwd(), "src/lib/roles-draft/resolve.ts")).href);
const { ACTIVITIES } = await import(pathToFileURL(join(process.cwd(), "src/lib/permissions/catalogue.ts")).href);
const { readFileSync } = await import("node:fs");
const DRAFT = JSON.parse(readFileSync(join(process.cwd(), "src/lib/roles-draft/draft-2.json"), "utf8"));
for (const c of cellsFor(DRAFT, "second_in_command", Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.kind])))) want.set(c.activity, Math.max(want.get(c.activity) ?? 0, c.level));
const same = have.size === want.size && [...want].every(([a, l]) => have.get(a) === l);
if (same) pass(`bundle: role_permissions = the union of its jobs and the draft's cells (${[...want.keys()].join(", ")})`);
else fail(`bundle: role_permissions ${JSON.stringify([...have])} differ from jobs.ts ${JSON.stringify([...want])}`);

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (the 2IC runs the four screens and nothing else; each stock cell stands alone; the cells and jobs.ts agree)");
process.exitCode = fails ? 1 : 0;
