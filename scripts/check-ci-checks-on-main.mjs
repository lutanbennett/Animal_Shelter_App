// DOES EVERY BLOCKING CHECK IN ci.yml PASS ON THIS CHECKOUT RIGHT NOW?  (#ckcia)
//
//   node scripts/check-ci-checks-on-main.mjs      (run in the main checkout, on main)
//
// WHY. On 2026-11-22 `check-backlog-waiting.mjs` shipped into the blocking `script-integrity`
// job, and by next morning it was red on `main` before any stream had pushed: every PR that day
// would have failed a check about items it never filed. A stream proves its own check on its own
// branch and nothing asks again once `main` moves. `check-planner-preflight.mjs` runs this so the
// answer arrives before any worktree is made, whether or not anyone is curious.
//
// WHAT IT ASSERTS, and what it does not:
//  - It reads ci.yml AS YAML (a grep counts comments such as "no continue-on-error" as the setting).
//  - BLOCKING means the job and the step have no `continue-on-error: true`. `audit` is therefore
//    left out. `test-plan` has no such setting but its SCRIPT exits 0 on an unsigned plan by design,
//    so it passes here and that is honest: it asserts the script's outcome, not the job's wiring.
//  - Checks that diff against a PR base (`--base`, `origin/main` args) or whose job runs only on
//    pull requests are SKIPPED and listed: on main they compare main with itself and prove nothing.
//    A skip is not a pass and is printed as one.
//  - Steps that are not a plain `node scripts/check-*.mjs` (npm run, shell conditionals) are not run.
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { exitWith } from "./lib/exit.mjs";

const require = createRequire(import.meta.url);
let YAML;
try {
  YAML = require("yaml");
} catch {
  console.log("note  ci.yml not checked: the `yaml` package is not installed (run npm ci)");
  process.exit(0);
}

export function collect(text) {
  const wf = YAML.parse(text);
  const run = [];
  const skipped = [];
  for (const [jobName, job] of Object.entries(wf.jobs ?? {})) {
    if (job["continue-on-error"] === true) continue;
    const prOnly = /pull_request/.test(String(job.if ?? ""));
    for (const step of job.steps ?? []) {
      if (typeof step.run !== "string" || step["continue-on-error"] === true) continue;
      for (const line of step.run.split("\n")) {
        const m = line.trim().match(/^node((?: --[\w-]+(?:=\S+)?)*) (scripts\/check-[\w-]+\.mjs)((?: .*)?)$/);
        if (!m) continue;
        const args = m[3].trim();
        const entry = { job: jobName, script: m[2], cmd: line.trim() };
        if (prOnly || /--base|origin\//.test(args)) skipped.push(entry);
        else run.push({ ...entry, argv: [...m[1].trim().split(/\s+/).filter(Boolean), m[2], ...args.split(/\s+/).filter(Boolean)] });
      }
    }
  }
  return { run, skipped };
}

const exec = (argv) =>
  new Promise((resolve) => {
    const p = spawn(process.execPath, argv, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    let timedOut = false;
    const t = setTimeout(() => ((timedOut = true), p.kill()), 300_000);
    p.on("close", (code) => (clearTimeout(t), resolve({ code, out, timedOut })));
  });

const { run, skipped } = collect(readFileSync(".github/workflows/ci.yml", "utf8"));
const results = [];
for (let i = 0; i < run.length; i += 4) {
  results.push(...(await Promise.all(run.slice(i, i + 4).map(async (r) => ({ r, ...(await exec(r.argv)) })))));
}
const red = results.filter((x) => x.code !== 0);
for (const x of results) console.log(`${x.code === 0 ? "ok  " : "FAIL"} ${x.r.job}: ${x.r.script}${x.code === 0 ? "" : ` (${x.timedOut ? "TIMED OUT after 300s, CI allows 5 min per job" : `exit ${x.code}`})`}`);
for (const s of skipped) console.log(`skip ${s.job}: ${s.script} — diffs against a PR base, proves nothing on main`);
for (const x of red) console.log(`\n--- ${x.r.script} ---\n${x.out.trim().split("\n").slice(-12).join("\n")}`);
console.log(
  red.length
    ? `\n${red.length} blocking check(s) RED on this checkout: every PR will fail them until main is fixed.`
    : `\nAll ${results.length} blocking checks pass here (${skipped.length} PR-only skipped, not passed).`,
);
await exitWith(red.length ? 1 : 0);
