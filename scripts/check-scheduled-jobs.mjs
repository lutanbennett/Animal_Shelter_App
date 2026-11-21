// Source arm of the scheduled-writer check (#swout): a job the Worker runs that acts outside the database (mail, Google,
// a translation engine, a storage bucket) must consider archived_at, or say why not. Reads files only: no database, no
// network, so it runs in CI by riding `npm run lint`, as check-platform-files.mjs does. Logic: scripts/lib/scheduled-jobs.mjs.
//   node scripts/check-scheduled-jobs.mjs [root]
import { describe, findProblems, readJobs } from "./lib/scheduled-jobs.mjs";
import { exitWith } from "./lib/exit.mjs";

const root = process.argv[2] ?? ".";
const { jobs } = readJobs(root);
console.log("check-scheduled-jobs: jobs dispatched from worker/index.mjs scheduled()");
for (const j of jobs) console.log(describe(j));
const problems = findProblems(root);
if (problems.length) {
  for (const p of problems) console.error("  PROBLEM: " + p);
  await exitWith(1);
} else {
  console.log("  ok: every job that acts outside the database skips a closed shelter or records why not");
  await exitWith(0);
}
