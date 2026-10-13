// Rehearse a restore of a backup made by scripts/backup.mjs, on this machine,
// and check that it came back whole. README "Backups" → "Rehearsing a restore".
//
//   node scripts/restore-rehearsal.mjs C:\Temp\lannacare-restore\lannacare-production-<ts>.dump.age --identity C:\Temp\lannacare-restore\key.txt
//   node scripts/restore-rehearsal.mjs <file>.dump.age --identity <key file> --keep
//       # leave the scratch database running afterwards, to look around in it
//
// What it does, in order:
//   1. Makes a throwaway PostgreSQL server in a new folder under %TEMP% (initdb,
//      then pg_ctl on --port, default 55432, listening on this machine only).
//   2. Creates the few things every Supabase project has before a dump arrives
//      (the anon/authenticated/service_role roles, the `extensions` schema with
//      pgcrypto and uuid-ossp), so the dump's policies and functions resolve.
//   3. Decrypts the backup IN MEMORY and pipes it straight into pg_restore, so
//      no plaintext .dump file is ever written.
//   4. Checks, rather than trusting pg_restore's exit status (it exits 1 on two
//      errors every restore of these dumps produces, and 0 is no proof either):
//        - every pg_restore error is one of the two known-harmless ones
//        - every table's row count equals the count inside the archive
//        - the tables, views, functions, policies and triggers in the archive
//          all exist in the database
//        - public.schema_migrations came across, and names the newest file
//   5. Stops the server and deletes its folder, the data with it, whether the
//      checks passed or not (unless --keep).
//
// What this does NOT prove: that a Supabase project comes back. Ownership,
// grants, Supabase's own auth schema and signing in are all Supabase-side, and
// the roles made in step 2 are empty stand-ins. That half is its own backlog
// item (docs/decisions/2026-10-13-restore-rehearsal-local.md).
//
// Needs PostgreSQL 17's server programs (initdb, pg_ctl, postgres) as well as
// the client ones, found where backup.mjs looks for pg_dump; README "Backups"
// says how to get them. Exit status 0 only when every check passed.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { decryptBackup } from "./lib/backup-crypto.mjs";

const MIN_PG_MAJOR = 17;
const SCHEMAS = ["public", "private", "auth"];

// pg_restore errors every restore of these dumps produces, and why they are harmless.
const EXPECTED_ERRORS = [
  {
    pattern: /schema "public" already exists/,
    why: "every new database starts with an empty public schema",
  },
  {
    pattern: /relation "auth\.flow_state" does not exist/,
    why: "backup.mjs leaves out auth.flow_state (a session table), so the one key pointing at it has nothing to point to",
  },
];

const PREP_SQL = `
do $$ declare r text; begin
  foreach r in array array['anon','authenticated','service_role','authenticator','supabase_auth_admin','supabase_admin','dashboard_user','pgbouncer'] loop
    if not exists (select 1 from pg_roles where rolname = r) then execute format('create role %I nologin', r); end if;
  end loop; end $$;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
`;

const args = process.argv.slice(2);
const input = args.find((a, i) => !a.startsWith("--") && !["--identity", "--port"].includes(args[i - 1]));
const identityFile = valueOf("--identity");
const port = Number(valueOf("--port") ?? 55432);
const keep = args.includes("--keep");

if (!input || !identityFile) fail("Usage: node scripts/restore-rehearsal.mjs <file>.dump.age --identity <private-key-file> [--port 55432] [--keep]");
if (!existsSync(input)) fail(`${input} not found.`);
if (!existsSync(identityFile)) {
  const hint = existsSync(`${identityFile}.txt`) ? ` (there is a ${identityFile}.txt — Notepad adds .txt to a name that already ends in .txt)` : "";
  fail(`${identityFile} not found${hint}.`);
}
const identity = readFileSync(identityFile, "utf8").split(/\r?\n/).find((l) => l.startsWith("AGE-SECRET-KEY-"));
if (!identity) fail(`${identityFile} has no AGE-SECRET-KEY-1... line.`);

const bin = findPgBin();
const exe = (name) => join(bin, process.platform === "win32" ? `${name}.exe` : name);

console.log(`Backup:   ${input}`);
console.log(`Postgres: ${bin}`);

// --- 0. decrypt in memory ---------------------------------------------------

let archive;
try {
  archive = Buffer.from(await decryptBackup(readFileSync(input), identity));
} catch (e) {
  fail(`Could not decrypt ${input}: ${e.message} (wrong key, or the file is damaged).`);
}
if (archive.subarray(0, 5).toString() !== "PGDMP") fail("Decrypted, but the result is not a pg_dump archive.");
console.log(`Decrypted in memory (${(archive.length / 1024 / 1024).toFixed(2)} MB); nothing written to disk.`);

// --- 1. throwaway server ----------------------------------------------------

const dir = mkdtempSync(join(tmpdir(), "lannacare-restore-"));
const dataDir = join(dir, "data");
let started = false;
let failures = 0;

try {
  step("Creating a throwaway database server", () =>
    run(exe("initdb"), ["-D", dataDir, "-U", "postgres", "--auth=trust", "-E", "UTF8", "--locale=C"]));
  // stdio ignored: pg_ctl's server inherits whatever it is given and holds it open.
  step(`Starting it on port ${port} (this machine only)`, () => {
    const r = spawnSync(
      exe("pg_ctl"),
      ["-D", dataDir, "-o", `-p ${port} -c listen_addresses=localhost`, "-l", join(dir, "server.log"), "-w", "start"],
      { stdio: "ignore" },
    );
    if (r.status !== 0) throw new Error(`pg_ctl start exited ${r.status}; see ${join(dir, "server.log")} (is port ${port} in use? try --port)`);
    started = true;
  });
  step("Creating an empty database and the Supabase stand-ins", () => {
    psql("postgres", "create database restore_rehearsal");
    psql("restore_rehearsal", PREP_SQL);
  });

  // --- 2. restore -----------------------------------------------------------

  const restoreErrors = await step("Restoring the backup (about a minute)", async () => {
    const { stderr } = await pipe(exe("pg_restore"), [...conn("restore_rehearsal"), "--no-owner", "--no-privileges"], archive);
    return stderr.split(/\r?\n/).filter((l) => /^pg_restore: error:/.test(l));
  });

  // --- 3. checks ------------------------------------------------------------

  console.log("\nChecks:");
  const unexpected = restoreErrors.filter((l) => !EXPECTED_ERRORS.some((e) => e.pattern.test(l)));
  const grouped = new Map();
  for (const l of unexpected) {
    const msg = l.replace(/^pg_restore: error: (could not execute query: )?/, "");
    grouped.set(msg, (grouped.get(msg) ?? 0) + 1);
  }
  check(
    unexpected.length === 0,
    `pg_restore reported ${restoreErrors.length} error(s), all of them known and harmless`,
    `pg_restore reported ${unexpected.length} error(s) that are NOT the known ones:\n      ${
      [...grouped].map(([msg, n]) => `${n > 1 ? `${n} x ` : ""}${msg}`).join("\n      ")
    }`,
  );

  const archiveRows = await archiveRowCounts();
  const mismatched = [];
  let total = 0;
  for (const [table, expected] of archiveRows) {
    const got = Number(psql("restore_rehearsal", `select count(*) from ${table}`));
    total += got;
    if (got !== expected) mismatched.push(`${table}: archive ${expected}, database ${got}`);
  }
  check(
    archiveRows.size > 0 && mismatched.length === 0,
    `${archiveRows.size} tables, ${total} rows: every table's count matches the archive`,
    `row counts differ from the archive:\n      ${mismatched.join("\n      ") || "(the archive held no table data at all)"}`,
  );

  const toc = (await pipe(exe("pg_restore"), ["--list"], archive)).stdout;
  const inList = SCHEMAS.map((s) => `'${s}'`).join(",");
  const kinds = {
    TABLE: `select count(*) from pg_tables where schemaname in (${inList})`,
    VIEW: `select count(*) from pg_views where schemaname in (${inList})`,
    FUNCTION: `select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in (${inList})`,
    POLICY: `select count(*) from pg_policies where schemaname in (${inList})`,
    TRIGGER: `select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where not t.tgisinternal and n.nspname in (${inList})`,
  };
  for (const [kind, sql] of Object.entries(kinds)) {
    const want = toc.split(/\r?\n/).filter((l) => new RegExp(`^\\d+; \\d+ \\d+ ${kind} (${SCHEMAS.join("|")}) `).test(l)).length;
    const got = Number(psql("restore_rehearsal", sql));
    const label = { TABLE: "tables", VIEW: "views", FUNCTION: "functions", POLICY: "access policies", TRIGGER: "triggers" }[kind];
    check(got === want, `${label}: ${got} of ${want}`, `${label}: ${got} in the database, ${want} in the archive`);
  }
  check(
    /^\d+; \d+ \d+ SCHEMA - private /m.test(toc),
    "the archive includes the private schema",
    "the archive has NO private schema: it was made before 2026-10-13's backup.mjs fix, and the views built on it are missing above",
  );

  const migrations = psql("restore_rehearsal", "select count(*) || ' applied, newest ' || coalesce(max(filename), 'none') from public.schema_migrations");
  check(!/^0 /.test(migrations), `schema_migrations: ${migrations}`, "schema_migrations is empty");
} catch (e) {
  failures++;
  console.error(`\nStopped: ${e.message}`);
} finally {
  // --- 4. clean up ----------------------------------------------------------
  archive = null;
  if (keep && started) {
    console.log(`\n--keep: the server is still running. Look around with:\n  "${exe("psql")}" -h localhost -p ${port} -U postgres -d restore_rehearsal`);
    console.log(`Then stop it and delete it:\n  "${exe("pg_ctl")}" -D "${dataDir}" stop\n  (and delete the folder ${dir})`);
  } else {
    if (started) spawnSync(exe("pg_ctl"), ["-D", dataDir, "-m", "fast", "-w", "stop"], { stdio: "ignore" });
    rmSync(dir, { recursive: true, force: true });
    console.log(`\nServer stopped and ${dir} deleted${existsSync(dir) ? " — FAILED, delete it by hand" : ""}.`);
  }
}

if (failures > 0) {
  console.error(`\nREHEARSAL FAILED: ${failures} check(s) did not pass. This backup did not restore whole.`);
  process.exit(1);
}
console.log("\nREHEARSAL PASSED: the backup decrypts, restores, and every table, row, view, function, policy and trigger in it came back.");
console.log("Not proved here: that a Supabase project comes back (README \"Backups\").");

// --- helpers ---------------------------------------------------------------

function fail(message) {
  console.error(message);
  process.exit(1);
}

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i < 0 ? null : args[i + 1];
}

async function step(label, fn) {
  console.log(`${label} ...`);
  return await fn();
}

function check(ok, pass, failText) {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${ok ? pass : failText}`);
}

function conn(db) {
  return ["-h", "localhost", "-p", String(port), "-U", "postgres", "-d", db];
}

function run(cmd, cmdArgs, input) {
  const r = spawnSync(cmd, cmdArgs, { input, encoding: "utf8", maxBuffer: 256 * 1024 ** 2 });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status ?? r.error?.message}: ${(r.stderr || "").trim()}`);
  return r.stdout;
}

function psql(db, sql) {
  return run(exe("psql"), [...conn(db), "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1"], sql).trim();
}

/** Feed `input` to a program's stdin; resolve with its output whatever its exit status. */
function pipe(cmd, cmdArgs, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: ["pipe", "pipe", "pipe"] });
    const out = [];
    const err = [];
    child.stdout.on("data", (d) => out.push(d));
    child.stderr.on("data", (d) => err.push(d));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout: Buffer.concat(out).toString("utf8"), stderr: Buffer.concat(err).toString("utf8") }));
    child.stdin.on("error", () => {}); // a program that stops reading early reports through its exit status
    child.stdin.end(input);
  });
}

/** Rows per table as the archive holds them: count the lines of each COPY block. */
async function archiveRowCounts() {
  const { stdout } = await pipe(exe("pg_restore"), ["--data-only", "-f", "-"], archive);
  const counts = new Map();
  let table = null;
  let n = 0;
  for (const line of stdout.split(/\r?\n/)) { // pg_restore writes CRLF on Windows
    if (table === null) {
      const m = /^COPY (\S+) /.exec(line);
      if (m) [table, n] = [m[1], 0];
    } else if (line === "\\.") {
      counts.set(table, n);
      table = null;
    } else {
      n++;
    }
  }
  return counts;
}

/** The PostgreSQL bin folder holding initdb, pg_ctl, psql and pg_restore, 17 or newer. */
function findPgBin() {
  const candidates = [];
  if (process.env.PG_BIN) candidates.push(process.env.PG_BIN);
  const roots = ["C:\\Program Files\\PostgreSQL"];
  if (process.env.LOCALAPPDATA) roots.push(join(process.env.LOCALAPPDATA, "Programs", "PostgreSQL"));
  for (const root of roots.filter(existsSync)) {
    for (const v of readdirSync(root).sort((a, b) => Number(b) - Number(a))) candidates.push(join(root, v, "bin"));
  }
  const onPath = spawnSync(process.platform === "win32" ? "where" : "which", ["pg_restore"], { encoding: "utf8" });
  if (onPath.status === 0) candidates.push(dirname(onPath.stdout.split(/\r?\n/)[0].trim()));

  for (const b of candidates) {
    const probe = spawnSync(join(b, process.platform === "win32" ? "pg_restore.exe" : "pg_restore"), ["--version"], { encoding: "utf8" });
    if (probe.status !== 0) continue;
    const major = Number(/\(PostgreSQL\) (\d+)/.exec(probe.stdout)?.[1]);
    if (major < MIN_PG_MAJOR) continue;
    // The "binaries" zip README describes was once unpacked with only bin and lib;
    // initdb needs share too, and says so only as "postgres.bki does not exist".
    if (!existsSync(join(b, "..", "share", "postgres.bki"))) {
      fail(`${b} has PostgreSQL ${major}, but no ${join(b, "..", "share")} folder, which initdb needs. Unpack the zip's pgsql\\share folder next to bin (README "Backups").`);
    }
    if (!existsSync(join(b, process.platform === "win32" ? "initdb.exe" : "initdb"))) continue;
    return b;
  }
  return fail(`PostgreSQL ${MIN_PG_MAJOR}+ server programs (initdb, pg_ctl) not found. README "Backups" says how to get them, or set PG_BIN to their folder.`);
}
