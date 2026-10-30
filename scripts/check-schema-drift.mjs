// Compare the column-level shape of two Supabase databases, read-only.
//
//   node scripts/check-schema-drift.mjs --against <project-ref>
//       # this environment (default test = dev) vs another project, e.g. the
//       # throwaway project a from-zero rehearsal was built on
//   node scripts/check-schema-drift.mjs --env production --against <project-ref>
//   node scripts/check-schema-drift.mjs --env production --against-env test
//       # production vs dev, for the release manager after the cutover
//
// It reads information_schema.columns for the public schema on both sides
// (table, column, type, nullability, default) and prints every difference.
// Exit 0 only when there are none. It writes nothing to either database and
// prints project refs only, never connection details.
//
// Why it exists: dev was baselined, not built from the files, and two columns
// were once changed by hand (docs/decisions/2026-10-16-hand-edited-columns-
// restated.md). apply-migrations --drift compares which *files* ran; this
// compares what the files actually produced. Uses SUPABASE_ACCESS_TOKEN, which
// must be able to see both projects, or set REHEARSAL_SUPABASE_ACCESS_TOKEN
// for the --against side when that project is under another account.
//
// Defaults ignore the `schema_migrations` bookkeeping table. Views, functions
// and policies are not compared here; columns are what the app's SQL breaks on.

import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
function flag(n) {
  const i = rest.indexOf(n);
  return i >= 0 ? rest[i + 1] : null;
}
const againstRef = flag("--against");
const againstEnv = flag("--against-env");
if (!againstRef && !againstEnv) {
  console.error("Give --against <project-ref> or --against-env <test|uat|production>.");
  process.exit(2);
}
if (againstRef && !/^[a-z0-9]{20}$/.test(againstRef)) {
  console.error("--against needs a 20-character Supabase project ref.");
  process.exit(2);
}

const env = loadEnv(envName);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!env.NEXT_PUBLIC_SUPABASE_URL || !token) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required.");
  process.exit(2);
}
const leftRef = refOf(env);
const rightRef = againstRef ?? refOf(loadEnv(againstEnv));
if (leftRef === rightRef) {
  console.error("Both sides are the same project.");
  process.exit(2);
}

const SQL = `
  select table_name, column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public' and table_name <> 'schema_migrations'
  order by table_name, column_name`;

async function columns(ref, token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: SQL }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`project ${ref}: ${res.status} ${text.slice(0, 200)}`);
  const map = new Map();
  for (const r of JSON.parse(text)) {
    map.set(`${r.table_name}.${r.column_name}`, `${r.data_type}, ${r.is_nullable === "YES" ? "nullable" : "not null"}, default ${r.column_default ?? "none"}`);
  }
  return map;
}

console.log(`Comparing ${leftRef} (${envName}) with ${rightRef}`);
// A project under another Supabase account needs its own token (the rehearsal project does).
const rightToken = (againstRef && env.REHEARSAL_SUPABASE_ACCESS_TOKEN) || token;
const [left, right] = await Promise.all([columns(leftRef, token), columns(rightRef, rightToken)]);

const lines = [];
for (const k of [...new Set([...left.keys(), ...right.keys()])].sort()) {
  const a = left.get(k);
  const b = right.get(k);
  if (a === b) continue;
  if (!a) lines.push(`only in ${rightRef}: ${k} (${b})`);
  else if (!b) lines.push(`only in ${leftRef}: ${k} (${a})`);
  else lines.push(`differs: ${k}\n    ${leftRef}: ${a}\n    ${rightRef}: ${b}`);
}
console.log(`${left.size} columns vs ${right.size} columns.`);
if (lines.length) {
  console.log(lines.join("\n"));
  console.log(`\n${lines.length} difference(s).`);
  await exitWith(1);
} else {
  console.log("No differences.");
}
