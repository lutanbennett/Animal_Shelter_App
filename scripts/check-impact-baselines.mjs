// impact-baselines (0156): constraints, the computed total, the audit trail and who may write, read under each
// role's own JWT. Against DEV only. The migration file itself is run INSIDE the transaction, which is always rolled
// back, so this works before and after 0156 is applied.
//
//   node scripts/check-impact-baselines.mjs            (from the repo root; dev only)
//   node scripts/check-impact-baselines.mjs --verbose
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0156_impact_baselines.sql"), "utf8");
const REAL = ["admin", "management", "staff", "volunteer", "doctor"];
const ID = Object.fromEntries(REAL.map((p) => [p, randomUUID()]));
const lit = (id) => `'${id}'::uuid`;

// Each probe runs in its own subtransaction under the role's JWT and is rolled back; the result is row_count
// (-1 = insufficient_privilege, -2 = any other error, e.g. a check constraint or an RLS check violation).
const probes = [];
const add = (who, name, sql) => probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${name}', $q$${sql}$q$);`);
for (const who of REAL) {
  add(who, "read_table", "select 1 from impact_baselines");
  add(who, "insert", "insert into impact_baselines (key, label, baseline_count, baseline_date) values ('probe_fig', 'Probe', 5, '2026-01-01')");
  add(who, "update", "update impact_baselines set baseline_count = 10, baseline_date = '2026-01-01' where key = 'animals_rehomed'");
  add(who, "delete", "delete from impact_baselines where key = 'animals_rehomed'");
  add(who, "read_view", "select 1 from public_impact_figures");
}
add("admin", "pair_count_only", "update impact_baselines set baseline_count = 5 where key = 'villages_sterilised'");
add("admin", "pair_date_only", "update impact_baselines set baseline_date = '2026-01-01' where key = 'villages_sterilised'");
add("admin", "negative", "update impact_baselines set baseline_count = -1, baseline_date = '2026-01-01' where key = 'villages_sterilised'");
add("admin", "bad_key", "insert into impact_baselines (key, label) values ('Bad Key', 'x')");
add("admin", "dup_key", "insert into impact_baselines (key, label) values ('animals_rehomed', 'x')");

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
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-ib-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
end $setup$;

do $run$ begin
${probes.join("\n")}
end $run$;

-- The computed total, as the owner. One adoption ON the baseline day (not counted) and one the day after (counted).
do $calc$
declare
  v_res uuid; v_day date := date '2999-03-10'; v_live int; v_total int; v_expect int;
begin
  select id into v_res from residents limit 1;
  if v_res is null then
    insert into res values ('sweep', 'no_resident', 1);
    return;
  end if;
  update impact_baselines set baseline_count = 400, baseline_date = v_day where key = 'animals_rehomed';
  select count(*) into v_expect from placement_history where placement_type = 'Adopt' and shelter_date(start_date) > v_day;
  insert into placement_history (resident_id, placement_type, start_date) values
    (v_res, 'Adopt', (v_day::text || ' 12:00+07')::timestamptz),
    (v_res, 'Adopt', ((v_day + 1)::text || ' 12:00+07')::timestamptz);
  select live_count, total into v_live, v_total from public_impact_figures where key = 'animals_rehomed';
  insert into res values ('sweep', 'live_counts_after_day_only', (v_live - (v_expect + 1)));
  insert into res values ('sweep', 'total_is_baseline_plus_live', (v_total - (400 + v_live)));
  update impact_baselines set baseline_count = 120, baseline_date = v_day where key = 'villages_sterilised';
  select total into v_total from public_impact_figures where key = 'villages_sterilised';
  insert into res values ('sweep', 'baseline_only_total', v_total - 120);
end $calc$;

do $sweep$
begin
  insert into res select 'sweep', 'seed_rows', count(*) from impact_baselines where key in ('animals_rehomed', 'villages_sterilised');
  update impact_baselines set set_by = ${lit(ID.staff)} where key = 'villages_sterilised';
  insert into res select 'sweep', 'forged_set_by_replaced', count(*) from impact_baselines where key = 'villages_sterilised' and set_by is distinct from ${lit(ID.staff)};
end $sweep$;

-- audit under a real session: admin edits, the log keeps both images and the actor
do $aud$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(ID.admin)}, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  update impact_baselines set baseline_count = 777, baseline_date = date '2026-04-01' where key = 'animals_rehomed';
  reset role;
  insert into res select 'sweep', 'audit_update_row', count(*) from audit_log
   where table_name = 'impact_baselines' and op = 'UPDATE' and actor = ${lit(ID.admin)}
     and (old_row ->> 'baseline_count')::int = 400 and (new_row ->> 'baseline_count')::int = 777;
  insert into res select 'sweep', 'set_by_is_admin', count(*) from impact_baselines where key = 'animals_rehomed' and set_by = ${lit(ID.admin)};
end $aud$;

do $anon$
begin
  set local role anon;
  begin perform 1 from impact_baselines; insert into res values ('sweep', 'anon_table_read', 1);
  exception when insufficient_privilege then insert into res values ('sweep', 'anon_table_read', 0); end;
  begin perform 1 from public_impact_figures; insert into res values ('sweep', 'anon_view_read', 1);
  exception when insufficient_privilege then insert into res values ('sweep', 'anon_view_read', 0); end;
  reset role;
  insert into res select 'sweep', 'view_columns_extra', count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'public_impact_figures'
     and column_name not in ('key', 'label', 'label_th', 'baseline_count', 'baseline_date', 'live_count', 'total');
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

// Who holds website.content on dev is the permission matrix's business; read it off the result instead of assuming.
const WRITERS = REAL.filter((w) => get(w, "insert") === 1);
console.log(`website.content writers on dev, as found: ${WRITERS.join(", ")}`);
if (!WRITERS.includes("admin")) fail("admin must always be able to write");
for (const who of REAL) {
  const w = WRITERS.includes(who);
  const upd = get(who, "update"), del = get(who, "delete"), rd = get(who, "read_table");
  (w ? upd === 1 : upd === 0) ? pass(`${who} update ${w ? "allowed" : "refused"}`) : fail(`${who} update - got ${upd}`);
  del === 0 || del === -1 ? pass(`${who} delete refused`) : fail(`${who} delete - got ${del}`);
  (w ? rd >= 2 : rd === 0 || rd === -1) ? pass(`${who} table read ${w ? "allowed" : "refused"}`) : fail(`${who} table read - got ${rd}`);
  if (!w) get(who, "insert") === -1 || get(who, "insert") === -2 ? pass(`${who} insert refused`) : fail(`${who} insert - got ${get(who, "insert")}`);
  // the seeded rows are unset, so the view is empty for everyone: zero rows, not an error
  get(who, "read_view") === 0 ? pass(`${who} reads the view; unset figures are not public`) : fail(`${who} view - got ${get(who, "read_view")}`);
}
for (const k of ["pair_count_only", "pair_date_only", "negative", "bad_key", "dup_key"]) eq("admin", k, -2, `admin ${k} rejected`);
eq("sweep", "seed_rows", 2, "both figures are seeded");
eq("sweep", "live_counts_after_day_only", 0, "live count = adoptions on days AFTER the baseline date (the baseline day is not counted twice)");
eq("sweep", "total_is_baseline_plus_live", 0, "total = baseline + live count");
eq("sweep", "baseline_only_total", 0, "a figure with no counted source is its baseline");
eq("sweep", "forged_set_by_replaced", 1, "a forged set_by is replaced by the trigger");
eq("sweep", "audit_update_row", 1, "the audit log holds before and after images with the admin as actor");
eq("sweep", "set_by_is_admin", 1, "set_by is the session's login");
eq("sweep", "anon_table_read", 0, "anon cannot read the table");
eq("sweep", "anon_view_read", 1, "anon can read the public view");
eq("sweep", "view_columns_extra", 0, "the public view carries no column beyond the figure");
if (get("sweep", "no_resident") === 1) fail("no resident on dev, so the computed-total case could not run");
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
