// Regression proof for the re-own migration (docs/decisions/2026-11-14-tenancy-reown.md). The spike's md5-snapshot method:
// hash the full output of every object a Lanna admin can read and every object anon can read, change ownership, hash again.
// Any difference is a regression for Lanna. Dev only.
//
//   node scripts/regress-tenancy-reown.mjs --harness <migration.sql>   snapshot, run the file, snapshot, diff, ROLL BACK
//   node scripts/regress-tenancy-reown.mjs --snapshot <out.json>       snapshot only (run before and after a real apply)
//   node scripts/regress-tenancy-reown.mjs --diff <a.json> <b.json>    compare two snapshots
// Exit 0 only when the snapshot read something AND nothing differs.
import { readFileSync, writeFileSync } from "node:fs";
import { loadEnv, projectRef } from "./lib/env.mjs";

const argv = process.argv.slice(2);
const mode = argv[0];

const HELPERS = `
create function pg_temp.try(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    perform set_config('request.headers', json_build_object('x-shelter', 'lanna')::text, true);
    set local role anon;
  else
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal2')::text, true);
    set local role authenticated;
  end if;
  begin execute p_sql into v;
  exception when others then v := 'ERR ' || sqlstate || ' ' || left(sqlerrm, 80);
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.headers', '', true);
  return v;
end $f$;
-- every view/table the admin or anon can read, and every zero-argument stable security definer function they can call
create function pg_temp.snapshot() returns table(who text, obj text, result text) language plpgsql as $f$
declare v_admin uuid; r record; q text;
begin
  select ur.user_id into v_admin from public.user_roles ur join public.roles ro on ro.id = ur.role_id
   where ro.key = 'admin' and ur.archived_at is null order by ur.user_id limit 1;
  if v_admin is null then raise exception 'no admin login to snapshot as'; end if;
  for r in
    select 'admin'::text w, c.relname::text o, 'select' k from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('v','m') and has_table_privilege('authenticated', c.oid, 'select')
    union all
    select 'anon', c.relname::text, 'select' from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('v','m','r') and has_table_privilege('anon', c.oid, 'select')
    union all
    select 'admin', p.proname::text || '()', 'fn' from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef and p.pronargs = 0 and p.provolatile in ('s','i') and p.prokind = 'f'
       and p.prorettype not in ('trigger'::regtype, 'void'::regtype) and has_function_privilege('authenticated', p.oid, 'execute')
    union all
    select 'anon', p.proname::text || '()', 'fn' from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef and p.pronargs = 0 and p.provolatile in ('s','i') and p.prokind = 'f'
       and p.prorettype not in ('trigger'::regtype, 'void'::regtype) and has_function_privilege('anon', p.oid, 'execute')
    order by 1, 2
  loop
    q := case r.k when 'select' then format('select count(*)::text || '':'' || md5(coalesce(string_agg(v::text, %L order by v::text), %L)) from public.%I v', '|', '', r.o)
                  else format('select count(*)::text || '':'' || md5(coalesce(string_agg(v::text, %L order by v::text), %L)) from public.%s v', '|', '', r.o) end;
    who := r.w; obj := r.o; result := pg_temp.try(case when r.w = 'admin' then v_admin end, q);
    return next;
  end loop;
end $f$;
`;

const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const run = async (query) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  let j; try { j = JSON.parse(body); } catch { j = body; }
  return { status: res.status, body: j };
};

const keyOf = (r) => `${r.who}:${r.obj}`;
function compare(a, b) {
  const A = new Map(a.map((r) => [keyOf(r), r.result]));
  const B = new Map(b.map((r) => [keyOf(r), r.result]));
  const diffs = [];
  for (const k of new Set([...A.keys(), ...B.keys()])) if (A.get(k) !== B.get(k)) diffs.push(`${k}  before=${A.get(k)}  after=${B.get(k)}`);
  const errs = a.filter((r) => r.result?.startsWith("ERR"));
  const nonEmpty = a.filter((r) => r.result && !r.result.startsWith("ERR") && !r.result.startsWith("0:"));
  const rows = nonEmpty.reduce((s, r) => s + Number(r.result.split(":")[0]), 0);
  console.log(`objects snapshotted: ${a.length} (admin ${a.filter((r) => r.who === "admin").length}, anon ${a.filter((r) => r.who === "anon").length})`);
  console.log(`objects that returned rows: ${nonEmpty.length}, total rows hashed: ${rows}, objects that errored (same both sides is not a regression): ${errs.length}`);
  for (const e of errs) console.log(`  ERR ${keyOf(e)}  ${e.result}`);
  console.log(`DIFFERENCES: ${diffs.length}`);
  for (const d of diffs) console.log(`  ${d}`);
  return diffs.length === 0 && nonEmpty.length > 0;
}

if (mode === "--snapshot") {
  const { status, body } = await run(`begin; ${HELPERS} select who, obj, result from pg_temp.snapshot(); rollback;`);
  if (status >= 300 || !Array.isArray(body)) { console.error("NOT CHECKED", status, JSON.stringify(body).slice(0, 400)); process.exit(2); }
  writeFileSync(argv[1], JSON.stringify(body));
  console.log(`wrote ${body.length} rows to ${argv[1]}`);
} else if (mode === "--diff") {
  process.exit(compare(JSON.parse(readFileSync(argv[1], "utf8")), JSON.parse(readFileSync(argv[2], "utf8"))) ? 0 : 1);
} else if (mode === "--harness") {
  const mig = readFileSync(argv[1], "utf8");
  // One transaction: before, migration, after; the report leaves as the message of a final exception so everything rolls back.
  const sql = `begin; ${HELPERS}
create temp table s0 as select * from pg_temp.snapshot();
${mig}
create temp table s1 as select * from pg_temp.snapshot();
do $d$ begin raise exception 'REPORT%', (select json_build_object('s0', (select json_agg(s0) from s0), 's1', (select json_agg(s1) from s1))::text); end $d$;`;
  const { body } = await run(sql);
  const text = typeof body === "object" && body?.message ? body.message : JSON.stringify(body);
  const i = text.indexOf("REPORT");
  if (i < 0) { console.error("NOT CHECKED", text.slice(0, 600)); process.exit(2); }
  const rep = JSON.parse(text.slice(i + 6).split(/\nCONTEXT:/)[0].trim());
  const ok = compare(rep.s0, rep.s1);
  console.log(ok ? "HARNESS: no difference (rolled back)" : "HARNESS: FAILED");
  process.exit(ok ? 0 : 1);
} else {
  console.error("usage: --harness <file.sql> | --snapshot <out.json> | --diff <a> <b>");
  process.exit(2);
}
