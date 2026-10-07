// map_rooms (0157): shape and kind constraints, one row per kind, cascade from the plan, and who may read and
// write, under each role's own JWT. Against DEV only. The migration file is run INSIDE the transaction, which is
// always rolled back, so this works before and after 0157 is applied.
//
//   node scripts/check-map-rooms.mjs            (from the repo root; dev only)
//   node scripts/check-map-rooms.mjs --verbose
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0157_map_rooms.sql"), "utf8");
const REAL = ["admin", "management", "staff", "volunteer", "vet"];
const ID = Object.fromEntries(REAL.map((p) => [p, randomUUID()]));
const lit = (id) => `'${id}'::uuid`;
const SQUARE = `'[[10,10],[20,10],[20,20],[10,20]]'::jsonb`;
const MAP = "(select id from facility_maps limit 1)";

// Each probe runs in its own subtransaction under the role's JWT and is rolled back; the result is row_count
// (-1 = insufficient_privilege, -2 = any other error, e.g. a check constraint or an RLS check violation).
const probes = [];
const add = (who, name, sql) => probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${name}', $q$${sql}$q$);`);
for (const who of REAL) {
  add(who, "read", "select 1 from map_rooms");
  add(who, "insert", `insert into map_rooms (map_id, kind, shape) values (${MAP}, 'storage', ${SQUARE})`);
  add(who, "update", "update map_rooms set shape = shape where kind = 'medical'");
  add(who, "delete", "delete from map_rooms where kind = 'medical'");
}
add("admin", "bad_kind", `insert into map_rooms (map_id, kind, shape) values (${MAP}, 'laundry', ${SQUARE})`);
add("admin", "null_shape", `insert into map_rooms (map_id, kind, shape) values (${MAP}, 'storage', null)`);
add("admin", "two_points", `insert into map_rooms (map_id, kind, shape) values (${MAP}, 'storage', '[[1,1],[2,2]]'::jsonb)`);
add("admin", "out_of_range", `insert into map_rooms (map_id, kind, shape) values (${MAP}, 'storage', '[[1,1],[2,2],[101,3]]'::jsonb)`);
add("admin", "no_plan", `insert into map_rooms (map_id, kind, shape) values (gen_random_uuid(), 'storage', ${SQUARE})`);
add("admin", "duplicate_kind", `insert into map_rooms (map_id, kind, shape) values (${MAP}, 'medical', ${SQUARE})`);
add("admin", "valid_kitchen", `insert into map_rooms (map_id, kind, shape) values (${MAP}, 'kitchen', ${SQUARE})`);

const harness = `
begin;
${migration}
create temp table res (who text, probe text, n bigint);
grant all on res to authenticated, anon;
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
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-mr-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  -- a plan to hang rooms on: dev's own if it has one, else a stand-in overview
  if not exists (select 1 from facility_maps) then
    insert into facility_maps (kind, image_path, width, height) values ('overview', 'harness.png', 100, 100);
  end if;
  -- one room already there, so the duplicate-kind probe has something to collide with
  insert into map_rooms (map_id, kind, shape) values (${MAP}, 'medical', ${SQUARE});
end $setup$;

do $run$ begin
${probes.join("\n")}
end $run$;

-- deleting the plan takes its rooms with it
do $cascade$
declare v_map uuid;
begin
  insert into facility_maps (kind, zone_id, image_path, width, height)
    select 'zone', z.id, 'harness-cascade.png', 100, 100 from zones z
     where z.name <> 'Lifecycle' and not exists (select 1 from facility_maps f where f.zone_id = z.id) limit 1
    returning id into v_map;
  if v_map is null then
    insert into res values ('sweep', 'cascade', -9);
  else
    insert into map_rooms (map_id, kind, shape) values (v_map, 'kitchen', ${SQUARE});
    delete from facility_maps where id = v_map;
    insert into res select 'sweep', 'cascade', count(*) from map_rooms where kind = 'kitchen';
  end if;
end $cascade$;

do $anon$
begin
  set local role anon;
  begin perform 1 from map_rooms; insert into res values ('sweep', 'anon_read', 1);
  exception when insufficient_privilege then insert into res values ('sweep', 'anon_read', 0); end;
  reset role;
end $anon$;
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
const eq = (who, probe, want, what) => (get(who, probe) === want ? pass(what) : fail(`${what} - got ${get(who, probe)}`));
const refused = (who, probe, what) => (get(who, probe) === -1 || get(who, probe) === -2 ? pass(what) : fail(`${what} - got ${get(who, probe)}`));

for (const who of REAL) {
  eq(who, "read", 1, `${who} can read (any signed-in login)`);
  if (who === "admin" || who === "management") {
    eq(who, "insert", 1, `${who} can insert`);
    eq(who, "update", 1, `${who} can update`);
    eq(who, "delete", 1, `${who} can delete`);
  } else {
    refused(who, "insert", `${who} insert refused`);
    eq(who, "update", 0, `${who} update touches nothing`);
    eq(who, "delete", 0, `${who} delete touches nothing`);
  }
}
// admin's insert of 'storage' above succeeds, so the duplicate probe uses 'medical', which setup already holds
for (const k of ["bad_kind", "null_shape", "two_points", "out_of_range", "no_plan", "duplicate_kind"]) eq("admin", k, -2, `admin ${k} rejected`);
eq("admin", "valid_kitchen", 1, "a valid room inserts");
eq("sweep", "cascade", 0, "deleting a plan deletes its rooms");
eq("sweep", "anon_read", 0, "anon cannot read");
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
