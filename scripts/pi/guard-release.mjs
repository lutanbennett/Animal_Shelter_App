// The Pi's release guard: refuse to deploy a commit that is not a
// written-down release, or whose database is missing a migration it carries.
// Runs from scripts/pi/deploy-pi.sh once the checkout is at the commit to be
// served. The rules and messages are scripts/lib/release-guards.mjs, the same
// ones scripts/deploy.mjs applies to the Worker.
//
//   node scripts/pi/guard-release.mjs --env production
//   node scripts/pi/guard-release.mjs --env uat --force "sign-in outage, PR #123 follows"
//
// Exit 0: go ahead. Exit 2: refused. test is never guarded (it runs ahead of
// and behind release on purpose), exactly as in deploy.mjs.
//
// --force is for a genuine emergency. It prints every problem it is
// overriding in capitals and appends one line, with the reason, to
// ~/lanna-deploy-overrides.log (outside the checkout, so a reset cannot
// erase it). The reason is required, and the release record that follows
// must mention it.
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadEnv, parseEnvArg, projectRef } from "../lib/env.mjs";
import { appliedMigrations } from "../lib/deploy-schema.mjs";
import { decideGuard, releaseProblems, schemaVerdict } from "../lib/release-guards.mjs";
import { latestRelease, unreleased } from "../../src/lib/releases.ts";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const forceAt = rest.indexOf("--force");
const force = forceAt >= 0 ? (rest[forceAt + 1] ?? "").trim() : null;

if (envName === "test") {
  console.log("guard-release: test is not guarded.");
  process.exit(0);
}
if (forceAt >= 0 && !force) {
  console.error('guard-release: --force needs a reason: --force "why this cannot wait for a release"');
  process.exit(2);
}

const git = (args) => spawnSync(`git ${args}`, { shell: true, encoding: "utf8" }).stdout.trim();
const env = loadEnv(envName);
const pkgVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const problems = releaseProblems({ pkgVersion, latestRelease, unreleased });
const schema = schemaVerdict({ envName, result: await appliedMigrations(env, projectRef(env)), git });
const verdict = decideGuard({ envName, problems, schema, force });

for (const w of verdict.warnings) console.warn(`guard-release: WARNING: ${w}`);
if (verdict.refuse) {
  for (const e of verdict.errors) console.error(`guard-release: ${e}`);
  console.error("guard-release: refused. A real emergency: rerun deploy-pi.sh with --force \"reason\".");
  process.exit(2);
}
if (verdict.overridden.length) {
  const sha = git("rev-parse --short HEAD");
  const bar = "!".repeat(72);
  console.warn(`${bar}\nguard-release: FORCED PAST THE RELEASE GUARD (${envName} @ ${sha}): ${force}`);
  for (const e of verdict.overridden) console.warn(`  OVERRIDDEN: ${e.replace(/\n/g, "\n  ")}`);
  console.warn(`${bar}`);
  const line = `${new Date().toISOString()} ${envName} ${sha} FORCED: ${force} | ${verdict.overridden.join(" | ").replace(/\s+/g, " ")}\n`;
  appendFileSync(join(homedir(), "lanna-deploy-overrides.log"), line);
  console.warn("guard-release: recorded in ~/lanna-deploy-overrides.log. Put it in the next release record.");
}
console.log(`guard-release: ${envName} ok, release ${latestRelease.version} @ ${git("rev-parse --short HEAD")}`);
