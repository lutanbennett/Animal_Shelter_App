#!/usr/bin/env node
/**
 * Checks the release guards the Worker deploy and the Pi deploy share
 * (scripts/lib/release-guards.mjs): unreleased notes, version mismatch,
 * missing migrations, "could not ask" as a warning, and --force.
 *
 *   node scripts/check-release-guards.mjs
 *
 * Also checks assertSchema(), the strict verdict scripts/assert-schema.mjs runs on the
 * deploy machine before a Pi build (the Pi has no token, so its guard-release.mjs no
 * longer asks the schema anything): a missing migration is refused with the app files
 * its `-- consumer:` header names, and "could not ask" is a REFUSAL there.
 *
 * No network, no database: git and the Management API are stubbed. The real
 * processes spawned are guard-release.mjs --env test (must not ask for an
 * environment file) and --env production (must run with no token and no env file).
 * Exits 1 if any case is wrong.
 */
import { exitWith } from "./lib/exit.mjs";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { assertSchema, decideGuard, releaseProblems, schemaVerdict } from "./lib/release-guards.mjs";
import { appliedMigrations } from "./lib/deploy-schema.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};

const latest = { version: "0.12.1" };
const lsTree = (names) => () => names.map((n) => `100644 blob abc123\tsupabase/migrations/${n}`).join("\n");
const clean = releaseProblems({ pkgVersion: "0.12.1", latestRelease: latest, unreleased: [] });
const ok = { ok: true, applied: ["0001_a.sql", "0002_b.sql"] };
const git = lsTree(["0001_a.sql", "0002_b.sql"]);

check("a cut release with nothing unreleased passes", clean.length === 0);
const dirty = releaseProblems({ pkgVersion: "0.12.1", latestRelease: latest, unreleased: [{}, {}] });
check("unreleased notes are a problem", dirty.length === 1 && dirty[0].includes("2 unreleased note(s)"), JSON.stringify(dirty));
const stale = releaseProblems({ pkgVersion: "0.12.0", latestRelease: latest, unreleased: [] });
check("package.json behind the newest release is a problem", stale.length === 1 && stale[0].includes("0.12.0"), JSON.stringify(stale));

const missing = schemaVerdict({ envName: "production", result: ok, git: lsTree(["0001_a.sql", "0002_b.sql", "0003_c.sql"]) });
check("a migration the database lacks is refused", missing.refusal?.includes("0003_c.sql") && missing.refusal.includes("--env production"), missing.refusal);
const level = schemaVerdict({ envName: "production", result: ok, git });
check("a database holding every migration passes", !level.refusal && level.warnings.length === 0);
const ahead = schemaVerdict({ envName: "production", result: { ok: true, applied: ["0001_a.sql", "0002_b.sql", "0009_next.sql"] }, git });
check("schema ahead of code is fine", !ahead.refusal);
const blind = schemaVerdict({ envName: "production", result: { ok: false, reason: "HTTP 503" }, git });
check("could not ask warns and does not refuse", !blind.refusal && blind.warnings.length === 2 && blind.warnings[0].includes("HTTP 503"), JSON.stringify(blind));

const decide = (problems, schema, force = null) => decideGuard({ envName: "production", problems, schema, force });
check("clean release, clean schema: go", !decide(clean, level).refuse);
check("unreleased refuses", decide(dirty, level).refuse);
check("missing migration refuses", decide(clean, missing).refuse);
check("could not ask alone goes ahead, with its warnings", !decide(clean, blind).refuse && decide(clean, blind).warnings.length === 2);
const forced = decide(dirty, missing, "sign-in outage");
check("--force goes ahead and keeps every problem for the record", !forced.refuse && forced.overridden.length === 2, JSON.stringify(forced));
check("--force with nothing to override records nothing", decide(clean, level, "why not").overridden.length === 0);

// assertSchema: the strict verdict the deploy machine runs before the Pi build.
const sqlAt = {
  "supabase/migrations/0003_c.sql": ["-- consumer: src/app/c/page.tsx, src/lib/c.ts", "create table c();"].join("\n"),
  "supabase/migrations/0004_d.sql": ["-- consumer: none", "select 1;"].join("\n"),
  "supabase/migrations/0005_e.sql": "select 1;",
};
const readSql = (path) => { if (!(path in sqlAt)) throw new Error("no such file"); return sqlAt[path]; };
const all = lsTree(["0001_a.sql", "0002_b.sql", "0003_c.sql", "0004_d.sql", "0005_e.sql"]);
const strictMissing = assertSchema({ envName: "production", result: ok, git: all, read: readSql });
check("assert: a pending migration is refused", !strictMissing.ok && strictMissing.message.includes("0003_c.sql"), strictMissing.message);
check("assert: names the app files the consumer header says read it", strictMissing.message.includes("read by src/app/c/page.tsx, src/lib/c.ts"), strictMissing.message);
check("assert: says when a header is none or absent", strictMissing.message.includes("0004_d.sql  (consumer: none)") && strictMissing.message.includes("0005_e.sql  (declares no -- consumer: header)"), strictMissing.message);
check("assert: tells the operator how to apply", strictMissing.message.includes("apply-migrations.mjs --env production"));
const strictOk = assertSchema({ envName: "production", result: ok, git, read: readSql });
check("assert: a database holding every migration passes", strictOk.ok, strictOk.message);
const strictVia = assertSchema({ envName: "uat", result: { ...ok, via: "the database directly" }, git, read: readSql });
check("assert: the pass names which route answered", strictVia.ok && strictVia.message.includes("asked the database directly"), strictVia.message);
const strictBlind = assertSchema({ envName: "production", result: { ok: false, reason: "SUPABASE_ACCESS_TOKEN is not set" }, git, read: readSql });
check("assert: could not ask is a REFUSAL, not a warning", !strictBlind.ok && strictBlind.message.includes("SUPABASE_ACCESS_TOKEN is not set") && strictBlind.message.includes("Refusing"), strictBlind.message);

const test = spawnSync(process.execPath, ["scripts/pi/guard-release.mjs", "--env", "test"], { encoding: "utf8" });
check("--env test is not guarded", test.status === 0 && test.stdout.includes("test is not guarded"), test.stdout + test.stderr);
const noReason = spawnSync(process.execPath, ["scripts/pi/guard-release.mjs", "--env", "production", "--force"], { encoding: "utf8" });
check("--force without a reason is refused", noReason.status === 2 && noReason.stderr.includes("needs a reason"), noReason.stderr);

// The Pi's guard must not ask the schema anything (it has no token): it runs with no token and no env
// file, and never imports the code that asks. Exit 0 (a cut release) or 2 (not one) both mean it ran.
const piProd = spawnSync(process.execPath, ["scripts/pi/guard-release.mjs", "--env", "production"], { encoding: "utf8", env: { ...process.env, SUPABASE_ACCESS_TOKEN: "" } });
check("Pi guard runs for production with no token and no env file", [0, 2].includes(piProd.status) && !/SUPABASE_ACCESS_TOKEN|is missing or empty|WARNING/.test(piProd.stdout + piProd.stderr), piProd.stdout + piProd.stderr);
const piSrc = readFileSync("scripts/pi/guard-release.mjs", "utf8");
check("Pi guard no longer imports the schema query", !/appliedMigrations|schemaVerdict|loadEnv/.test(piSrc.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n")));
const pi = readFileSync("scripts/pi/deploy-pi.sh", "utf8");
check("deploy-pi.sh points at the deploy-machine assertion", pi.includes("scripts/assert-schema.mjs"));

// --drift needs a database, so CI cannot run it; this reads the source instead. 0.28.0 shipped a
// ReferenceError here (the call site read names driftReport() never returned) and lost the verdict line.
const migrate = readFileSync("scripts/apply-migrations.mjs", "utf8");
check(
  "--drift reads the arrays it prints from driftReport()",
  migrate.includes("return { unapplied, missingFile };") &&
    migrate.includes("const { unapplied, missingFile } = driftReport();"),
);

// appliedMigrations()'s two routes. UAT's access token cannot read its database at all
// (`Missing required permission(s): database_read`, measured 2026-11-08), which made the
// guard blind rather than wrong; the fallback asks the database itself over PostgREST.
const API = "https://api.supabase.com/v1/projects/abc/database/query";
const REST = "https://abc.supabase.co/rest/v1/schema_migrations?select=filename";
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => body });
const uatEnv = {
  SUPABASE_ACCESS_TOKEN: "t",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "k",
};
const denied = () => reply('{"message":"Missing required permission(s): database_read"}', 403);
const spy = (handler) => {
  const seen = [];
  return { seen, fetchImpl: async (url, init) => { seen.push(url); return handler(url, init); } };
};

const viaApi = spy((url, init) =>
  url !== API ? reply("unexpected", 500) : /to_regclass/.test(init.body) ? reply('[{"exists":true}]') : reply('[{"filename":"0001_a.sql"}]'));
const apiResult = await appliedMigrations(uatEnv, "abc", { fetchImpl: viaApi.fetchImpl });
check(
  "applied: the Management API answers, and the database is not asked",
  apiResult.ok && apiResult.applied.join() === "0001_a.sql" && apiResult.via === "the Management API" && !viaApi.seen.includes(REST),
  JSON.stringify(apiResult),
);

const viaRest = spy((url) => (url === API ? denied() : url === REST ? reply('[{"filename":"0001_a.sql"},{"filename":"0002_b.sql"}]') : reply("unexpected", 500)));
const restResult = await appliedMigrations(uatEnv, "abc", { fetchImpl: viaRest.fetchImpl });
check(
  "applied: a token that cannot read falls back to the database itself",
  restResult.ok && restResult.applied.length === 2 && restResult.via === "the database directly" && viaRest.seen.includes(REST),
  JSON.stringify(restResult),
);

const noTable = spy((url) => (url === API ? denied() : reply('{"message":"relation \\"schema_migrations\\" does not exist"}', 400)));
const noTableResult = await appliedMigrations(uatEnv, "abc", { fetchImpl: noTable.fetchImpl });
check("applied: no schema_migrations table reads as nothing applied, not as a failure", noTableResult.ok && noTableResult.applied.length === 0, JSON.stringify(noTableResult));

const wrongProject = spy(() => denied());
const wrongResult = await appliedMigrations({ ...uatEnv, NEXT_PUBLIC_SUPABASE_URL: "https://zzz.supabase.co" }, "abc", { fetchImpl: wrongProject.fetchImpl });
check(
  "applied: a URL naming another project is refused rather than answered",
  !wrongResult.ok && wrongResult.reason.includes("not project abc") && wrongProject.seen.length === 1,
  JSON.stringify(wrongResult),
);

const bothDown = spy((url) => (url === API ? denied() : reply("gateway", 502)));
const bothResult = await appliedMigrations(uatEnv, "abc", { fetchImpl: bothDown.fetchImpl });
check(
  "applied: both routes failing names both reasons and stays a 'could not ask'",
  !bothResult.ok && bothResult.reason.includes("database_read") && bothResult.reason.includes("502"),
  JSON.stringify(bothResult),
);
const noKey = await appliedMigrations({ SUPABASE_ACCESS_TOKEN: "t" }, "abc", { fetchImpl: spy(() => denied()).fetchImpl });
check("applied: no service-role key says so rather than pretending", !noKey.ok && noKey.reason.includes("SUPABASE_SERVICE_ROLE_KEY"), JSON.stringify(noKey));

await exitWith(failures ? 1 : 0);
