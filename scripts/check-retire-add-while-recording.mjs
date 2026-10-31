// Rollback harness for 0291_retire_add_while_recording_activity.sql against DEV only. One transaction: every statement the five
// changed objects answer is asked BEFORE the file, the file is replayed, they are asked AFTER, then a deliberate `raise exception`
// carries the evidence, so nothing can commit. Safe to run any number of times; once 0291 is applied the BEFORE half reads the
// already-changed policies, so the run proves the AFTER state and that the replay is a no-op.
//
//   node scripts/check-retire-add-while-recording.mjs     (from the repo root; dev only)
//
// It checks
//   A  each principal gets the same answer before and after, for every statement: Admin (the reference screens' only user) and a
//      login holding exactly one of the cells the five objects still ask, plus a login holding none
//   B  Admin is allowed every statement after (the /admin reference screens and the medicine picker still work for Admin)
//   C  after the file nothing live names reference.add_while_recording: no policy, view or function, and no catalogue row
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^0291_retire_add_while_recording_activity\.sql$/.test(f));
if (!file) throw new Error("no 0291_retire_add_while_recording_activity.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

// principal -> the cells its throwaway role holds (admin is the real Admin role)
const CUSTOM = {
  none: [],
  med_read: [["stock.medications", 1]],
  med_edit: [["stock.medications", 2]],
  types_read: [["reference.types", 1]],
  types_edit: [["reference.types", 2]],
  proc_read: [["medical.procedures", 1]],
  rx_read: [["medical.prescriptions", 1]],
};
const WHO = ["admin", ...Object.keys(CUSTOM)];
const ID = Object.fromEntries(WHO.map((w) => [w, randomUUID()]));
const lit = (id) => `'${id}'::uuid`;

// The statements the five objects answer. Inserts count rows; reads count rows of a fixture made by the owner.
const PROC = randomUUID(), MED = randomUUID();
const STMTS = {
  medication_insert: `insert into medication (name, dose_unit) values ('Harness 0291 med', current_setting('harness.med_unit', true))`,
  frequency_insert: `insert into frequency (label) values ('Harness 0291 frequency')`,
  procedure_types_select: `select 1 from procedure_types where id = '${PROC}'`,
  procedure_types_insert: `insert into procedure_types (name) values ('Harness 0291 procedure')`,
  picker_medications_select: `select 1 from picker_medications where id = '${MED}'`,
};

const asks = (phase) =>
  WHO.flatMap((w) =>
    Object.entries(STMTS).map(([k, q]) => `  insert into harness_res values ('${phase}', '${w}', '${k}', pg_temp.probe(${lit(ID[w])}, $q$${q}$q$));`),
  ).join("\n");

const sql = `
begin;
create temp table harness_res (phase text, who text, stmt text, n bigint);
grant all on harness_res to authenticated;
create function pg_temp.probe(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint := -2;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
    begin
      execute p_sql; get diagnostics v = row_count;
    exception when insufficient_privilege then v := -1; when others then v := case when sqlerrm like 'There is no unit called%' then -3 else -2 end;
    end;
    reset role;
    raise exception using errcode = 'P0999', message = 'probe-rollback';
  exception when sqlstate 'P0999' then null;
  end;
  return v;
end $f$;

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-0291-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${WHO.map((w) => `('${w}', ${lit(ID[w])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id) select ${lit(ID.admin)}, id from roles where is_admin limit 1;
  insert into roles (key, name, kind) values ${Object.keys(CUSTOM).map((c) => `('harness_0291_${c}', 'Harness 0291 ${c}', 'custom')`).join(", ")};
  ${Object.entries(CUSTOM).flatMap(([c, cells]) => cells.map(([a, l]) => `insert into role_permissions (role_id, activity, level) select id, '${a}', ${l} from roles where key = 'harness_0291_${c}';`)).join("\n  ")}
  ${Object.keys(CUSTOM).map((c) => `insert into user_roles (user_id, role_id) select ${lit(ID[c])}, id from roles where key = 'harness_0291_${c}';`).join("\n  ")}
  insert into procedure_types (id, name) values (${lit(PROC)}, 'Harness 0291 fixture procedure');
  insert into medication (id, name) values (${lit(MED)}, 'Harness 0291 fixture med');
  perform set_config('harness.med_unit', (select name from units where for_medicines and archived_at is null order by sort_order, name limit 1), true);
end $setup$;

do $before$ begin
${asks("before")}
end $before$;

${migration}

do $after$ begin
${asks("after")}
end $after$;

do $o$ begin raise exception 'HARNESS-RESULT %', json_build_object(
  'rows', (select json_agg(row_to_json(harness_res)) from harness_res),
  'policies', (select count(*) from pg_policies where coalesce(qual, '') || coalesce(with_check, '') like '%add_while_recording%'),
  'views', (select count(*) from pg_views where definition like '%add_while_recording%'),
  'functions', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) like '%add_while_recording%'),
  'catalogue', (select count(*) from permission_activities where key = 'reference.add_while_recording')); end $o$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) {
  console.log(`no result (status ${res.status}): ${msg.slice(0, 1500)}`);
  process.exitCode = 1;
} else {
  const out = JSON.parse(m[1]);
  const get = (phase, who, stmt) => out.rows.find((r) => r.phase === phase && r.who === who && r.stmt === stmt)?.n;
  let fails = 0;
  const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
  const say = (n) => (n >= 1 ? "allowed" : n === -3 ? "refused at the units trigger" : n === -2 ? "ERRORED" : "refused");
  console.log(["", ...Object.keys(STMTS)].join(" | "));
  for (const w of WHO) {
    console.log([w, ...Object.keys(STMTS).map((k) => say(get("after", w, k)))].join(" | "));
    for (const k of Object.keys(STMTS)) {
      const b = get("before", w, k), a = get("after", w, k);
      if (a === -2 || b === -2) fail(`A ${k} as ${w}: the statement errored (before ${b}, after ${a}); the fixture is wrong`);
      else if ((b >= 1) !== (a >= 1)) fail(`A ${k} as ${w}: ${say(b)} before, ${say(a)} after`);
    }
  }
  for (const k of Object.keys(STMTS)) if (!(get("after", "admin", k) >= 1)) fail(`B Admin is not allowed ${k} after 0291`);
  for (const k of ["policies", "views", "functions", "catalogue"]) if (out[k] !== 0) fail(`C ${out[k]} ${k} still name reference.add_while_recording`);
  console.log(`\n${fails ? "RESULT: RED" : "RESULT: GREEN (every login answers as before; Admin is allowed all five; nothing live names the activity)"}`);
  // exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
  process.exitCode = fails ? 1 : 0;
}
