#!/usr/bin/env node
// Release-order guard (#ujqr5). Run it in docs/release-procedure.md section 5, BEFORE the apply:
//
//   node scripts/check-release-order.mjs --env production --worker-deployed <commit the Worker was deployed from>
//
// Refuses (exit 1) when a migration that must follow the Worker (scripts/lib/release-order.mjs) is pending on that
// environment and the Worker is not proven live. It also refuses when it cannot ask the database what is pending:
// a guard that cannot tell must not look like one that passed.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { exitWith } from "./lib/exit.mjs";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { appliedMigrations } from "./lib/deploy-schema.mjs";
import { releaseOrderProblems, MUST_FOLLOW_WORKER } from "./lib/release-order.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const i = rest.indexOf("--worker-deployed");
const workerSha = i >= 0 ? rest[i + 1] ?? null : null;
const read = (ref, path) => {
  const r = spawnSync("git", ["show", `${ref}:${path}`], { encoding: "utf8" });
  return r.status === 0 ? r.stdout : null;
};

console.log(`check-release-order: ${envName}`);
const env = loadEnv(envName);
const applied = await appliedMigrations(env, projectRef(env));
if (!applied.ok) {
  console.error(`REFUSED: could not ask ${envName} what is applied (${applied.reason}).`);
  await exitWith(1);
}
const have = new Set(applied.applied);
const pending = readdirSync("supabase/migrations").filter((n) => n.endsWith(".sql") && !have.has(n));
const problems = releaseOrderProblems({ pending, workerSha, read });
if (problems.length) {
  for (const p of problems) console.error(`REFUSED: ${p}`);
  await exitWith(1);
}
const guarded = MUST_FOLLOW_WORKER.filter((e) => pending.includes(e.migration)).length;
console.log(guarded ? `ok: ${guarded} guarded migration(s) pending, Worker proven live at ${workerSha}.` : "ok: no guarded migration is pending here, nothing to prove.");
await exitWith(0);
