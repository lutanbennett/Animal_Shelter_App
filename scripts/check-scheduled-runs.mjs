#!/usr/bin/env node
// exit-ok: every child process is a *Sync call and nothing opens a socket, so no handle is open at process.exit
/**
 * ASSERTION: for each scheduled GitHub workflow listed in WATCHED, the most recent run triggered by the
 * schedule concluded `success` AND started less than MAX_AGE_HOURS ago. Exits 1 otherwise.
 *
 * It catches the two different faults separately:
 *   - RED   a scheduled run exists and failed (GitHub emails only whoever last edited the cron line);
 *   - STALE no scheduled run exists, or the newest is too old, i.e. the nightly never happened. Nothing else
 *           notices this at all.
 *
 * Why a script and not an issue-opening workflow or the /status tile: it needs no secret and no new permission
 * (the workflows keep `contents: read`), and the lint's own token must not be handed to the app. A planner runs it
 * (`/plan-day`), the same way as check-stale-titles.mjs. MAX_AGE_HOURS is 36 because GitHub delays scheduled runs
 * 7-9 hours (PR #1626), so a daily job can legitimately be ~33h between runs.
 *
 *   node scripts/check-scheduled-runs.mjs                 # judge the newest scheduled run of each watched workflow
 *   node scripts/check-scheduled-runs.mjs --run <id>      # judge one specific run (e.g. a historical failure)
 *   node scripts/check-scheduled-runs.mjs --as-of <ISO>   # pretend "now" is that time (to prove STALE)
 * Needs the `gh` CLI signed in. Read-only.
 */
import { execFileSync } from "node:child_process";

const WATCHED = ["tenancy-catalogue.yml", "tenancy-canary.yml", "advisories.yml"];
const MAX_AGE_HOURS = 36;

const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const now = opt("--as-of") ? new Date(opt("--as-of")) : new Date();
const FIELDS = "databaseId,event,conclusion,status,createdAt,workflowName";
const gh = (a) => JSON.parse(execFileSync("gh", a, { encoding: "utf8" }));

let bad = 0;
const report = (name, ok, msg) => {
  if (!ok) bad++;
  console.log(`${ok ? "ok   " : "FAIL "} ${name}: ${msg}`);
};

if (opt("--run")) {
  const r = gh(["run", "view", opt("--run"), "--json", FIELDS]);
  report(r.workflowName, r.conclusion === "success", `run ${r.databaseId} (${r.event}, ${r.createdAt}) concluded ${r.conclusion || r.status}`);
} else {
  for (const wf of WATCHED) {
    const [r] = gh(["run", "list", "--workflow", wf, "--event", "schedule", "--limit", "1", "--json", FIELDS]);
    if (!r) { report(wf, false, "STALE: no scheduled run has ever happened"); continue; }
    const age = (now - new Date(r.createdAt)) / 36e5;
    if (r.status !== "completed") { report(wf, age < MAX_AGE_HOURS, `run ${r.databaseId} is ${r.status}`); continue; }
    if (r.conclusion !== "success") { report(wf, false, `RED: run ${r.databaseId} (${r.createdAt}) concluded ${r.conclusion}; read it with gh run view ${r.databaseId} --log`); continue; }
    if (age >= MAX_AGE_HOURS) { report(wf, false, `STALE: newest scheduled run ${r.databaseId} is ${age.toFixed(0)}h old (limit ${MAX_AGE_HOURS}h)`); continue; }
    report(wf, true, `run ${r.databaseId} succeeded ${age.toFixed(0)}h ago`);
  }
}
process.exit(bad ? 1 : 0);
