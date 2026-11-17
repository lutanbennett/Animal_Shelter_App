// Export ONE shelter's data, and nothing of any other shelter's (#sxyw3, part 11 of the tenancy programme).
// README "Backups" -> "Exporting one shelter". docs/decisions/2026-11-17-per-shelter-export.md.
//
//   node scripts/shelter-export.mjs --shelter lanna --out C:\Temp\lanna-export [--env test|uat|production]
//       reads through the Management API, writes ONE age-encrypted SQL file (never plaintext), prints a count per table
//   node scripts/shelter-export.mjs --shelter lanna --prove [--port 55433]
//       the proof: exports, then loads the export (in memory, ephemeral key) into an empty throwaway PostgreSQL
//       server and checks (a) every row is there, (b) no other shelter's row is, (c) every foreign key resolves
//
// The export is DATA ONLY: a new database gets its tables from the migrations, as a new shelter's would. Rows are read
// per table with the shelter filter built in scripts/lib/shelter-export.mjs and nowhere else. A row with a null
// shelter_id stops the export and is named: dropping it loses data and including it leaks (decision file).
// Nothing is written unencrypted: the SQL is built in memory and goes straight into age.

import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateIdentity, identityToRecipient } from "age-encryption";
import { decryptBackup, encryptBackup, parseRecipients } from "./lib/backup-crypto.mjs";
import { envFile, loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { insertSql, nullRowsSql, planTables, q, selectSql } from "./lib/shelter-export.mjs";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const val = (f) => { const i = args.indexOf(f); return i < 0 ? null : args[i + 1]; };
const prove = args.includes("--prove");
const shelterKey = val("--shelter");
const outDir = val("--out");
const port = Number(val("--port") ?? 55433);
const PAGE = 500;
let authFks = 0;
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (!shelterKey || !/^[a-z0-9_-]+$/.test(shelterKey)) fail("Usage: node scripts/shelter-export.mjs --shelter <key> (--out <dir> | --prove) [--env test|uat|production]");
if (!prove && !outDir) fail("Give --out <dir> (outside the repo) or --prove.");
if (outDir) {
  const rel = relative(repoRoot, resolve(outDir));
  if (rel === "" || (!rel.startsWith("..") && !rel.includes(":"))) fail(`--out must be outside the repo (${repoRoot}).`);
}
const env = loadEnv(envName);
if (!env.SUPABASE_ACCESS_TOKEN) fail("SUPABASE_ACCESS_TOKEN is required.");
const ref = projectRef(env);

let recipients;
let identity = null;
if (prove) {
  identity = await generateIdentity(); // ephemeral: lives in this process only
  recipients = [await identityToRecipient(identity)];
} else {
  try { recipients = parseRecipients(val("--age-recipient") ?? env.BACKUP_AGE_RECIPIENT); }
  catch (e) { fail(`Exports are always encrypted, and ${e.message}\nSet BACKUP_AGE_RECIPIENT in ${envFile(envName)} (or pass --age-recipient).`); }
}

// --- 1. what to export -------------------------------------------------------

const registry = JSON.parse(readFileSync(join(repoRoot, "docs", "tenancy-shared-tables-registry.json"), "utf8"));
const rawCols = await sql(`select c.relname as t, a.attname as c from pg_attribute a join pg_class c on c.oid = a.attrelid
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped and a.attgenerated = '' order by c.relname, a.attnum`);
const scopedSet = new Set((await sql(`select c.relname t from pg_class c join pg_attribute a on a.attrelid = c.oid and a.attname = 'shelter_id' and not a.attisdropped
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'`)).map((r) => r.t));
const byTable = new Map();
for (const r of rawCols) (byTable.get(r.t) ?? byTable.set(r.t, []).get(r.t)).push({ name: r.c });
const fks = await sql(`select c.conrelid::regclass::text as child, c.confrelid::regclass::text as parent from pg_constraint c
  where c.contype = 'f' and c.connamespace = 'public'::regnamespace and c.confrelid::regclass::text !~ '\\.'`);
const catalog = {
  tables: [...byTable].map(([name, columns]) => ({ name, scoped: scopedSet.has(name), columns })),
  fks: fks.map((f) => ({ child: f.child, parent: f.parent })),
};
const plan = planTables(catalog, registry);
if (plan.problems.length) fail(`Not exporting; the registry does not cover every table:\n  ${plan.problems.join("\n  ")}`);

const [shelter] = await sql(`select id, key, name from public.shelters where key = '${shelterKey}'`);
if (!shelter) fail(`No shelter with key "${shelterKey}" on ${envName}.`);
console.log(`Environment ${envName} (${ref}); shelter ${shelter.key} (${shelter.id})`);
console.log(`${plan.tables.length} tables to export (${plan.tables.filter((t) => t.kind === "scoped").length} scoped, ${plan.tables.filter((t) => t.kind !== "scoped").length} shared); ${plan.cyclic.length} in or behind a foreign-key cycle`);

// A row with no shelter: refuse and name it.
const nulls = (await sql(nullRowsSql(plan.tables))).filter((r) => r.n > 0);
if (nulls.length) {
  fail(`REFUSED: ${nulls.reduce((a, r) => a + r.n, 0)} row(s) carry no shelter_id, so they belong to nobody and the export cannot say whose they are:\n  ${
    nulls.map((r) => `${r.t}: ${r.n}`).join("\n  ")
  }\nAssign them to their shelter (or delete them), then run it again. Dropping them loses data; including them leaks.`);
}

// --- 2. read, in load order, into memory --------------------------------------

const tag = `e${Math.random().toString(36).slice(2, 10)}`;
const parts = [`-- shelter export: ${shelter.key} (${shelter.id}) from ${envName}, ${new Date().toISOString()}\n-- DATA ONLY. Load into a database that already has the schema (the migrations).\nbegin;\n`];
const expected = new Map();
let inCycle = false;
for (const t of plan.tables) {
  const cyc = plan.cyclic.includes(t.name);
  if (cyc && !inCycle) { parts.push("set local session_replication_role = replica; -- the cycle group: loaded last, checked after\n"); inCycle = true; }
  const s = selectSql(t, shelter.id);
  const [{ n }] = await sql(s.count);
  expected.set(t.name, n);
  let got = 0;
  for (let off = 0; off < n; off += PAGE) {
    const [{ rows }] = await sql(s.page(off, PAGE));
    got += rows.length;
    parts.push(insertSql(t, rows, tag));
  }
  if (got !== n) fail(`${t.name}: counted ${n} rows, read ${got}. The table changed while it was being read; run it again.`);
}
parts.push("commit;\n");
const script = parts.join("");
const total = [...expected.values()].reduce((a, b) => a + b, 0);
console.log(`Read ${total} rows. Counts per table (non-empty):`);
for (const [t, n] of expected) if (n) console.log(`  ${t.padEnd(36)} ${n}`);

const encrypted = Buffer.from(await encryptBackup(new TextEncoder().encode(script), recipients));
if (outDir) {
  mkdirSync(outDir, { recursive: true, mode: 0o700 });
  const file = join(outDir, `lannacare-${envName}-shelter-${shelter.key}-${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}.sql.age`);
  writeFileSync(file, encrypted, { mode: 0o600 });
  chmodSync(file, 0o600);
  console.log(`Wrote ${file} (${(encrypted.length / 1024).toFixed(1)} KB, encrypted; no plaintext file exists).`);
}

// --- 3. the proof ------------------------------------------------------------

if (prove) await proveIt();

async function proveIt() {
  const bin = findPgBin();
  const exe = (n) => join(bin, process.platform === "win32" ? `${n}.exe` : n);
  const dir = mkdtempSync(join(tmpdir(), "lannacare-shelter-export-"));
  const dataDir = join(dir, "data");
  const conn = (db) => ["-h", "localhost", "-p", String(port), "-U", "postgres", "-d", db];
  const run = (cmd, a, input) => {
    const r = spawnSync(cmd, a, { input, encoding: "utf8", maxBuffer: 512 * 1024 ** 2 });
    if (r.status !== 0) throw new Error(`${cmd} exited ${r.status ?? r.error?.message}: ${(r.stderr || "").trim().slice(0, 2000)}`);
    return r.stdout;
  };
  const psql = (db, text) => run(exe("psql"), [...conn(db), "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1"], text).trim();
  let started = false;
  let failures = 0;
  const check = (ok, pass, bad) => { if (!ok) failures++; console.log(`  ${ok ? "ok  " : "FAIL"} ${ok ? pass : bad}`); };
  try {
    console.log("\nProof: an empty throwaway database, the export decrypted in memory and loaded into it");
    run(exe("initdb"), ["-D", dataDir, "-U", "postgres", "--auth=trust", "-E", "UTF8", "--locale=C"]);
    const r = spawnSync(exe("pg_ctl"), ["-D", dataDir, "-o", `-p ${port} -c listen_addresses=localhost`, "-l", join(dir, "server.log"), "-w", "start"], { stdio: "ignore" });
    if (r.status !== 0) throw new Error(`pg_ctl start exited ${r.status}; is port ${port} in use? try --port`);
    started = true;
    psql("postgres", "create database proof");
    psql("proof", await schemaSql());

    const plain = Buffer.from(await decryptBackup(encrypted, identity)).toString("utf8");
    run(exe("psql"), [...conn("proof"), "-X", "-q", "-v", "ON_ERROR_STOP=1"], plain);

    console.log("Checks:");
    // (a) every row of the shelter is there
    const short = [];
    for (const [t, n] of expected) {
      const got = Number(psql("proof", `select count(*) from ${q(t)}`));
      if (got !== n) short.push(`${t}: exported ${n}, loaded ${got}`);
    }
    check(short.length === 0, `(a) all ${plan.tables.length} tables, ${total} rows: the loaded count equals the shelter's count in the source, table by table`, `(a) counts differ:\n      ${short.join("\n      ")}`);
    // (b) none of anyone else's
    const foreign = [];
    for (const t of plan.tables.filter((x) => x.kind === "scoped")) {
      const n = Number(psql("proof", `select count(*) from ${q(t.name)} where shelter_id is distinct from '${shelter.id}'`));
      if (n) foreign.push(`${t.name}: ${n}`);
    }
    const shelters = Number(psql("proof", "select count(*) from public.shelters"));
    check(foreign.length === 0 && shelters === 1, `(b) no row of another shelter: 0 rows with a different shelter_id in ${plan.tables.filter((x) => x.kind === "scoped").length} scoped tables, and 1 row in shelters`, `(b) LEAK:\n      ${foreign.join("\n      ")}${shelters === 1 ? "" : `\n      shelters holds ${shelters} rows`}`);
    const otherShelters = Number((await sql(`select count(*) n from public.shelters where id <> '${shelter.id}'`))[0].n);
    console.log(`       (the source holds ${otherShelters} other shelter(s); the proof is only worth anything when that is at least 1)`);
    check(otherShelters >= 1, "the source database has a second shelter", "the source has only one shelter, so (b) proves nothing");
    // (c) self-consistent: every foreign key between public tables resolves
    const fkRows = await sql(`select c.conname, c.conrelid::regclass::text child, c.confrelid::regclass::text parent,
      (select string_agg(quote_ident(a.attname), ',' order by k.ord) from unnest(c.conkey) with ordinality k(n, ord) join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.n) cols,
      (select string_agg(quote_ident(a.attname), ',' order by k.ord) from unnest(c.confkey) with ordinality k(n, ord) join pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.n) pcols
      from pg_constraint c where c.contype = 'f' and c.connamespace = 'public'::regnamespace and c.confrelid::regclass::text !~ '\\.'`);
    const orphans = [];
    for (const f of fkRows) {
      const cc = f.cols.split(","); const pc = f.pcols.split(",");
      const n = Number(psql("proof", `select count(*) from ${q(f.child)} c where ${cc.map((c) => `c.${c} is not null`).join(" and ")} and not exists (select 1 from ${q(f.parent)} p where ${cc.map((c, i) => `p.${pc[i]} = c.${c}`).join(" and ")})`));
      if (n) orphans.push(`${f.child}.${f.conname} -> ${f.parent}: ${n}`);
    }
    check(orphans.length === 0, `(c) self-consistent: ${fkRows.length} foreign keys between public tables, 0 child rows without their parent`, `(c) ORPHANS:\n      ${orphans.join("\n      ")}`);
  } catch (e) {
    failures++;
    console.error(`\nStopped: ${e.message}`);
  } finally {
    if (started) spawnSync(exe("pg_ctl"), ["-D", dataDir, "-m", "fast", "-w", "stop"], { stdio: "ignore" });
    rmSync(dir, { recursive: true, force: true });
    console.log(`\nServer stopped and ${dir} deleted${existsSync(dir) ? " - FAILED, delete it by hand" : ""}.`);
  }
  if (failures) { console.error(`\nPROOF FAILED: ${failures} check(s).`); process.exit(1); }
  console.log("\nPROOF PASSED.");
  console.log("Not proved here: auth.users (the logins) is not part of the export; ", `${authFks} foreign key(s) from public tables point at it.`);
}


/** The empty database's structure, rebuilt from the source's catalogue: columns, keys and every public->public foreign key. A new shelter's database gets the real thing from the migrations. */
async function schemaSql() {
  const types = await sql(`select format_type(a.atttypid, a.atttypmod) as ft, c.relname t, a.attname c, a.attnotnull nn, a.attidentity ident, a.attgenerated gen, a.atttypid::regtype::text as rt
    from pg_attribute a join pg_class c on c.oid = a.attrelid where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped order by c.relname, a.attnum`);
  const enums = await sql(`select t.typname n, string_agg(quote_literal(e.enumlabel), ',' order by e.enumsortorder) l from pg_type t join pg_enum e on e.enumtypid = t.oid where t.typnamespace = 'public'::regnamespace group by 1`);
  const cons = await sql(`select c.conrelid::regclass::text t, c.contype, c.conname, pg_get_constraintdef(c.oid) def, c.confrelid::regclass::text parent
    from pg_constraint c where c.connamespace = 'public'::regnamespace and c.contype in ('p','u','f') order by c.contype desc, c.conname`);
  const out = ["create extension if not exists pgcrypto;"];
  for (const e of enums) out.push(`create type public.${e.n} as enum (${e.l});`);
  const tables = new Map();
  for (const c of types) {
    const ft = c.ft;
    (tables.get(c.t) ?? tables.set(c.t, []).get(c.t)).push(`"${c.c}" ${ft}${c.nn ? " not null" : ""}`);
  }
  for (const [t, cols] of tables) out.push(`create table ${q(t)} (${cols.join(", ")});`);
  // primary keys and uniques first (foreign keys need them), then foreign keys to public tables
  for (const c of cons.filter((x) => x.contype !== "f")) out.push(`alter table ${q(c.t.replace(/^public\./, ""))} add constraint "${c.conname}" ${c.def};`);
  for (const c of cons.filter((x) => x.contype === "f")) {
    if (/\./.test(c.parent)) { authFks++; continue; }
    out.push(`alter table ${q(c.t.replace(/^public\./, ""))} add constraint "${c.conname}" ${c.def};`);
  }
  return out.join("\n");
}

async function sql(query) {
  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }),
      });
      break;
    } catch (e) {
      if (attempt >= 5) fail(`Management API unreachable: ${e.cause?.code ?? e.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  const text = await res.text();
  if (!res.ok) fail(`Management API ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function findPgBin() {
  const candidates = [];
  if (process.env.PG_BIN) candidates.push(process.env.PG_BIN);
  const roots = ["C:\\Program Files\\PostgreSQL"];
  if (process.env.LOCALAPPDATA) roots.push(join(process.env.LOCALAPPDATA, "Programs", "PostgreSQL"));
  for (const root of roots.filter(existsSync)) for (const v of readdirSync(root).sort((a, b) => Number(b) - Number(a))) candidates.push(join(root, v, "bin"));
  for (const b of candidates) {
    const ext = process.platform === "win32" ? ".exe" : "";
    if (existsSync(join(b, `initdb${ext}`)) && existsSync(join(b, `psql${ext}`))) return b;
  }
  return fail("PostgreSQL 17 server programs (initdb, pg_ctl, psql) not found. README \"Backups\" says how to get them, or set PG_BIN.");
}
