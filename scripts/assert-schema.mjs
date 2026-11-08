// The deploy machine's schema assertion, run BEFORE a Pi build starts.
//
//   node scripts/assert-schema.mjs --env production [--ref <commit>]
//
// Exit 0: the database holds every migration the commit carries. Exit 2: it
// does not (each missing file is named with the app files its `-- consumer:`
// header says read it), OR it could not be asked, which is a refusal here and
// not a warning. The Pi cannot do this check (it has no SUPABASE_ACCESS_TOKEN
// and must not get one), so it lives where the token already is
// (docs/decisions/2026-11-08-guard-release-asserts.md).
//
// --ref defaults to origin/main, what deploy-pi.sh ships for uat/production.
// test is not asked (it runs ahead of and behind release on purpose).
import { spawnSync } from "node:child_process";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { appliedMigrations } from "./lib/deploy-schema.mjs";
import { assertSchema } from "./lib/release-guards.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
if (envName === "test") {
  console.log("assert-schema: test is not asked.");
  process.exit(0);
}
const refAt = rest.indexOf("--ref");
const ref = refAt >= 0 ? rest[refAt + 1] : "origin/main";
if (!ref) {
  console.error("assert-schema: --ref needs a commit.");
  process.exit(2);
}
const gitRun = (args) => {
  const r = spawnSync("git", args, { encoding: "utf8", env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr.trim()}`);
  return r.stdout;
};

const env = loadEnv(envName);
const verdict = assertSchema({
  envName,
  result: await appliedMigrations(env, projectRef(env)),
  // deployedMigrations() asks for `ls-tree HEAD <dir>/`; point it at the ref being shipped.
  git: (a) => gitRun(a.replace(/^ls-tree HEAD /, `ls-tree ${ref} `).split(" ")).trim(),
  read: (path) => gitRun(["show", `${ref}:${path}`]),
});
if (!verdict.ok) {
  console.error(`assert-schema: REFUSED. ${verdict.message}`);
  process.exit(2);
}
console.log(`assert-schema: ${verdict.message} (${ref} @ ${gitRun(["rev-parse", "--short", ref]).trim()})`);
