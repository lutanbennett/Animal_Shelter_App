#!/usr/bin/env node
/**
 * Checks the release guards the Worker deploy and the Pi deploy share
 * (scripts/lib/release-guards.mjs): unreleased notes, version mismatch,
 * missing migrations, "could not ask" as a warning, and --force.
 *
 *   node scripts/check-release-guards.mjs
 *
 * No network, no database: git and the Management API are stubbed, and the
 * one real process spawned is guard-release.mjs --env test, which must not
 * ask for an environment file. Exits 1 if any case is wrong.
 */
import { spawnSync } from "node:child_process";
import { decideGuard, releaseProblems, schemaVerdict } from "./lib/release-guards.mjs";

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

const test = spawnSync(process.execPath, ["scripts/pi/guard-release.mjs", "--env", "test"], { encoding: "utf8" });
check("--env test is not guarded", test.status === 0 && test.stdout.includes("test is not guarded"), test.stdout + test.stderr);
const noReason = spawnSync(process.execPath, ["scripts/pi/guard-release.mjs", "--env", "production", "--force"], { encoding: "utf8" });
check("--force without a reason is refused", noReason.status === 2 && noReason.stderr.includes("needs a reason"), noReason.stderr);

process.exit(failures ? 1 : 0);
