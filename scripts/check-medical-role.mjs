// medical-role (0136): the Head of Medical, the first configured role. Against DEV only, one
// transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-medical-role.mjs            (from the repo root; dev only)
//   node scripts/check-medical-role.mjs --verbose  (also list every passing check)
//
// What it holds:
//   the bundle   role_permissions of head_of_medical are exactly the union of its jobs in
//                src/lib/permissions/jobs.ts (neither can drift from the other unseen)
//   the row      legacy_role volunteer, Thai name present, kind custom, opens the app
//   reads        the Head of Medical reads prescriptions, frequency and the two list views;
//                a volunteer, a vet and a login with no role read none of them
//   the floor    the Head of Medical reads NOTHING else: not medication (prices), not residents,
//                not resident_list_view, not a weight, a visit, a procedure or a stock count;
//                the list views carry no price, stock, breed or bio column
//   writes       refused on prescriptions (update and insert); weight is hers since 0140
//   controls     admin, management and staff still read what they read before
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
const P = ["hom", "admin", "management", "staff", "volunteer", "vet", "norole"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), OWN = randomUUID();

const NONE = { hom: 0, admin: 0, management: 0, staff: 0, volunteer: 0, vet: 0, norole: 0 };
const READ_ALL = { ...NONE, hom: 1, admin: 1, management: 1, staff: 1 };
const STAFF_UP = { ...NONE, admin: 1, management: 1, staff: 1 };
// the harness resident has a visit at the vet's own clinic, so the vet_* policies (untouched) let that vet in
const OWN_CLINIC = { ...STAFF_UP, vet: 1 };
// 0140 gave the role medical.weight (Edit), so a weight is one of its own reads and writes now
const OWN_CLINIC_AND_HOM = { ...OWN_CLINIC, hom: 1 };
// cells granted ahead of the screens that make them jobs (0140); check-medical-jobs.mjs holds the behaviour
const AHEAD = new Map();

// [name, sql, expectation]: a table of who may (1) or may not (0); "error" = the statement must fail;
// "hom-zero" = only the Head of Medical is asserted, and it must see nothing
const probes = [
  ["prescriptions", `select 1 from prescriptions where resident_id = '${R}'`, { ...READ_ALL, vet: 1 }],
  ["frequency", `select 1 from frequency limit 1`, { ...READ_ALL, vet: 1 }], // a vet's vet_read_frequency is untouched
  ["medication_list_medications", `select 1 from medication_list_medications limit 1`, READ_ALL],
  ["medication_list_residents", `select 1 from medication_list_residents where id = '${R}'`, READ_ALL],
  // the floor: nothing else
  ["medication", `select 1 from medication limit 1`, { ...STAFF_UP, vet: 1 }],
  ["residents", `select 1 from residents where id = '${R}'`, OWN_CLINIC],
  ["resident_list_view", `select 1 from resident_list_view where resident_id = '${R}'`, OWN_CLINIC],
  ["weight", `select 1 from weight where resident_id = '${R}'`, OWN_CLINIC_AND_HOM],
  ["vet_appointments", `select 1 from vet_appointments where resident_id = '${R}'`, OWN_CLINIC],
  ["procedures", `select 1 from procedures where resident_id = '${R}'`, null],
  ["stock_counts", `select 1 from stock_counts limit 1`, "hom-zero"],
  ["assistant_actions", `select 1 from assistant_actions limit 1`, "hom-zero"],
  ["contacts", `select 1 from contacts limit 1`, "hom-zero"],
  // who and where is still the volunteer view's, and still works for this role (borrowed rights)
  ["resident_who_and_where", `select 1 from resident_who_and_where where id = '${R}'`, { ...NONE, hom: 1, volunteer: 1 }],
  // columns the list views must not carry
  ["price column on the medicine view", `select cost_per_unit from medication_list_medications limit 1`, "error"],
  ["stock column on the medicine view", `select stock_on_hand from medication_list_medications limit 1`, "error"],
  ["breed column on the resident view", `select breed from medication_list_residents limit 1`, "error"],
  ["bio column on the resident view", `select bio from medication_list_residents limit 1`, "error"],
  // writes
  ["update prescriptions", `update prescriptions set notes = 'probe' where resident_id = '${R}'`, OWN_CLINIC],
  ["insert prescriptions", `insert into prescriptions (resident_id, medication_id, start_date) values ('${R}', (select id from medication order by id limit 1), current_date)`, OWN_CLINIC],
  ["insert weight", `insert into weight (resident_id, date, weight_kg) values ('${R}', current_date - 500, 5)`, OWN_CLINIC_AND_HOM],
];

const lines = [];
for (const [name, sql] of probes) {
  for (const who of P) lines.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, $n$${name}$n$, $q$${sql}$q$);`);
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
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-mr-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${["admin", "management", "staff", "volunteer", "vet"].map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id, role) select ${lit(ID.hom)}, id, legacy_role from roles where key = 'head_of_medical';
  insert into vets (id, name, clinic_name) values (${lit(OWN)}, 'Harness own', 'Harness own');
  insert into vet_doctors (name, user_id, vet_id) values ('Harness vet', ${lit(ID.vet)}, ${lit(OWN)});
  insert into residents (id, name, species) values (${lit(R)}, 'Harness resident', 'Dog');
  insert into vet_appointments (resident_id, vet_id, appointment_date, status) values (${lit(R)}, ${lit(OWN)}, now() - interval '3 days', 'completed');
  insert into weight (resident_id, date, weight_kg) values (${lit(R)}, current_date - 1, 5);
  insert into prescriptions (resident_id, medication_id, start_date) values (${lit(R)}, (select id from medication order by id limit 1), current_date);
end $setup$;

do $run$ begin
${lines.join("\n")}
end $run$;

do $role$ begin
  insert into res select 'role', 'row', 0 where exists (select 1 from roles where key = 'head_of_medical' and kind = 'custom' and legacy_role = 'volunteer' and opens_app and name_th is not null and archived_at is null);
  insert into res select 'role', 'cell:' || rp.activity || ':' || rp.level, 0 from role_permissions rp join roles r on r.id = rp.role_id where r.key = 'head_of_medical';
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
  if (exp === "error") {
    const n = get("hom", name);
    if (n === -2) pass(`${name}: refused as a missing column`); else fail(`${name}: expected an error, got ${n}`);
    continue;
  }
  if (exp === "hom-zero" || exp === null) {
    const n = get("hom", name);
    if (n <= 0) pass(`${name} as hom: refused or empty`); else fail(`${name}: the Head of Medical reads ${n} row(s)`);
    continue;
  }
  for (const who of P) {
    const n = get(who, name), want = exp[who];
    const label = `${name} as ${who}: ${want ? "allowed" : "refused"}`;
    if ((n >= 1) === Boolean(want)) pass(label);
    else fail(`${label} — got ${n}`);
  }
}

if (get("role", "row") === 0) pass("role row: custom, borrows volunteer, opens the app, has a Thai name"); else fail("role row head_of_medical missing or wrong shape");
const have = new Map(rows.filter((r) => r.who === "role" && r.tbl.startsWith("cell:")).map((r) => r.tbl.split(":").slice(1)).map(([a, l]) => [a, Number(l)]));
const want = new Map([...bundleOfRole("head_of_medical")].map(([a, l]) => [a, l === "edit" ? 2 : 1]));
for (const [a, l] of AHEAD) if (!want.has(a)) want.set(a, l);
const same = have.size === want.size && [...want].every(([a, l]) => have.get(a) === l);
if (same) pass(`bundle: role_permissions = the union of its jobs (${[...want.keys()].join(", ")})`);
else fail(`bundle: role_permissions ${JSON.stringify([...have])} differ from jobs.ts ${JSON.stringify([...want])}`);

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (the Head of Medical reads the list and nothing else; the cells and jobs.ts agree)");
process.exitCode = fails ? 1 : 0;
