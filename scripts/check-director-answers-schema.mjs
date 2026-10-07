// director-answers-schema (0155): four of the Director's 2026-10-07 answers, read under each login's own JWT.
// Against DEV only, one transaction that is always rolled back.
//
//   node scripts/check-director-answers-schema.mjs            (from the repo root; dev only)
//   node scripts/check-director-answers-schema.mjs --verbose  (also list every case)
//
//   q6/q7  the contacts TABLE is still read by staff (the carer pickers need it); the 2IC reads id, name and phone through
//          volunteer_contacts and nothing else; a volunteer, a vet and a role off the full scope read neither
//   q12    shelter_friends reads friends.view or friends.manage: staff yes, the old "whoever reads contacts" half gone
//   q5     immunization_types (it carries a cost) reads only reference.types; the vaccine picker view carries no cost
//   q8     is exercised by check-resident-microchip.mjs (a Management write)
// The vet reads shelter_friends and immunization_types through its own vet_* policies (C10, C3) and reads the picker view
// only where it holds a medical cell, which dev's draft matrix does not give it, so those vet cells are not asserted.
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
  c_dir_all: { cells: [["contacts.directory", 2], ["contacts.add", 2]] },
  c_browse_np: { floor: "volunteer", scope: "name_phone", cells: [["contacts.browse", 2]] },
  c_browse_full: { cells: [["contacts.browse", 2]] },
  c_friends_view: { cells: [["friends.view", 2]] },
  c_friends_manage: { cells: [["friends.manage", 2]] },
  c_types_read: { cells: [["reference.types", 1]] },
  c_vol_medical: { floor: "volunteer", cells: [["medical.immunizations", 2], ["medical.prescriptions", 2]] },
};
const REAL = ["admin", "management", "staff", "volunteer", "vet"];
const P = [...REAL, "twoic", "norole", ...Object.keys(CUSTOM)];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const CT = randomUUID(), CT2 = randomUUID(), FR = randomUUID(), IT = randomUUID();

const PROBES = {
  contacts_table: `select 1 from contacts where id = '${CT}'`,
  contacts_view: `select 1 from volunteer_contacts where id = '${CT}'`,
  friends: `select 1 from shelter_friends where id = '${FR}'`,
  imm_table: `select 1 from immunization_types where id = '${IT}'`,
  imm_view: `select 1 from picker_immunization_types where id = '${IT}'`,
};
// expected 1/0 per principal; anything not listed is 0. SKIP lists the cells not asserted (see the header).
const EXPECT = {
  contacts_table: ["admin", "management", "staff", "c_dir_all"],
  contacts_view: ["twoic", "c_browse_np"],
  friends: ["admin", "management", "staff", "vet", "c_friends_view", "c_friends_manage"],
  imm_table: ["admin", "vet", "c_types_read"],
  imm_view: ["admin", "management", "staff", "twoic", "c_types_read", "c_vol_medical"] // twoic: dev holds the Director's draft, which gives her medical.immunizations; she reads the view and, as imm_table shows, not the table,
};
const SKIP = { friends: ["vet"], imm_table: ["vet"], imm_view: ["vet"] };

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
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-das-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into roles (key, name, kind, legacy_role, scope_residents, scope_contacts) values
    ${Object.entries(CUSTOM).map(([c, d]) => `('harness_das_${c}', 'Harness ${c}', 'custom', '${d.floor ?? "staff"}', 'all', '${d.scope ?? "full"}')`).join(",\n    ")};
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r join (values
      ${Object.entries(CUSTOM).flatMap(([c, d]) => d.cells.map(([a, l]) => `('harness_das_${c}', '${a}', ${l})`)).join(",\n      ")}
    ) as v(rkey, act, lvl) on v.rkey = r.key;
  ${Object.keys(CUSTOM).map((c) => `insert into user_roles (user_id, role_id, role) select ${lit(ID[c])}, id, '${CUSTOM[c].floor ?? "staff"}' from roles where key = 'harness_das_${c}';`).join("\n  ")}
  insert into user_roles (user_id, role_id, role) select ${lit(ID.twoic)}, id, 'volunteer' from roles where key = 'second_in_command';
  insert into contacts (id, name, type, phone, address) values (${lit(CT)}, 'Harness carer', 'Carer', '0800000000', 'Harness address'), (${lit(CT2)}, 'Harness friend', 'Vendor', null, null);
  insert into shelter_friends (id, contact_id) values (${lit(FR)}, ${lit(CT2)});
  insert into immunization_types (id, name, interval_months, cost) values (${lit(IT)}, 'Harness vaccine', 12, 99.5);
end $setup$;

do $run$ begin
${probes.join("\n")}
end $run$;

do $sweep$ begin
  insert into res select 'sweep', 'imm_view_cols', count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'picker_immunization_types' and column_name in ('id', 'name', 'is_mandatory', 'interval_months');
  insert into res select 'sweep', 'imm_view_extra', count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'picker_immunization_types' and column_name not in ('id', 'name', 'is_mandatory', 'interval_months');
  insert into res select 'sweep', 'contacts_view_extra', count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'volunteer_contacts' and column_name not in ('id', 'name', 'phone');
  insert into res select 'sweep', 'friends_policy_names_address_book', count(*) from pg_policies
   where schemaname = 'public' and tablename = 'shelter_friends' and cmd = 'SELECT' and coalesce(qual, '') like '%contacts.directory%';
  insert into res select 'sweep', 'imm_policy_names_medical_cell', count(*) from pg_policies
   where schemaname = 'public' and tablename = 'immunization_types' and cmd = 'SELECT' and policyname like '%perm' and coalesce(qual, '') like '%medical.immunizations%';
  insert into res select 'sweep', 'browse_holders', count(*) from role_permissions
   where activity = 'contacts.browse' and role_id in (select id from roles where key in ('management', 'second_in_command'));
  insert into res select 'sweep', 'browse_wrong_holders', count(*) from role_permissions
   where activity = 'contacts.browse' and role_id in (select id from roles where key in ('staff', 'volunteer', 'vet'));
  insert into res select 'sweep', 'twoic_scope_name_phone', count(*) from roles where key = 'second_in_command' and scope_contacts = 'name_phone';
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
    if ((SKIP[probe] ?? []).includes(who)) continue;
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
eq("imm_view_cols", 4, "picker_immunization_types has id, name, is_mandatory, interval_months");
eq("imm_view_extra", 0, "picker_immunization_types has no other column (no cost)");
eq("contacts_view_extra", 0, "volunteer_contacts has no column beyond id, name, phone");
eq("friends_policy_names_address_book", 0, "the shelter_friends select policy no longer names contacts.directory (N3)");
eq("imm_policy_names_medical_cell", 0, "the immunization_types select policy no longer names medical.immunizations");
eq("browse_holders", 2, "Management and the 2IC hold contacts.browse");
eq("browse_wrong_holders", 0, "staff, volunteer and vet hold no contacts.browse");
eq("twoic_scope_name_phone", 1, "the 2IC's contacts scope is name_phone");
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (carers: Management and the 2IC browse, staff keep the table for the pickers; friends: staff read by cell; vaccines: the picker has no price)");
process.exitCode = fails ? 1 : 0;
