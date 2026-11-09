// After a restore, put the database's privileges back to exactly what the backup recorded,
// then prove it. The why and the how are in scripts/lib/restore-grants.mjs (#rg7pv).
//
//   node scripts/restore-grants.mjs <backup>.dump.age --identity <key file> --env uat --confirm <project ref>
//   node scripts/restore-grants.mjs <file>.dump --env uat --confirm <project ref>      # decrypt-backup.mjs's output
//   node scripts/restore-grants.mjs <backup> --identity <key> --env uat --check-only   # compare, change nothing
//   node scripts/restore-grants.mjs <backup> --identity <key> --db-url postgresql://postgres@localhost:55432/<db>
//
// What it does:
//   1. Reads the backup (an encrypted one is decrypted IN MEMORY; no plaintext is written).
//   2. Picks the backup's privilege entries for the public and private schemas.
//   3. Unless --check-only: in ONE transaction, resets every object there to its built-in
//      default privileges and replays the backup's. A failure rolls the whole thing back.
//   4. Dumps the target's schema (no data) and compares its privilege statements with the
//      backup's, line for line. Exit 0 only when none is missing and none is extra.
//
// Run it straight after the pg_restore of public/private and BEFORE applying any newer
// migration, so the database holds exactly the backup's objects. Statements for objects the
// backup does not hold (a newer migration's) are listed apart, not counted as a fault.
//
// --env reaches the project through its session pooler with SUPABASE_DB_PASSWORD from the env
// file, as backup.mjs does (the pooler lookup is repeated here rather than shared, so this does
// not touch the production backup script). --confirm must name that project's ref: this
// rewrites every privilege in two schemas, so the target is typed, not inferred.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { decryptBackup } from "./lib/backup-crypto.mjs";
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { aclTocLines, archiveObjects, compareAcls, GRANT_SCHEMAS, resetSql } from "./lib/restore-grants.mjs";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const usingEnv = process.argv.includes("--env");
const input = args.find((a, i) => !a.startsWith("--") && !["--identity", "--db-url", "--confirm"].includes(args[i - 1]));
const identityFile = valueOf("--identity");
const dbUrlArg = valueOf("--db-url");
const confirm = valueOf("--confirm");
const checkOnly = args.includes("--check-only");

if (!input || (!usingEnv && !dbUrlArg)) {
  fail("Usage: node scripts/restore-grants.mjs <backup>[.age] [--identity <key>] (--env <env> --confirm <ref> | --db-url <url>) [--check-only]");
}
if (!existsSync(input)) fail(`${input} not found.`);

// --- the target -------------------------------------------------------------------------
let dbUrl = dbUrlArg;
let password = process.env.PGPASSWORD;
if (usingEnv) {
  const env = loadEnv(envName);
  const ref = refOf(env);
  console.log(`Target:   ${envName} (Supabase project ${ref})`);
  if (confirm !== ref) fail(`Refusing: --confirm ${confirm ?? "(missing)"} does not name ${ref}. Type the project ref to show this is the database you mean.`);
  ({ dbUrl, password } = await poolerConnection(env, ref));
} else {
  console.log(`Target:   ${dbUrl.replace(/:[^:@/]*@/, ":***@")}`);
}

// --- the backup -------------------------------------------------------------------------
let archive = readFileSync(input);
if (input.endsWith(".age")) {
  if (!identityFile || !existsSync(identityFile)) fail("An .age backup needs --identity <private key file>.");
  const identity = readFileSync(identityFile, "utf8").split(/\r?\n/).find((l) => l.startsWith("AGE-SECRET-KEY-"));
  if (!identity) fail(`${identityFile} has no AGE-SECRET-KEY-1... line.`);
  try {
    archive = Buffer.from(await decryptBackup(archive, identity));
  } catch (e) {
    fail(`Could not decrypt ${input}: ${e.message}`);
  }
}
if (archive.subarray(0, 5).toString() !== "PGDMP") fail("That is not a pg_dump custom-format archive.");
console.log(`Backup:   ${input} (${(archive.length / 1024 / 1024).toFixed(2)} MB, read in memory)`);

const bin = findPgBin();
const exe = (n) => join(bin, process.platform === "win32" ? `${n}.exe` : n);
const tmp = mkdtempSync(join(tmpdir(), "restore-grants-"));
let failed = false;

try {
  const toc = (await pipe(exe("pg_restore"), ["--list"], archive)).stdout;
  const lines = aclTocLines(toc);
  if (!lines.length) fail("The backup holds no privilege entries for public/private (was it made with --no-privileges?).");
  const listFile = join(tmp, "acl.list"); // object names only; no data, no secrets
  writeFileSync(listFile, lines.join("\n") + "\n");
  const replay = await pipe(exe("pg_restore"), ["-L", listFile, "-f", "-"], archive);
  if (replay.status !== 0) fail(`pg_restore could not render the privilege entries: ${replay.stderr.trim()}`);
  const replaySql = replay.stdout;
  console.log(`Privileges in the backup for ${GRANT_SCHEMAS.join(", ")}: ${lines.length} entries.`);

  if (!checkOnly) {
    console.log("Resetting and replaying them in one transaction ...");
    const r = spawnSync(exe("psql"), ["-X", "-q", "-1", "-v", "ON_ERROR_STOP=1", "-d", dbUrl], {
      input: resetSql(GRANT_SCHEMAS, archiveObjects(toc)) + "\n" + replaySql,
      encoding: "utf8",
      env: { ...process.env, PGPASSWORD: password ?? "" },
      maxBuffer: 256 * 1024 ** 2,
    });
    if (r.status !== 0) {
      fail(`The replay FAILED and was rolled back; nothing changed.\n${(r.stderr || "").trim().split(/\r?\n/).slice(-5).join("\n")}`);
    }
    console.log("  done, committed.");
  }

  console.log("Comparing the target's privileges with the backup's ...");
  const dump = spawnSync(exe("pg_dump"), ["--schema-only", ...GRANT_SCHEMAS.flatMap((s) => ["--schema", s]), "-d", dbUrl], {
    encoding: "utf8",
    env: { ...process.env, PGPASSWORD: password ?? "" },
    maxBuffer: 256 * 1024 ** 2,
  });
  if (dump.status !== 0) fail(`pg_dump of the target failed: ${(dump.stderr || "").trim()}`);
  // Compare against ALL the backup's default privileges, including Supabase's own (FOR ROLE
  // supabase_admin), which are not replayed but which a real project should already match.
  const fullList = join(tmp, "acl-all.list");
  writeFileSync(fullList, aclTocLines(toc, GRANT_SCHEMAS, null).join("\n") + "\n");
  const expectedSql = (await pipe(exe("pg_restore"), ["-L", fullList, "-f", "-"], archive)).stdout;
  const { matched, missing, extra, newer } = compareAcls(expectedSql, dump.stdout, toc);
  console.log(`  ${matched} of the backup's privilege statements are on the target.`);
  report("MISSING on the target (in the backup)", missing);
  report("EXTRA on the target (not in the backup)", extra);
  if (newer.length) {
    console.log(`  ${newer.length} statement(s) for objects the backup does not hold (a newer migration's): not a fault.`);
  }
  failed = missing.length > 0 || extra.length > 0;
  console.log(failed ? "\nFAILED: the target's privileges differ from the backup's." : "\nOK: the target's privileges are exactly the backup's.");
} finally {
  archive = null;
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);

// --- helpers ----------------------------------------------------------------------------

function report(label, list) {
  if (!list.length) return console.log(`  ${label}: none.`);
  console.log(`  ${label}: ${list.length}`);
  for (const s of list.slice(0, 40)) console.log(`    ${s}`);
  if (list.length > 40) console.log(`    ... and ${list.length - 40} more`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i < 0 ? null : args[i + 1];
}

/** Feed `input` to a program's stdin; resolve with its output whatever its exit status. */
function pipe(cmd, cmdArgs, inputBuf) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: ["pipe", "pipe", "pipe"] });
    const out = [];
    const err = [];
    child.stdout.on("data", (d) => out.push(d));
    child.stderr.on("data", (d) => err.push(d));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout: Buffer.concat(out).toString("utf8"), stderr: Buffer.concat(err).toString("utf8") }));
    child.stdin.on("error", () => {});
    child.stdin.end(inputBuf);
  });
}

/** Session-pooler connection, as backup.mjs's connectionDetails() builds it. */
async function poolerConnection(env, ref) {
  if (env.SUPABASE_DB_URL) {
    const u = new URL(env.SUPABASE_DB_URL);
    const pw = decodeURIComponent(u.password);
    u.password = "";
    return { dbUrl: u.toString(), password: pw };
  }
  if (!env.SUPABASE_DB_PASSWORD) fail(`SUPABASE_DB_PASSWORD is not set for ${envName}.`);
  if (!env.SUPABASE_ACCESS_TOKEN) fail("SUPABASE_ACCESS_TOKEN is required to look up the pooler host.");
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/database/pooler`, {
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
  });
  if (!res.ok) fail(`Pooler lookup failed: HTTP ${res.status}`);
  const primary = (await res.json()).find((p) => p.database_type === "PRIMARY");
  if (!primary) fail("Pooler lookup returned no PRIMARY database.");
  return { dbUrl: `postgresql://${encodeURIComponent(primary.db_user)}@${primary.db_host}:5432/${primary.db_name}`, password: env.SUPABASE_DB_PASSWORD };
}

/** A PostgreSQL 17+ bin folder with pg_restore, pg_dump and psql. */
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
    if (probe.status === 0 && Number(/\(PostgreSQL\) (\d+)/.exec(probe.stdout)?.[1]) >= 17) return b;
  }
  return fail("PostgreSQL 17+ client tools (pg_restore, pg_dump, psql) not found; set PG_BIN (README \"Backups\").");
}
