// map_rooms as the room editor uses it (0157, 0158, 0170, 0175): named rooms that can be added, renamed,
// described and deleted. Against DEV only, everything inside one transaction that is always rolled back, so it
// leaves nothing behind and works whatever rooms dev happens to have.
//
// What it holds the database to:
//   - who may read (any login with app access, never anon) and who may write (facility.enclosures at Edit,
//     which is Admin's alone since 2026-10-10), under each role's own JWT;
//   - a room with no kind can be added as often as you like, so the legacy one-per-kind rule never limits
//     the editor; a typed name is never overwritten by the legacy name-from-kind trigger, on insert or on
//     rename; a room with no name is refused;
//   - the editor's writes by primary key work, including the restore path's upsert on id;
//   - the description is prose: writing one queues a translations row that the queue labels and links, and
//     deleting the room drops it;
//   - the outline's shape rules, and that deleting a plan takes its rooms with it.
// It deliberately does NOT assert the one-per-kind rule or the trigger exist: both are due to be dropped
// (docs/decisions/2026-10-10-map-rooms-editor.md), and this check must stay green when they are.
//
//   node scripts/check-map-rooms.mjs            (from the repo root; dev only)
//   node scripts/check-map-rooms.mjs --verbose
//   node scripts/check-map-rooms.mjs --break <name>
//       Proves the check bites: plants one fault inside the rolled-back transaction and must then go RED.
//       <name> is one of: trigger (the trigger overwrites typed names), policy (volunteers may write),
//       queue (descriptions stop being queued), unique (a second kind-less room is refused).
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const breakAt = process.argv.indexOf("--break");
const breakName = breakAt >= 0 ? process.argv[breakAt + 1] : null;
const BREAKS = {
  trigger: `create or replace function map_rooms_name_from_kind() returns trigger language plpgsql as $b$
    begin new.name := 'overwritten'; return new; end $b$;
    drop trigger if exists map_rooms_name_from_kind on map_rooms;
    create trigger map_rooms_name_from_kind before insert or update on map_rooms for each row execute function map_rooms_name_from_kind();`,
  policy: `create policy harness_break_volunteer_writes on map_rooms for all to authenticated using (true) with check (true);`,
  queue: `drop trigger if exists map_rooms_queue_translations on map_rooms;`,
  unique: `create unique index harness_break_one_null_kind on map_rooms ((kind is null)) where kind is null;`,
};
if (breakName && !BREAKS[breakName]) throw new Error(`--break must be one of ${Object.keys(BREAKS).join(", ")}`);

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// Every live role that opens the app and could be on the map; Staff was retired by 0173.
const REAL = ["admin", "management", "second_in_command", "volunteer", "doctor"];
const WRITERS = new Set(["admin"]);
const ID = Object.fromEntries(REAL.map((p) => [p, randomUUID()]));
const lit = (id) => `'${id}'::uuid`;
const SQUARE = `'[[10,10],[20,10],[20,20],[10,20]]'::jsonb`;
const MAP = "(select id from facility_maps order by id limit 1)";
const ROOM = "(select id from map_rooms where name = 'Harness probe room')";

// Each probe runs in its own subtransaction under the role's JWT and is rolled back; the result is row_count
// (-1 = insufficient_privilege, -2 = any other error, e.g. a check constraint or an RLS check violation).
const probes = [];
const add = (who, name, sql) => probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${name}', $q$${sql}$q$);`);
for (const who of REAL) {
  add(who, "read", `select 1 from map_rooms where id = ${ROOM}`);
  add(who, "insert", `insert into map_rooms (map_id, name, shape) values (${MAP}, 'Harness ${who}', ${SQUARE})`);
  add(who, "rename", `update map_rooms set name = 'Renamed by ${who}' where id = ${ROOM}`);
  add(who, "describe", `update map_rooms set description = 'Written by ${who}' where id = ${ROOM}`);
  add(who, "delete", `delete from map_rooms where id = ${ROOM}`);
}
for (const [name, sql] of [
  ["null_shape", `insert into map_rooms (map_id, name, shape) values (${MAP}, 'x', null)`],
  ["two_points", `insert into map_rooms (map_id, name, shape) values (${MAP}, 'x', '[[1,1],[2,2]]'::jsonb)`],
  ["out_of_range", `insert into map_rooms (map_id, name, shape) values (${MAP}, 'x', '[[1,1],[2,2],[101,3]]'::jsonb)`],
  ["no_plan", `insert into map_rooms (map_id, name, shape) values (gen_random_uuid(), 'x', ${SQUARE})`],
  ["no_name", `insert into map_rooms (map_id, shape) values (${MAP}, ${SQUARE})`],
  ["blank_name", `insert into map_rooms (map_id, name, shape) values (${MAP}, '  ', ${SQUARE})`],
]) add("admin", name, sql);

const harness = `
begin;
create temp table res (who text, probe text, n bigint, s text);
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
  insert into res (who, probe, n) values (p_who, p_probe, v);
end $f$;

${breakName ? `-- deliberate break: ${breakName}\n${BREAKS[breakName]}` : ""}

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-mr-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id, role)
    select u.id, r.id, r.legacy_role
      from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id)
      join roles r on r.key = u.who;
  -- a plan to hang rooms on: dev's own if it has one, else a stand-in overview
  if not exists (select 1 from facility_maps) then
    insert into facility_maps (kind, image_path, width, height) values ('overview', 'storage:plans/harness/harness.png', 100, 100);
  end if;
  insert into map_rooms (map_id, name, shape) values (${MAP}, 'Harness probe room', ${SQUARE});
end $setup$;

do $run$ begin
${probes.join("\n")}
end $run$;

-- What the editor relies on, as the table owner (constraints and triggers apply to everyone alike).
do $sweep$
declare v_a uuid; v_b uuid; v_id uuid := gen_random_uuid(); v_legacy uuid; v_n bigint; v_s text;
begin
  -- two rooms with no kind: the one-per-kind rule never limits an added room
  begin
    insert into map_rooms (map_id, name, shape) values (${MAP}, 'Harness added A', ${SQUARE}) returning id into v_a;
    insert into map_rooms (map_id, name, shape) values (${MAP}, 'Harness added B', ${SQUARE}) returning id into v_b;
    insert into res (who, probe, n) values ('sweep', 'two_added', (select count(*) from map_rooms where id in (v_a, v_b)));
  exception when others then insert into res (who, probe, n, s) values ('sweep', 'two_added', -2, sqlerrm);
  end;

  -- a typed name is kept, on a kind-less room and on a legacy kinded one, on insert and on rename
  insert into map_rooms (map_id, name, name_th, shape) values (${MAP}, 'Typed name', 'ชื่อที่พิมพ์', ${SQUARE}) returning id into v_a;
  insert into res (who, probe, s) select 'sweep', 'typed_kept', name || ' / ' || name_th from map_rooms where id = v_a;
  delete from map_rooms where kind = 'medical';
  insert into map_rooms (map_id, kind, name, shape) values (${MAP}, 'medical', 'Treatment room', ${SQUARE}) returning id into v_legacy;
  insert into res (who, probe, s) select 'sweep', 'legacy_typed_kept', name from map_rooms where id = v_legacy;
  update map_rooms set name = 'Clinic', name_th = 'คลินิก' where id = v_legacy;
  insert into res (who, probe, s) select 'sweep', 'legacy_rename_kept', name || ' / ' || name_th from map_rooms where id = v_legacy;

  -- the restore path: an upsert on the primary key puts a room back, and a second one updates it
  insert into map_rooms (id, map_id, name, shape) values (v_id, ${MAP}, 'Restored', ${SQUARE})
    on conflict (id) do update set name = excluded.name, shape = excluded.shape;
  insert into map_rooms (id, map_id, name, shape) values (v_id, ${MAP}, 'Restored again', ${SQUARE})
    on conflict (id) do update set name = excluded.name, shape = excluded.shape;
  insert into res (who, probe, n, s) select 'sweep', 'upsert_by_id', count(*), max(name) from map_rooms where id = v_id;

  -- the description is prose: queued, labelled and linked, and dropped with the room
  update map_rooms set description = 'Simple procedures.' || chr(10) || 'Medication is stored here.' where id = v_a;
  select count(*), max(status) into v_n, v_s from translations where table_name = 'map_rooms' and row_id = v_a and column_name = 'description';
  insert into res (who, probe, n, s) values ('sweep', 'description_queued', v_n, v_s);
  insert into res (who, probe, s)
    select 'sweep', 'queue_names_it', coalesce(record_label, '') || ' | ' || coalesce(record_path, '')
      from private.translation_queue where table_name = 'map_rooms' and row_id = v_a;
  delete from map_rooms where id = v_a;
  insert into res (who, probe, n) select 'sweep', 'delete_drops_translation', count(*) from translations where table_name = 'map_rooms' and row_id = v_a;
end $sweep$;

-- deleting the plan takes its rooms with it
do $cascade$
declare v_map uuid;
begin
  insert into facility_maps (kind, zone_id, image_path, width, height)
    select 'zone', z.id, 'storage:plans/harness/cascade.png', 100, 100 from zones z
     where z.name <> 'Lifecycle' and not exists (select 1 from facility_maps f where f.zone_id = z.id) limit 1
    returning id into v_map;
  if v_map is null then
    insert into res (who, probe, n) values ('sweep', 'cascade', -9);
  else
    insert into map_rooms (map_id, name, shape) values (v_map, 'Harness cascade', ${SQUARE});
    delete from facility_maps where id = v_map;
    insert into res (who, probe, n) select 'sweep', 'cascade', count(*) from map_rooms where name = 'Harness cascade';
  end if;
end $cascade$;

do $anon$
begin
  set local role anon;
  begin perform 1 from map_rooms; insert into res (who, probe, n) values ('sweep', 'anon_read', 1);
  exception when insufficient_privilege then insert into res (who, probe, n) values ('sweep', 'anon_read', 0); end;
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
if (!m) {
  // The harness stopped before it could report: a statement the editor depends on was refused outright.
  console.log(`FAIL  the harness did not finish (status ${res.status}): ${msg.slice(0, 1500)}`);
  console.log(breakName ? `(deliberate break: ${breakName})` : "");
  console.log("RESULT: RED");
  process.exit(1);
}
const rows = JSON.parse(m[1]);
const row = (who, probe) => rows.find((r) => r.who === who && r.probe === probe);
const get = (who, probe) => row(who, probe)?.n;
const str = (who, probe) => row(who, probe)?.s;

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };
const eq = (who, probe, want, what) => (get(who, probe) === want ? pass(what) : fail(`${what} - got ${get(who, probe)}${str(who, probe) ? ` (${str(who, probe)})` : ""}`));
const eqs = (who, probe, want, what) => (str(who, probe) === want ? pass(what) : fail(`${what} - got ${JSON.stringify(str(who, probe))}`));
const refused = (who, probe, what) => (get(who, probe) === -1 || get(who, probe) === -2 ? pass(what) : fail(`${what} - got ${get(who, probe)}`));

for (const who of REAL) {
  eq(who, "read", 1, `${who} can read a room (any login with app access)`);
  if (WRITERS.has(who)) {
    eq(who, "insert", 1, `${who} can add a room`);
    eq(who, "rename", 1, `${who} can rename a room`);
    eq(who, "describe", 1, `${who} can describe a room`);
    eq(who, "delete", 1, `${who} can delete a room`);
  } else {
    refused(who, "insert", `${who} cannot add a room`);
    eq(who, "rename", 0, `${who} rename touches nothing`);
    eq(who, "describe", 0, `${who} describe touches nothing`);
    eq(who, "delete", 0, `${who} delete touches nothing`);
  }
}
for (const k of ["null_shape", "two_points", "out_of_range", "no_plan", "no_name"]) refused("admin", k, `admin ${k} rejected`);
// A blank name is stopped by the app (cleanRoomName); the table only insists on not null. Recorded, not judged.
if (verbose) console.log(`note  a blank-name insert returns ${get("admin", "blank_name")} (the editor never sends one)`);

eq("sweep", "two_added", 2, "two rooms with no kind can both be added");
eqs("sweep", "typed_kept", "Typed name / ชื่อที่พิมพ์", "a typed name is kept on a new room");
eqs("sweep", "legacy_typed_kept", "Treatment room", "a typed name is kept on a legacy kinded room");
eqs("sweep", "legacy_rename_kept", "Clinic / คลินิก", "renaming a legacy kinded room keeps the new name in both languages");
eq("sweep", "upsert_by_id", 1, "the restore path's upsert on id leaves one row");
eqs("sweep", "upsert_by_id", "Restored again", "and the second upsert updated it");
eq("sweep", "description_queued", 1, "a description queues one translations row");
eqs("sweep", "queue_names_it", "Map room · Typed name | /admin/facility-map", "the queue names the room and links Settings → Facility map");
eq("sweep", "delete_drops_translation", 0, "deleting the room drops its translation");
eq("sweep", "cascade", 0, "deleting a plan deletes its rooms");
eq("sweep", "anon_read", 0, "anon cannot read");

console.log(`\n${ok} checks held, ${fails} failed.${breakName ? ` (deliberate break: ${breakName})` : ""}`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
