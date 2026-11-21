// #m52yp: the structural half of the public-view tenancy guard. Reads migration files only (no database, no token), so it runs
// on every pull request through `npm run lint`. Logic and reasoning: scripts/lib/view-owners.mjs.
//   node scripts/check-view-owners.mjs [root]
import { findProblems, readState } from "./lib/view-owners.mjs";
import { exitWith } from "./lib/exit.mjs";

const root = process.argv[2] ?? ".";
const state = readState(root);
const problems = findProblems(state);
console.log(`check-view-owners: ${state.size} views read from supabase/migrations (no database read; cannot see a view made inside a DO block or a function)`);
if (problems.length) {
  for (const p of problems) console.error("  PROBLEM: " + p);
  await exitWith(1);
} else {
  console.log("  ok: every view is security_invoker, owned by rls_definer, or scopes itself by shelter");
  await exitWith(0);
}
