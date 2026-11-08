#!/usr/bin/env node
// READ-ONLY. After drive-remap-ids.mjs (#rqv5c): is every Drive id in this database one of the copies?
//
//   node scripts/check-drive-leftovers.mjs --map <file> [--env uat|test]
//
// drive-remap-ids.mjs rewrites only the ids it has a copy for, and its re-run "all zeros" counts only
// ORIGINAL ids from the map. A record pointing at a Drive file OUTSIDE the copied tree is invisible to
// both, and on UAT it would still name a production file a tester could delete. This counts, per
// *drive_file_id / *drive_folder_id column, the non-empty ids that are not a copy. It changes nothing.
//
// Same guard as drive-remap-ids.mjs: only a project src/lib/app-env.ts calls "dev" or "uat".
// Prints table and column names and counts only.
import fs from "node:fs";
import { loadEnv, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";
import { parseMap, leftoverSql, WRITABLE_APP_ENVS } from "./lib/drive-map.mjs";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(n);
  return i > -1 ? argv[i + 1] : d;
};
const envName = arg("--env", "uat");
const MAP = arg("--map");

async function main() {
  if (envName === "production") throw new Error("Refusing --env production: this check is for the copies, dev or UAT.");
  if (!MAP || !fs.existsSync(MAP)) throw new Error("Pass --map <file> from drive-copy-tree.mjs.");
  const env = loadEnv(envName);
  const appEnv = appEnvForSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (!WRITABLE_APP_ENVS.has(appEnv)) {
    throw new Error(`Refusing: ${projectRef(env)} is "${appEnv}" by src/lib/app-env.ts. Only dev and uat. Nothing was sent.`);
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

  const pairs = parseMap(fs.readFileSync(MAP, "utf8"));
  if (!pairs.length) throw new Error(`${MAP} holds no id pairs.`);
  console.log(`Environment: ${envName} (${appEnv}), project ${ref}. ${pairs.length} copies in ${MAP}. READ-ONLY.`);
  const cols = await query(
    `select c.table_name t, c.column_name c from information_schema.columns c
       join information_schema.tables x using (table_schema, table_name)
      where c.table_schema='public' and x.table_type='BASE TABLE' and c.data_type='text'
        and c.column_name ~ 'drive_(file|folder)_id$' order by 1,2`,
  );
  let outside = 0;
  let original = 0;
  for (const { t, c } of cols) {
    const [r] = await query(leftoverSql(t, c, pairs));
    if (r.outside) console.log(`  ${t}.${c}: ${r.outside} not a copy` + (r.original ? ` (${r.original} still the original id)` : ""));
    outside += r.outside;
    original += r.original;
  }
  if (!outside) {
    console.log(`CLEAN: every Drive id in ${cols.length} columns is one of the copies.`);
    return 0;
  }
  console.log(`LEFTOVERS: ${outside} ids are not copies (${original} still original: run drive-remap-ids.mjs --apply).`);
  console.log("The rest point outside the copied tree. Stop and look before letting anyone test.");
  return 1;
}

await exitWith(await main().catch((e) => { console.error(e.message); return 1; }));
