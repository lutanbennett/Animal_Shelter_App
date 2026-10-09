// Discovery, not assertion: for anon and every role, what does each table and view in
// the API schema actually answer? The check-* scripts each assert a list someone wrote;
// this asks the reverse question and prints everything that answers at all, so the
// result can be compared with what those lists cover. Written for the security
// assessment's dynamic half (docs/security/security-assessment-2026-10-09-dynamic.md).
//
//   node scripts/probe-role-surface.mjs            (from the repo root; dev only)
//   node scripts/probe-role-surface.mjs --json     (the raw matrix, for diffing a later run)
//
// One request per principal, each a transaction that is rolled back, under that
// principal's own JWT (anon: no subject). For every relation in `public` that anon or
// authenticated holds any grant on:
//   read    rows `select count(*)` sees
//   update  rows `update … set <first column> = <itself>` reaches (then rolled back)
//   delete  rows `delete` reaches (then rolled back, cascades and all)
//   insert  what `insert … default values` meets first: `rls` (refused by a policy
//           or a missing grant), or `passes` (it got past RLS to a constraint or a
//           trigger). An empty row is not a real one, so `rls` can hide a scoped insert
//           policy that a real row would pass: read it as "no unconditional insert".
// Writes nothing: every write is undone inside its own subtransaction, and the whole
// request ends in a raised exception.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// who: the role key held (null = none); arch: the user_roles row is archived; aal: the token's level.
// No staff principal since 0173 retired the role: a live staff row is refused by user_roles_take_live_role().
const PRINCIPALS = [
  { name: "anon" },
  { name: "norole", role: null },
  { name: "archived", role: "volunteer", arch: true },
  { name: "public_viewer", role: "public_viewer" },
  { name: "volunteer", role: "volunteer" },
  { name: "doctor", role: "doctor" },
  { name: "head_of_maintenance", role: "head_of_maintenance" },
  { name: "head_of_medical", role: "head_of_medical" },
  { name: "second_in_command", role: "second_in_command" },
  { name: "management", role: "management" },
  { name: "admin", role: "admin" },
  { name: "admin_aal2", role: "admin", aal: "aal2" },
];

async function run(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let msg = text;
  try { msg = JSON.parse(text).message ?? text; } catch {}
  const m = /PROBE-RESULT (.*)/s.exec(msg);
  if (!m) throw new Error(`no result (status ${res.status}): ${String(msg).slice(0, 1200)}`);
  return JSON.parse(m[1].replace(/\nCONTEXT:[\s\S]*$/, ""));
}

function principalSql(p) {
  const id = randomUUID();
  const setup = p.name === "anon" ? "" : `
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('${id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-surface-${p.name}@example.invalid', '{}', '{"full_name":"Harness surface"}', now(), now());
  ${p.role ? `insert into user_roles (user_id, role_id, role, archived_at) select '${id}', id, legacy_role, ${p.arch ? "now()" : "null"} from roles where key = '${p.role}';` : ""}
  ${p.role === "doctor" ? `with d as (insert into doctors (name, user_id) values ('Harness surface doctor', '${id}') returning id) insert into doctor_clinics (clinic_id, doctor_id) select (select id from clinics order by id limit 1), id from d;` : ""}`;
  const claims = p.name === "anon"
    ? `json_build_object('role', 'anon')`
    : `json_build_object('sub', '${id}', 'role', 'authenticated', 'aal', '${p.aal ?? "aal1"}')`;
  return `
begin;
set local statement_timeout = '300s';
do $s$ begin ${setup}
end $s$;
create temp table rels as
  select c.relname::text as rel, c.relkind::text as kind,
         (select a.attname::text from pg_attribute a where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
            and a.attgenerated = '' and a.attidentity = '' order by a.attnum limit 1) as col,
         (select string_agg(quote_ident(a.attname), ', ' order by a.attnum) from pg_attribute a where a.attrelid = c.oid and a.attnum > 0
            and not a.attisdropped and a.attgenerated = '' and a.attidentity <> 'a') as cols,
         null::jsonb as sample
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p')
     and (has_table_privilege('anon', c.oid, 'select,insert,update,delete') or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete'));
-- A real row to copy for the insert probe, read before the role switch; a fresh id so only RLS,
-- a trigger or a constraint can stop it. user_roles: the copy names the prober and the admin
-- role, which is the escalation worth asking about.
do $r$ declare t record; begin
  for t in select rel from rels where kind in ('r', 'p') loop
    execute format('update rels set sample = (select to_jsonb(x) from public.%I x limit 1) where rel = %L', t.rel, t.rel);
  end loop;
  update rels set sample = sample || jsonb_build_object('id', gen_random_uuid()) where sample ? 'id' and sample->>'id' ~ '^[0-9a-f-]{36}$';
  update rels set sample = sample || jsonb_build_object('user_id', '${id}', 'role_id', (select id from roles where key = 'admin'), 'role', 'admin', 'archived_at', null)
   where rel = 'user_roles';
end $r$;
create temp table out (rel text, kind text, rd text, up text, de text, ins text);
grant select on rels to anon, authenticated;
grant all on out to anon, authenticated;
do $p$
declare t record; n bigint; v_rd text; v_up text; v_de text; v_ins text;
begin
  perform set_config('request.jwt.claims', (${claims})::text, true);
  execute 'set local role ${p.name === "anon" ? "anon" : "authenticated"}';
  for t in select * from rels order by rel loop
    begin execute format('select count(*) from public.%I', t.rel) into n; v_rd := n::text;
    exception when others then v_rd := 'E' || sqlstate; end;
    begin
      execute format('update public.%I set %I = %I', t.rel, t.col, t.col); get diagnostics n = row_count;
      raise exception 'PROBE-UNDO %', n;
    exception when others then
      v_up := case when sqlerrm like 'PROBE-UNDO %' then substr(sqlerrm, 12) else 'E' || sqlstate || ' ' || left(sqlerrm, 60) end;
    end;
    begin
      execute format('delete from public.%I', t.rel); get diagnostics n = row_count;
      raise exception 'PROBE-UNDO %', n;
    exception when others then
      v_de := case when sqlerrm like 'PROBE-UNDO %' then substr(sqlerrm, 12) else 'E' || sqlstate || ' ' || left(sqlerrm, 60) end;
    end;
    begin
      if t.kind = 'v' then raise exception 'PROBE-UNDO view'; end if;
      if t.sample is null then execute format('insert into public.%I default values', t.rel);
      else execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1)', t.rel, t.cols, t.cols, t.rel) using t.sample;
      end if;
      raise exception 'PROBE-UNDO inserted';
    exception when others then
      v_ins := case when sqlerrm = 'PROBE-UNDO view' then 'view' when sqlerrm like 'PROBE-UNDO %' then 'inserted'
                    when sqlstate = '42501' then 'rls'
                    else 'passes ' || sqlstate || ' ' || left(sqlerrm, 60) end;
    end;
    insert into out values (t.rel, t.kind, v_rd, v_up, v_de, v_ins);
  end loop;
  execute 'reset role';
end $p$;
do $o$ begin raise exception 'PROBE-RESULT %', (select json_agg(out) from out); end $o$;
rollback;`;
}

const result = {};
for (const p of PRINCIPALS) {
  result[p.name] = await run(principalSql(p));
  process.stderr.write(`${p.name} `);
}
process.stderr.write("\n");

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 1));
} else {
  // One line per relation: the principals that reach it, and how. A number is rows;
  // "-" is nothing (0 rows, or refused before a row was touched).
  const short = (v) => (v === "0" || v === "rls" || /^E42501/.test(v) ? "-" : v.startsWith("passes") ? "passes" : v.startsWith("E") ? v.slice(0, 6) : v);
  const rels = result.admin.map((r) => r.rel);
  for (const op of ["rd", "up", "de", "ins"]) {
    console.log(`\n== ${{ rd: "read", up: "update", de: "delete", ins: "insert (empty row)" }[op]}`);
    console.log("relation".padEnd(36) + PRINCIPALS.map((p) => p.name.slice(0, 9).padStart(10)).join(""));
    for (const rel of rels) {
      const cells = PRINCIPALS.map((p) => short(result[p.name].find((r) => r.rel === rel)?.[op] ?? "?"));
      if (cells.every((c) => c === "-")) continue;
      console.log(rel.padEnd(36) + cells.map((c) => c.slice(0, 9).padStart(10)).join(""));
    }
  }
}
