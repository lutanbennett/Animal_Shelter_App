// Back up one environment's Supabase database into the shelter's Google
// Drive. Free-tier Supabase projects have no backups of their own (README
// "Backups"), so this is production's only safety net.
//
// EVERY backup is encrypted with age public-key encryption before it is
// uploaded or written anywhere, and there is no plaintext mode. The machine
// running this holds only the recipient's PUBLIC key (BACKUP_AGE_RECIPIENT or
// --age-recipient, an age1... string); the private key is in the
// administrator's password manager and is needed only to restore
// (scripts/decrypt-backup.mjs, or `age -d`). The dump goes from pg_dump
// straight into memory and out as ciphertext, so no plaintext file ever
// exists on disk.
//
//   node scripts/backup.mjs --env production      # dump, encrypt, upload, prune
//   node scripts/backup.mjs                       # the same against dev/test
//   node scripts/backup.mjs --env production --keep 8
//   node scripts/backup.mjs --env production --age-recipient age1...
//       # (BACKUP_AGE_RECIPIENT in the env file does the same; several keys
//       # may be given, comma-separated, and any one of them can decrypt)
//   node scripts/backup.mjs --env production --local C:\backups
//       # write the encrypted dump into that folder and skip Drive entirely
//   node scripts/backup.mjs --env production --local-copy ~/backups/lannacare
//       # upload to Drive AND keep a copy there; the newest --keep copies
//       # stay and each older one removed is named in the output
//
// What it does, in order, printing the target first:
//   1. `pg_dump -Fc` of the `public` and `auth` schemas — every record the
//      app owns plus the accounts that can sign in — over the Supabase
//      session pooler (the direct db.<ref>.supabase.co host is IPv6-only,
//      which this machine's network is not). Live sessions and one-time
//      tokens (auth.refresh_tokens, sessions, mfa_*, one_time_tokens,
//      flow_state) are left out: restoring them would hand whoever holds a
//      stolen backup signed-in sessions, and leaving them out costs nothing
//      on restore. (mfa_* holds the TOTP secrets, so everyone re-enrols their
//      authenticator app after a restore.) Then encrypts it with age.
//   2. Uploads the file as Backups/lannacare-<env>-<timestamp>.dump.age under
//      GOOGLE_DRIVE_ROOT_FOLDER_ID, creating the Backups folder if needed.
//      The Drive link is deliberately not printed: the output goes to
//      backup.log, and a log of live links is its own exposure.
//   3. Moves older dumps for the same environment beyond the newest --keep
//      (default 12) to the Drive trash, which empties itself after 30 days.
//      Plaintext .dump files from before encryption are neither counted nor
//      removed; they are named so they can be deleted by hand.
//   4. With --local-copy only: removes local copies beyond the newest --keep
//      from that folder, after the upload is confirmed, printing each one.
//      The folder is created 0700 and each dump 0600 (no effect on Windows),
//      and must be outside the repo so nothing the app serves can reach it.
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
import { chmodSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";
import { ENCRYPTED_SUFFIX, encryptBackup, excludeArgs, parseRecipients } from "./lib/backup-crypto.mjs";
import { envFile, loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";

const MIN_PG_MAJOR = 17;
const SCHEMAS = ["public", "auth"];

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const projectRef = refOf(env);

const keep = intArg("--keep", 12);
const localDir = stringArg("--local");
const copyDir = stringArg("--local-copy");
if (keep < 1) fail("--keep must be at least 1.");
if (localDir && copyDir) fail("--local (dump only, no upload) and --local-copy (upload and keep a copy) are alternatives.");
if (copyDir) {
  // A dump is the whole database; it must not sit anywhere the app could serve.
  const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..");
  const rel = relative(repoRoot, resolve(copyDir));
  if (rel === "" || (!rel.startsWith("..") && !rel.includes(":"))) fail(`--local-copy must be outside the repo (${repoRoot}).`);
}
const keepDir = localDir ?? copyDir;

// Fail before touching the database: an unencrypted backup is not an option.
let recipients;
try {
  recipients = parseRecipients(stringArg("--age-recipient") ?? env.BACKUP_AGE_RECIPIENT);
} catch (e) {
  fail(
    `Backups are always encrypted, and ${e.message}\n` +
      `Set BACKUP_AGE_RECIPIENT in ${envFile(envName)} (or pass --age-recipient) to the administrator's age PUBLIC key. README "Backups" says how it is made.`,
  );
}

console.log(`Environment: ${envName}  (Supabase project ${projectRef})`);

// --- 1. pg_dump, then encrypt ---------------------------------------------

const pgDump = findPgDump();
const dumpName = `lannacare-${envName}-${timestamp()}${ENCRYPTED_SUFFIX}`;
const outDir = keepDir ?? join(tmpdir(), "lannacare-backup");
mkdirSync(outDir, { recursive: true, mode: 0o700 });
if (copyDir) chmodSync(outDir, 0o700);
const dumpPath = join(outDir, dumpName);

const { dbUrl, password } = await connectionDetails();
console.log(`Dumping schemas ${SCHEMAS.join(", ")} with ${pgDump} (session tables excluded) ...`);
// No --file: the plaintext dump is captured in memory and never written out.
const dump = spawnSync(
  pgDump,
  [
    "--format=custom",
    "--no-password",
    ...SCHEMAS.flatMap((s) => ["--schema", s]),
    ...excludeArgs(),
    `--dbname=${dbUrl}`,
  ],
  {
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 2 * 1024 ** 3,
    env: { ...process.env, PGPASSWORD: password, PGSSLMODE: "require" },
  },
);
if (dump.status !== 0) fail(`pg_dump exited with status ${dump.status ?? dump.signal ?? dump.error?.message}.`);
if (!dump.stdout.subarray(0, 5).equals(Buffer.from("PGDMP"))) fail("pg_dump output is not a custom-format archive; not encrypting it.");

const encrypted = Buffer.from(await encryptBackup(dump.stdout, recipients));
writeFileSync(dumpPath, encrypted, { mode: 0o600 });
if (copyDir) chmodSync(dumpPath, 0o600);
const size = statSync(dumpPath).size;
console.log(`Wrote ${dumpName}, encrypted for ${recipients.length} recipient(s) (${(size / 1024 / 1024).toFixed(2)} MB)`);

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
  fields: "id, name, size", // no webViewLink: it must never reach backup.log
});
if (Number(uploaded.data.size) !== size) {
  fail(`Drive reports ${uploaded.data.size} bytes for ${dumpName}, local file is ${size}. Not pruning.`);
}
console.log(`Uploaded to Drive as ${uploaded.data.name} (link not logged).`);
cleanupTemp();

// --- 3. Prune --------------------------------------------------------------

const prefix = `lannacare-${envName}-`;
const listed = await drive.files.list({
  q: `'${backupsFolderId}' in parents and name contains '${prefix}' and trashed = false`,
  fields: "files(id, name)",
  pageSize: 1000,
});
const inDrive = (listed.data.files ?? []).filter((f) => f.name.startsWith(prefix));
const dumps = inDrive
  .filter((f) => f.name.endsWith(ENCRYPTED_SUFFIX))
  .sort((a, b) => b.name.localeCompare(a.name)); // timestamps sort newest first
for (const old of dumps.slice(keep)) {
  await drive.files.update({ fileId: old.id, requestBody: { trashed: true } });
  console.log(`Trashed old backup ${old.name}`);
}
console.log(`Backups kept for ${envName}: ${Math.min(dumps.length, keep)} (newest ${dumps[0]?.name}).`);
warnPlaintext("Drive's Backups folder", inDrive.map((f) => f.name));

// --- 4. Prune the local copies (--local-copy) -------------------------------
// Only reached once the upload is confirmed above, so a failed run never
// removes the copies it might still need. Each removal is printed.

if (copyDir) {
  const names = readdirSync(copyDir).filter((n) => n.startsWith(prefix));
  const local = names.filter((n) => n.endsWith(ENCRYPTED_SUFFIX)).sort((a, b) => b.localeCompare(a));
  for (const old of local.slice(keep)) {
    unlinkSync(join(copyDir, old));
    console.log(`Removed old local copy ${old} (keeping the newest ${keep} in ${copyDir})`);
  }
  console.log(`Local copies kept in ${copyDir}: ${Math.min(local.length, keep)} (newest ${local[0]}).`);
  warnPlaintext(copyDir, names);
}

// --- helpers ---------------------------------------------------------------

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Name any plaintext dump left over from before encryption; never delete one unasked. */
function warnPlaintext(where, names) {
  const plain = names.filter((n) => n.endsWith(".dump"));
  if (plain.length === 0) return;
  console.warn(`WARNING: ${plain.length} UNENCRYPTED dump(s) still in ${where}; delete them by hand: ${plain.join(", ")}`);
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
  if (!keepDir && existsSync(dumpPath)) unlinkSync(dumpPath);
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
        envFile(envName)
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
