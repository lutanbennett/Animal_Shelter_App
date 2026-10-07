// resident-view-grants (0160): six internal views carried insert, update, delete and truncate grants to
// `authenticated` from the project's default privileges (finding C12, docs/roles-and-permissions.md §3).
//
//   node scripts/check-view-write-grants.mjs            (from the repo root; dev only) after 0160: every write refused
//   node scripts/check-view-write-grants.mjs --before   before 0160: what the grants could actually do
//   node scripts/check-view-write-grants.mjs --with supabase/migrations/0160_view_write_grants.sql
//        the after-check with the file run first in the same transaction, which the harness's closing
//        `raise exception` rolls back: proof of a pending migration without applying it
//
// For one live login of every role, under that login's own JWT (set local role authenticated +
// request.jwt.claims), it tries insert, update, delete and truncate on each view, and a select. Every attempt runs
// in its own sub-block that ends in `raise exception`, and the whole DO block ends in one too, so nothing it writes
// is kept (CLAUDE.md, "Database migrations"). project_folder_summary is the one auto-updatable view, so each of its
// writes is also tried straight on project_folders, the table underneath, for the same login.
//
// Asserted, after (default):
//   1. authenticated and anon hold no insert, update, delete, truncate, references or trigger on any of the six;
//   2. no write on any view touches a row for any role. On project_folder_summary that is 42501 (no grant). On
//      the other five the error does not change (55000, 42809): Postgres refuses a non-updatable view before it
//      looks at grants, which is exactly why those grants were inert;
//   3. every select still succeeds.
// Asserted, --before:
//   1. no write to the five non-updatable views changes a row, for any role (they error before any row);
//   2. a write through project_folder_summary changes exactly as many rows as the same write on project_folders
//      for that login: the grant was live there, but bounded by project_folders' own policies (security_invoker).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const before = process.argv.includes("--before");
const withIdx = process.argv.indexOf("--with");
const withFile = withIdx > 0 ? readFileSync(join(root, process.argv[withIdx + 1]), "utf8") : "";

const VIEWS = [
  "resident_list_view",
  "project_folder_summary",
  "immunization_next_due",
  "frequency_round_status",
  "prescription_round_status",
  "resident_diet_round_status",
];

const sql = `${withFile ? `begin;\n${withFile}\n` : ""}
do $$
declare
  views text[] := array[${VIEWS.map((v) => `'${v}'`).join(",")}];
  u record; v text; col text; stmt text; kind text;
  n int; out text := '';
  function_result text;
begin
  foreach v in array views loop
    foreach kind in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
      out := out || format('grant|%s|%s|%s', v, kind,
        has_table_privilege('authenticated', 'public.' || v, kind) or has_table_privilege('anon', 'public.' || v, kind)) || E'\\n';
    end loop;
  end loop;
  for u in
    select distinct on (r.key) r.key, ur.user_id
      from user_roles ur join roles r on r.id = ur.role_id
     where ur.archived_at is null and r.archived_at is null
     order by r.key, ur.created_at
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', u.user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
    set local role authenticated;
    foreach v in array views loop
      select c.column_name into col from information_schema.columns c
       where c.table_schema = 'public' and c.table_name = v and c.column_name <> 'id' order by c.ordinal_position limit 1;
      foreach kind in array array['select', 'insert', 'update', 'delete', 'truncate',
                                  'base-update', 'base-delete'] loop
        if kind like 'base-%' and v <> 'project_folder_summary' then continue; end if;
        stmt := case kind
          when 'select' then format('select count(*) from %I', v)
          when 'insert' then format('with d as (insert into %I default values returning 1) select count(*) from d', v)
          when 'update' then format('with d as (update %I set %I = %I returning 1) select count(*) from d', v, col, col)
          when 'delete' then format('with d as (delete from %I returning 1) select count(*) from d', v)
          when 'truncate' then format('truncate %I', v)
          when 'base-update' then format('with d as (update project_folders set %I = %I returning 1) select count(*) from d', col, col)
          when 'base-delete' then 'with d as (delete from project_folders returning 1) select count(*) from d'
        end;
        begin
          n := null;
          execute stmt into n;
          raise exception using errcode = 'P0099', message = coalesce(n::text, 'ok');
        exception when others then
          function_result := case when sqlstate = 'P0099' then 'ROWS ' || sqlerrm else sqlstate end;
          out := out || format('%s|%s|%s|%s', u.key, v, kind, function_result) || E'\\n';
        end;
      end loop;
    end loop;
    reset role;
  end loop;
  raise exception E'HARNESS-OUT\\n%', out;
end $$;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const body = await res.text();
const marker = body.indexOf("HARNESS-OUT");
if (marker < 0) {
  console.log(body.slice(0, 3000));
  console.log("\nRESULT: RED (the harness did not run)");
  process.exitCode = 1;
} else {
  const text = JSON.parse(body).message ?? body;
  const lines = text.slice(text.indexOf("HARNESS-OUT") + 12).split("\n").filter((l) => l.includes("|"));
  const rows = lines.map((l) => {
    const [role, view, kind, result] = l.split("|");
    return { role, view, kind, result: result.trim() };
  });
  const fails = [];
  const at = (role, view, kind) => rows.find((r) => r.role === role && r.view === view && r.kind === kind)?.result;
  const roles = [...new Set(rows.filter((r) => r.role !== "grant").map((r) => r.role))];

  console.log(`${before ? "BEFORE" : withFile ? "AFTER (in a rolled-back transaction)" : "AFTER"} 0160, ${roles.length} roles x ${VIEWS.length} views (ROWS n = the statement ran and touched n rows; otherwise the SQLSTATE)\n`);
  for (const view of VIEWS) {
    console.log(view);
    for (const role of roles) {
      const cells = ["select", "insert", "update", "delete", "truncate", "base-update", "base-delete"]
        .map((k) => [k, at(role, view, k)])
        .filter(([, r]) => r !== undefined)
        .map(([k, r]) => `${k}=${r}`);
      console.log(`  ${role.padEnd(20)} ${cells.join("  ")}`);
    }
  }

  const held = rows.filter((r) => r.role === "grant" && r.result === "t");
  console.log(`
Write privileges authenticated or anon still hold on these views: ${held.length ? held.map((r) => `${r.view} ${r.kind}`).join(", ") : "none"}`);
  for (const r of rows) {
    if (r.role === "grant") {
      if (!before && r.result === "t") fails.push(`authenticated or anon still holds ${r.kind} on ${r.view}`);
      continue;
    }
    if (r.kind === "select") {
      if (!r.result.startsWith("ROWS")) fails.push(`${r.role} cannot select ${r.view}: ${r.result}`);
      continue;
    }
    if (r.kind.startsWith("base-")) continue;
    if (!before) {
      if (r.result.startsWith("ROWS")) fails.push(`${r.role} ${r.kind} on ${r.view} ran: ${r.result}`);
      else if (r.view === "project_folder_summary" && r.kind !== "truncate" && r.result !== "42501")
        fails.push(`${r.role} ${r.kind} on project_folder_summary: ${r.result}, expected 42501`);
    } else if (r.view !== "project_folder_summary") {
      if (r.result.startsWith("ROWS")) fails.push(`${r.role} ${r.kind} on ${r.view} ran: ${r.result}`);
    } else if (r.kind === "update" || r.kind === "delete") {
      const base = at(r.role, r.view, `base-${r.kind}`);
      if (r.result !== base) fails.push(`${r.role} ${r.kind} through project_folder_summary gave ${r.result}, project_folders gave ${base}`);
    }
  }

  console.log(`\n${rows.length} statements, ${fails.length} failed.`);
  if (fails.length) {
    console.log(fails.join("\n"));
    console.log("\nRESULT: RED");
    process.exitCode = 1;
  } else if (before) {
    console.log("RESULT: GREEN (before: five views' write grants are inert; project_folder_summary's are live but no wider than project_folders')");
  } else {
    console.log("RESULT: GREEN (after: no role can write through any of the six views; every select still works)");
  }
}
