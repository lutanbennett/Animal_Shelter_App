// READ-ONLY answers about the live database, from a fixed list of named checks. Nothing is changed, and no SQL can be
// passed in: see scripts/lib/readonly-checks.mjs for how that is guaranteed.
//
//   node scripts/check-production.mjs                         lists the checks
//   node scripts/check-production.mjs <check> [--env test]    runs one against production (or dev with --env test)
//   node scripts/check-production.mjs all                     runs every check
//
// Exit 0 = ran and nothing to flag; 1 = a check found something; 2 = could not run. The dev-only guards in the other
// check scripts are untouched (docs/decisions/2026-10-24-production-check-script.md).
import { loadEnv, projectRef } from "./lib/env.mjs";
import { CHECKS, runCheck } from "./lib/readonly-checks.mjs";

const args = process.argv.slice(2);
const i = args.indexOf("--env");
const envName = i >= 0 ? args.splice(i, 2)[1] : "production";
if (!["production", "test"].includes(envName)) {
  console.error("--env must be production or test.");
  process.exit(2);
}
const wanted = args[0];

if (!wanted) {
  console.log("Read-only checks. Run one with: node scripts/check-production.mjs <name>\n");
  for (const [n, c] of Object.entries(CHECKS)) console.log(`  ${n.padEnd(18)} ${c.asks}`);
  console.log(`  ${"all".padEnd(18)} Run every check above.`);
  process.exit(0);
}
const names = wanted === "all" ? Object.keys(CHECKS) : [wanted];
for (const n of names) {
  if (!Object.hasOwn(CHECKS, n)) {
    console.error(`No check called "${n}". Run with no arguments to see the list.`);
    process.exit(2);
  }
}

const env = loadEnv(envName);
const ref = projectRef(env);
console.log(`Read-only check on ${envName} (${ref}).\n`);
let flagged = false;
for (const n of names) {
  try {
    const result = await runCheck(n, { ref, token: env.SUPABASE_ACCESS_TOKEN });
    console.log(`${n} — ${CHECKS[n].asks}`);
    for (const line of CHECKS[n].render(result)) console.log(`   ${line}`);
    if (CHECKS[n].failed?.(result)) flagged = true;
  } catch (e) {
    console.error(`${n}: could not run — ${e.message}`);
    process.exitCode = 2;
  }
  console.log();
}
if (flagged && !process.exitCode) process.exitCode = 1;
