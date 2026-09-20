// Apply supabase/migrations/*.sql to the Supabase project in .env.local,
// recording each file in a `schema_migrations` table so the database itself
// knows what has been applied — no memory notes, no "did I run 0026?".
//
//   node scripts/apply-migrations.mjs            # apply every unapplied file
//   node scripts/apply-migrations.mjs --status   # list applied / pending, change nothing
//   node scripts/apply-migrations.mjs --dry-run  # run pending files inside begin…rollback
//   node scripts/apply-migrations.mjs --baseline 0027_prescriptions.sql
//       # mark every file up to and including that one as applied WITHOUT
//       # running it — for a database that was migrated by hand before this
//       # script existed (the dev project, as of 2026-09-20)
//
// Each file runs in its own transaction together with its schema_migrations
// insert, so a failing file leaves nothing behind and the run stops there;
// fix the file and re-run. Files are applied in filename order and must
// never be edited once applied — write a new one.
//
// There's no psql or Supabase CLI link on the dev machine; the SQL goes to
// the Management API's query endpoint with the personal access token in
// SUPABASE_ACCESS_TOKEN. The project is taken from NEXT_PUBLIC_SUPABASE_URL,
// so pointing .env.local at production migrates production (README,
// "Deploying to Cloudflare", step 3). The target is printed before anything
// runs.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "supabase/migrations";

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(".env.local")) {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      if (!line.includes("=") || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i).trim();
      if (!(key in env)) env[key] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const token = env.SUPABASE_ACCESS_TOKEN;
if (!url || !token) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required.");
  process.exit(2);
}
const projectRef = new URL(url).hostname.split(".")[0];

const args = process.argv.slice(2);
const statusOnly = args.includes("--status");
const dryRun = args.includes("--dry-run");
const baselineIndex = args.indexOf("--baseline");
const baseline = baselineIndex >= 0 ? args[baselineIndex + 1] : null;
if (baselineIndex >= 0 && !baseline) {
  console.error("--baseline needs a migration filename, e.g. --baseline 0027_prescriptions.sql");
  process.exit(2);
}

async function query(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      // not JSON — keep the raw body
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

// Postgres dollar-quoting keeps the file contents out of the SQL literal.
function literal(value) {
  return `$mig$${value}$mig$`;
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();

console.log(`Project: ${projectRef} (${url})`);

await query(`
  create table if not exists schema_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  );
  alter table schema_migrations enable row level security;
`);

const applied = new Set(
  (await query("select filename from schema_migrations order by filename")).map(
    (row) => row.filename,
  ),
);

if (baseline) {
  if (!files.includes(baseline)) {
    console.error(`${baseline} is not in ${MIGRATIONS_DIR}.`);
    process.exit(2);
  }
  const toMark = files.filter((name) => name <= baseline && !applied.has(name));
  if (toMark.length === 0) {
    console.log(`Nothing to baseline — everything up to ${baseline} is already recorded.`);
  } else {
    await query(
      `insert into schema_migrations (filename) values ${toMark
        .map((name) => `(${literal(name)})`)
        .join(", ")} on conflict do nothing;`,
    );
    console.log(`Recorded ${toMark.length} file(s) as applied without running them:`);
    for (const name of toMark) console.log(`  ${name}`);
    for (const name of toMark) applied.add(name);
  }
}

const pending = files.filter((name) => !applied.has(name));
console.log(`${applied.size} applied, ${pending.length} pending.`);

if (statusOnly || pending.length === 0) {
  for (const name of pending) console.log(`  pending: ${name}`);
  process.exit(0);
}

for (const name of pending) {
  const sql = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
  process.stdout.write(`${dryRun ? "dry-run" : "applying"} ${name} … `);
  try {
    await query(
      `begin;\n${sql}\ninsert into schema_migrations (filename) values (${literal(name)});\n${
        dryRun ? "rollback" : "commit"
      };`,
    );
    console.log("ok");
  } catch (error) {
    console.log("FAILED");
    console.error(error.message);
    console.error(`Stopped at ${name}; nothing from it was kept. Fix the file and re-run.`);
    process.exit(1);
  }
}

if (dryRun) console.log("Dry run only — nothing was applied.");
