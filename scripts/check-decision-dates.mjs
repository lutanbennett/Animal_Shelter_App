// A decision file dated in the future sorts ahead of the files that supersede it, so a stale conclusion reads as current, and
// `ls docs/decisions | grep <subject>` misreports which of two files is newer. Refuses a date after today on any file this branch ADDS
// under docs/decisions/ (git's added list against the merge-base with origin/main, plus untracked). Existing files are not judged,
// and docs/releases/ is not looked at: a release record is legitimately dated for a planned cut.
// "Today" is the later of the UTC date and the shelter's (Asia/Bangkok) date, so a file written in the evening there is not refused.
//
//   node scripts/check-decision-dates.mjs [base-ref]     (default origin/main)
import { execFileSync } from "node:child_process";
import { exitWith } from "./lib/exit.mjs";

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).split("\n").filter(Boolean);
const base = process.argv[2] || process.env.DECISION_DATES_BASE || "origin/main";
const day = (tz) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
const today = [day("UTC"), day("Asia/Bangkok")].sort().pop();

let mergeBase;
try { mergeBase = git("merge-base", base, "HEAD")[0]; } catch { console.log(`FAIL cannot find ${base}: fetch it (CI needs fetch-depth 0)`); await exitWith(1); throw new Error("no base"); }
const added = new Set([
  ...git("diff", "--name-only", "--diff-filter=A", mergeBase, "--", "docs/decisions/"),
  ...git("ls-files", "--others", "--exclude-standard", "--", "docs/decisions/"),
]);
let failed = 0;
for (const f of [...added].sort()) {
  const m = /^docs\/decisions\/(\d{4}-\d{2}-\d{2})-/.exec(f);
  if (!m) { failed++; console.log(`FAIL ${f} has no leading yyyy-mm-dd- date`); continue; }
  if (m[1] > today) { failed++; console.log(`FAIL ${f} is dated ${m[1]}, after today (${today}): rename it`); }
}
if (!failed) console.log(`ok   ${added.size} decision file(s) added, none dated after ${today}`);
await exitWith(failed ? 1 : 0);
