#!/usr/bin/env node
// Rewrite every Drive file/folder id in ONE database from the original id to its copy's id, using
// the mapping file scripts/drive-copy-tree.mjs wrote. For the cutover (#rqv5c): UAT's database is
// remapped onto its own copy of the tree so that deleting a file on UAT cannot touch the live one.
//
//   node scripts/drive-remap-ids.mjs --map <file> [--env test|uat] [--apply]
//
// DRY RUN BY DEFAULT. --apply is explicit. Re-runnable: a second run finds no original ids left and
// changes nothing. It prints the columns it found and a count per column.
//
// WHICH COLUMNS: found in the database at run time, not from a list in this file:
//   1. every text column in public base tables named *drive_file_id / *drive_folder_id (exact match);
//   (Ids inside JSON are deliberately NOT rewritten: on dev they occur only in audit_log.old_row/new_row,
//   a history that must not be falsified, and write_requests.result, 2 rows of past results. See the decision file.)
// The uuid columns (project_folder_id, parent_folder_id) and drive_id/drive_date are the app's own
// keys, not Drive ids, and are excluded by the text-type test. Views are excluded: they hold no data.
//
// WILL NOT RUN AGAINST PRODUCTION. The guard is on the Supabase PROJECT URL the chosen environment
// resolves to, through src/lib/app-env.ts (the same function that badges the site): only "dev" or
// "uat" proceed, and appEnvForSupabaseUrl returns "production" for every project it does not know.
// --env production is refused outright too. Note UAT is the OLD production project after the cutover,
// so the ref alone cannot be the guard: app-env.ts's UAT_PROJECT_REF, set by the cutover change, is.
import fs from "node:fs";
import { loadEnv, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(n);
  return i > -1 ? argv[i + 1] : d;
};
const APPLY = argv.includes("--apply");
const envName = arg("--env", "test");
const MAP = arg("--map");

async function main() {
  if (envName === "production") throw new Error("Refusing --env production: this script only ever writes to dev or UAT.");
  if (!MAP || !fs.existsSync(MAP)) throw new Error("Pass --map <file> from drive-copy-tree.mjs.");
  const env = loadEnv(envName);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const appEnv = appEnvForSupabaseUrl(url ?? "");
  if (appEnv !== "dev" && appEnv !== "uat") {
    throw new Error(`Refusing: ${projectRef(env)} is "${appEnv}" by src/lib/app-env.ts. Only dev and uat are allowed. Nothing was sent.`);
  }
  const ref = projectRef(env);
  const query = async (sql) => {
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`database: ${t.slice(0, 300)}`);
    return t ? JSON.parse(t) : [];
  };

  const pairs = fs.readFileSync(MAP, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l))
    .filter((m) => /^[A-Za-z0-9_-]{10,}$/.test(m.from) && /^[A-Za-z0-9_-]{10,}$/.test(m.to));
  const values = pairs.map((p) => `('${p.from}','${p.to}')`).join(",");
  console.log(`Environment: ${envName} (${appEnv}), project ${ref}. ${pairs.length} id pairs from ${MAP}.`);
  if (!pairs.length) return 0;

  const cols = await query(
    `select c.table_name t, c.column_name c from information_schema.columns c
       join information_schema.tables x using (table_schema, table_name)
      where c.table_schema='public' and x.table_type='BASE TABLE' and c.data_type='text'
        and c.column_name ~ 'drive_(file|folder)_id$' order by 1,2`,
  );
  console.log(`Exact-id columns found: ${cols.length}`);
  let total = 0;
  const map = `(values ${values}) as m(f,t)`;
  for (const { t, c } of cols) {
    const sql = APPLY
      ? `with u as (update public."${t}" x set "${c}" = m.t from ${map} where x."${c}" = m.f returning 1) select count(*)::int n from u`
      : `select count(*)::int n from public."${t}" x join ${map} on x."${c}" = m.f`;
    const [{ n }] = await query(sql);
    total += n;
    console.log(`  ${t}.${c}: ${n}`);
  }
  console.log(APPLY ? `APPLIED: ${total} values rewritten. Re-run: should print all zeros.` : `DRY RUN: ${total} values would change. Add --apply to write.`);
  return 0;
}

await exitWith(await main().catch((e) => { console.error(e.message); return 1; }));
