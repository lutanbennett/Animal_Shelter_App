// Back up one environment's Supabase database into the shelter's Google
// Drive. Free-tier Supabase projects have no backups of their own (README
// "Backups"), so this is production's only safety net.
//
//   node scripts/backup.mjs --env production      # dump, upload, prune
//   node scripts/backup.mjs                       # the same against dev/test
//   node scripts/backup.mjs --env production --keep 8
//   node scripts/backup.mjs --env production --local C:\backups
//       # write the dump into that folder and skip Drive entirely
//
// What it does, in order, printing the target first:
//   1. `pg_dump -Fc` of the `public` and `auth` schemas — every record the
//      app owns plus the accounts that can sign in — over the Supabase
//      session pooler (the direct db.<ref>.supabase.co host is IPv6-only,
//      which this machine's network is not).
//   2. Uploads the file as Backups/lannacare-<env>-<timestamp>.dump under
//      GOOGLE_DRIVE_ROOT_FOLDER_ID, creating the Backups folder if needed.
//   3. Moves older dumps for the same environment beyond the newest --keep
//      (default 12) to the Drive trash, which empties itself after 30 days.
//
// It needs two things the migration runner does not:
//   - pg_dump 17 or newer (the projects run Postgres 17; pg_dump refuses
//     older) — PostgreSQL's command-line tools, found via PG_DUMP, PATH,
//     C:\Program Files\PostgreSQL\<version>\bin or
//     %LOCALAPPDATA%\Programs\PostgreSQL\<version>\bin. README "Backups"
//     says how to get them.
//   - SUPABASE_DB_PASSWORD, the project's database password (Supabase
//     dashboard → Project Settings → Database; resettable there). Lives in
//     .env.deploy.production for production, .env.local for dev. The pooler
//     host and user come from the Management API, so nothing else is
//     needed; SUPABASE_DB_URL overrides the whole connection string if set.
//
// Exit status is non-zero on any failure so Task Scheduler's "last run
// result" (scripts/backup-schedule.ps1) is honest.

import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { google } from "googleapis";
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";

const MIN_PG_MAJOR = 17;
const SCHEMAS = ["public", "auth"];

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const projectRef = refOf(env);

const keep = intArg("--keep", 12);
const localDir = stringArg("--local");
if (keep < 1) fail("--keep must be at least 1.");

console.log(`Environment: ${envName}  (Supabase project ${projectRef})`);

// --- 1. pg_dump -----------------------------------------------------------

const pgDump = findPgDump();
const dumpName = `lannacare-${envName}-${timestamp()}.dump`;
const outDir = localDir ?? join(tmpdir(), "lannacare-backup");
mkdirSync(outDir, { recursive: true });
const dumpPath = join(outDir, dumpName);

const { dbUrl, password } = await connectionDetails();
console.log(`Dumping schemas ${SCHEMAS.join(", ")} with ${pgDump} ...`);
const dump = spawnSync(
  pgDump,
  [
    "--format=custom",
    "--no-password",
    ...SCHEMAS.flatMap((s) => ["--schema", s]),
    `--file=${dumpPath}`,
    `--dbname=${dbUrl}`,
  ],
  {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PGPASSWORD: password, PGSSLMODE: "require" },
  },
);
if (dump.status !== 0) {
  cleanupTemp();
  fail(`pg_dump exited with status ${dump.status ?? dump.signal}.`);
}
const size = statSync(dumpPath).size;
console.log(`Wrote ${dumpName} (${(size / 1024 / 1024).toFixed(2)} MB)`);

if (localDir) {
  console.log(`Kept locally in ${localDir}; not uploaded (--local).`);
  process.exit(0);
}

// --- 2. Upload -------------------------------------------------------------

const drive = driveClient();
const backupsFolderId = await ensureBackupsFolder(drive);
const uploaded = await drive.files.create({
  requestBody: { name: dumpName, parents: [backupsFolderId] },
  media: { mimeType: "application/octet-stream", body: createReadStream(dumpPath) },
  fields: "id, name, size, webViewLink",
});
if (Number(uploaded.data.size) !== size) {
  fail(`Drive reports ${uploaded.data.size} bytes for ${dumpName}, local file is ${size}. Not pruning.`);
}
console.log(`Uploaded to Drive: ${uploaded.data.webViewLink}`);
cleanupTemp();

// --- 3. Prune --------------------------------------------------------------

const prefix = `lannacare-${envName}-`;
const listed = await drive.files.list({
  q: `'${backupsFolderId}' in parents and name contains '${prefix}' and trashed = false`,
  fields: "files(id, name)",
  pageSize: 1000,
});
const dumps = (listed.data.files ?? [])
  .filter((f) => f.name.startsWith(prefix) && f.name.endsWith(".dump"))
  .sort((a, b) => b.name.localeCompare(a.name)); // timestamps sort newest first
for (const old of dumps.slice(keep)) {
  await drive.files.update({ fileId: old.id, requestBody: { trashed: true } });
  console.log(`Trashed old backup ${old.name}`);
}
console.log(`Backups kept for ${envName}: ${Math.min(dumps.length, keep)} (newest ${dumps[0]?.name}).`);

// --- helpers ---------------------------------------------------------------

function fail(message) {
  console.error(message);
  process.exit(1);
}

function intArg(flag, fallback) {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  const n = Number(args[i + 1]);
  if (!Number.isInteger(n)) fail(`${flag} needs a whole number.`);
  return n;
}

function stringArg(flag) {
  const i = args.indexOf(flag);
  if (i < 0) return null;
  if (!args[i + 1]) fail(`${flag} needs a value.`);
  return args[i + 1];
}

function timestamp() {
  // 2026-09-21T0300Z — sortable, no characters Drive or Windows object to.
  return new Date().toISOString().replace(/:(\d\d):\d\d\.\d+Z$/, "$1Z");
}

function cleanupTemp() {
  if (!localDir && existsSync(dumpPath)) unlinkSync(dumpPath);
}

/**
 * pg_dump from PG_DUMP, then PATH, then the Windows install dirs — the EDB
 * installer's under Program Files and the per-user unzip location README
 * "Backups" describes — newest version first.
 */
function findPgDump() {
  const candidates = [];
  if (process.env.PG_DUMP) candidates.push(process.env.PG_DUMP);
  candidates.push("pg_dump");
  const roots = ["C:\\Program Files\\PostgreSQL"];
  if (process.env.LOCALAPPDATA) roots.push(join(process.env.LOCALAPPDATA, "Programs", "PostgreSQL"));
  for (const pgRoot of roots.filter(existsSync)) {
    for (const v of readdirSync(pgRoot).sort((a, b) => Number(b) - Number(a))) {
      candidates.push(join(pgRoot, v, "bin", "pg_dump.exe"));
    }
  }
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (probe.status !== 0) continue;
    const major = Number(/pg_dump \(PostgreSQL\) (\d+)/.exec(probe.stdout)?.[1]);
    if (major >= MIN_PG_MAJOR) return candidate;
    console.warn(`${candidate} is PostgreSQL ${major}; need ${MIN_PG_MAJOR}+ for these projects.`);
  }
  return fail(
    `pg_dump ${MIN_PG_MAJOR}+ not found. Install PostgreSQL's command-line tools (README "Backups") or set PG_DUMP to the executable.`,
  );
}

/** Session-pooler connection string (port 5432; pg_dump cannot use the 6543 transaction pooler). */
async function connectionDetails() {
  if (env.SUPABASE_DB_URL) {
    const u = new URL(env.SUPABASE_DB_URL);
    const password = decodeURIComponent(u.password);
    u.password = "";
    return { dbUrl: u.toString(), password };
  }
  const password = env.SUPABASE_DB_PASSWORD;
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!password) {
    fail(
      `SUPABASE_DB_PASSWORD is not set for ${envName} — add the project's database password to ${
        envName === "production" ? ".env.deploy.production" : ".env.local"
      } (or set SUPABASE_DB_URL).`,
    );
  }
  if (!token) fail("SUPABASE_ACCESS_TOKEN is required to look up the pooler host.");
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/database/pooler`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) fail(`Pooler lookup failed: HTTP ${res.status} ${await res.text()}`);
  const primary = (await res.json()).find((p) => p.database_type === "PRIMARY");
  if (!primary) fail("Pooler lookup returned no PRIMARY database.");
  return {
    dbUrl: `postgresql://${encodeURIComponent(primary.db_user)}@${primary.db_host}:5432/${primary.db_name}`,
    password,
  };
}

function driveClient() {
  for (const k of [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
    "GOOGLE_DRIVE_ROOT_FOLDER_ID",
  ]) {
    if (!env[k]) fail(`${k} is required to upload to Drive (use --local to skip the upload).`);
  }
  const auth = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth });
}

async function ensureBackupsFolder(drive) {
  const root = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const found = await drive.files.list({
    q: `'${root}' in parents and name = 'Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
  });
  if (found.data.files?.length) return found.data.files[0].id;
  const created = await drive.files.create({
    requestBody: { name: "Backups", mimeType: "application/vnd.google-apps.folder", parents: [root] },
    fields: "id",
  });
  console.log("Created the Backups folder in Drive.");
  return created.data.id;
}
