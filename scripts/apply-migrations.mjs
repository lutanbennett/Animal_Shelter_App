// Apply supabase/migrations/*.sql to one environment's Supabase project,
// recording each file in a `schema_migrations` table so the database itself
// knows what has been applied — no memory notes, no "did I run 0026?".
//
//   node scripts/apply-migrations.mjs            # apply every unapplied file (dev/test)
//   node scripts/apply-migrations.mjs --env uat           # after the cutover
//   node scripts/apply-migrations.mjs --env production
//   node scripts/apply-migrations.mjs --status   # list applied / pending, change nothing
//   node scripts/apply-migrations.mjs --drift production
//       # diff that database's schema_migrations against the files on
//       # origin/main, both ways; exits 1 if they disagree (same as
//       # `--drift --env production`)
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
// Two lists of files matter, and they are not the same thing. The working
// tree's supabase/migrations/ is what gets *applied*; the files on
// origin/main are what a database *should* hold, because schema reaches main
// before any database (CLAUDE.md, "Database migrations"). --status and
// --drift report against origin/main so a feature branch's own files can't
// hide a gap — that was the bug: 0069 sat on production with no file on
// main, and --status said "0 pending" throughout (decisions.md 2026-09-22).
// For the same reason uat and production refuse to write from a checkout
// whose migration files differ from origin/main's in any way, before any
// environment file is read or any database is reached. There is no flag
// that overrides it; merge the migration first.
//
// There's no psql or Supabase CLI link on the dev machine; the SQL goes to
// the Management API's query endpoint with the personal access token in
// SUPABASE_ACCESS_TOKEN (which must be able to see every project it targets).
// The project comes from NEXT_PUBLIC_SUPABASE_URL of the chosen environment
// (scripts/lib/env.mjs: .env.local for test, .env.deploy.uat or
// .env.deploy.production layered on top for the other two). The target's
// project ref is printed before anything runs — and nothing else about the
// connection, since this output gets pasted into PRs and chat.

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ENVIRONMENTS, loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { MIGRATION_NAME, MIGRATIONS_DIR, parseLsTree } from "./lib/migrations.mjs";
// Shared with Settings → System status, so the page and --drift agree.
import { migrationDrift } from "../src/lib/migration-drift.ts";

// `--drift <env>` is shorthand for `--drift --env <env>`.
const argv = process.argv.slice(2);
{
  const i = argv.indexOf("--drift");
  if (i >= 0 && ENVIRONMENTS.includes(argv[i + 1])) {
    if (argv.includes("--env")) {
      console.error("Give the environment once: --drift <env> or --drift --env <env>, not both.");
      process.exit(2);
    }
    argv.splice(i + 1, 1, "--env", argv[i + 1]);
  }
}
const { name: envName, rest: args } = parseEnvArg(argv);

const statusOnly = args.includes("--status");
const drift = args.includes("--drift");
const dryRun = args.includes("--dry-run");
const baselineIndex = args.indexOf("--baseline");
const baseline = baselineIndex >= 0 ? args[baselineIndex + 1] : null;
if (baselineIndex >= 0 && !baseline) {
  console.error("--baseline needs a migration filename, e.g. --baseline 0027_prescriptions.sql");
  process.exit(2);
}
const readOnly = statusOnly || drift;
// Environments where a database write is something the shelter lives with.
const GUARDED = envName === "uat" || envName === "production";

function git(gitArgs) {
  const r = spawnSync("git", gitArgs, { encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((name) => MIGRATION_NAME.test(name))
  .sort();

// The files on origin/main, name → blob id, fetched fresh. A failed fetch is
// fatal only where it decides a write; a report says how old its reference is.
const fetched = git(["fetch", "origin", "main", "--quiet"]);
const mainTree = git(["ls-tree", "origin/main", `${MIGRATIONS_DIR}/`]);
if (!mainTree.ok) {
  console.error(`Could not read origin/main: ${mainTree.err || "git ls-tree failed"}`);
  process.exit(2);
}
const mainBlobs = parseLsTree(mainTree.out);
const mainFiles = [...mainBlobs.keys()].sort();
const mainSha = git(["rev-parse", "--short", "origin/main"]).out;

if (GUARDED && !readOnly) {
  // Every file here must be on origin/main with the same content, and every
  // file on origin/main must be here: anything else is applying schema that
  // main doesn't have, or skipping schema it does.
  const problems = [];
  if (!fetched.ok) problems.push(`could not fetch origin/main (${fetched.err || "git fetch failed"}), so what main holds is unknown`);
  const hashes = files.length
    ? git(["hash-object", ...files.map((name) => `${MIGRATIONS_DIR}/${name}`)]).out.split("\n")
    : [];
  files.forEach((name, i) => {
    if (!mainBlobs.has(name)) problems.push(`${name} is not on origin/main`);
    else if (mainBlobs.get(name) !== hashes[i]) problems.push(`${name} differs from origin/main's copy`);
  });
  for (const name of mainFiles) {
    if (!files.includes(name)) problems.push(`${name} is on origin/main but not in this checkout — sync first`);
  }
  if (problems.length) {
    const what = dryRun ? "dry-runs" : baseline ? "records" : "applies";
    console.error(
      `apply-migrations: ${envName} ${what} migrations only from a checkout whose ${MIGRATIONS_DIR}/ matches origin/main (${mainSha}):\n  - ` +
        problems.join("\n  - ") +
        "\nSchema reaches main before any database. Merge the migration's PR, then run this from the main checkout." +
        "\nNothing was read from or sent to any database.",
    );
    process.exit(2);
  }
}

const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const token = env.SUPABASE_ACCESS_TOKEN;
if (!url || !token) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required.");
  process.exit(2);
}
const projectRef = refOf(env);

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

console.log(`Environment: ${envName} — project ${projectRef}`);

// A report changes nothing, not even by creating the table it reads.
let hasTable = true;
if (readOnly) {
  [{ exists: hasTable }] = await query(
    "select to_regclass('public.schema_migrations') is not null as exists",
  );
  if (!hasTable) console.log("No schema_migrations table here — nothing has been applied by this script.");
} else {
  await query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
    alter table schema_migrations enable row level security;
  `);
}

const applied = new Set(
  hasTable
    ? (await query("select filename from schema_migrations order by filename")).map((row) => row.filename)
    : [],
);

/**
 * Both halves of the gap between this database and origin/main. Names only —
 * this is what gets pasted into chat and PRs.
 */
function driftReport() {
  const { unapplied, missingFile } = migrationDrift(applied, mainFiles);
  const stale = fetched.ok ? "" : " (as of the last fetch — git fetch failed just now)";
  console.log(`Against origin/main ${mainSha}${stale}: ${mainFiles.length} file(s), ${applied.size} applied row(s).`);
  console.log(`  On origin/main, not applied here: ${unapplied.length}`);
  for (const name of unapplied) console.log(`    ${name}`);
  console.log(`  Applied here, no file on origin/main: ${missingFile.length}`);
  for (const name of missingFile) console.log(`    ${name}`);
  return missingFile.length + unapplied.length;
}

if (drift) {
  const gaps = driftReport();
  console.log(gaps ? `Drift: ${envName} and origin/main disagree.` : `No drift: ${envName} matches origin/main.`);
  process.exit(gaps ? 1 : 0);
}

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
console.log(`This checkout: ${applied.size} applied, ${pending.length} pending.`);

if (statusOnly || pending.length === 0) {
  for (const name of pending) {
    console.log(`  pending: ${name}${mainBlobs.has(name) ? "" : " (not on origin/main)"}`);
  }
  if (statusOnly) driftReport();
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
