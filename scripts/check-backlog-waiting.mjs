#!/usr/bin/env node
// exit-ok: every child process is a *Sync call and nothing opens a socket, so no handle is open at process.exit
/**
 * Every OPEN backlog item says who it waits on, and keeps a name that does not move (#bkwai).
 *
 * Fails (exit 3): a missing tag, an unknown state, `decision` without `by:`, a `since:`/`date:` that
 * does not parse, a `since:` in the future, an open item with no name in docs/backlog-names.json,
 * two open items sharing a name, a name changed against HEAD (set BACKLOG_RENAME_ALLOW=1 for a
 * deliberate rename — the lock exists so a rename is a decision, not drift).
 * Does NOT fail on staleness: an item can wait on a person for months; `backlog-waiting.mjs --stale`
 * warns instead. CANNOT catch: whether the state is TRUE — that is a reading, not a pattern.
 * A docs/backlog-names.json that is PRESENT but corrupt is a finding too, not a crash: the names are
 * what every open item is checked against, so a check that cannot read them has verified nothing,
 * and the hook is built to let a crash through. Only a file it cannot READ at all is a crash, so a
 * branch cut before #bkwai, and a git that will not answer, still commit.
 * Exit 0 clean, 1 on a crash, 3 on a real finding (what .githooks/pre-commit reads).
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { STATES, DECIDERS, parseTag, validDate, openItems, parseNames, sinceInFuture, needsProof, hasProof } from "./lib/backlog-waiting.mjs";

const STAGED = process.argv.includes("--staged");
const FILE = "docs/backlog.md";
const NAMES = "docs/backlog-names.json";
const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
const read = (f) => (STAGED ? git("show", `:${f}`) : readFileSync(f, "utf8"));

let text, raw;
try {
  text = read(FILE);
  raw = read(NAMES);
} catch (err) {
  console.error(`check-backlog-waiting: could not read ${FILE} or ${NAMES} — ${err.message}`);
  process.exit(1);
}
let names;
try {
  names = parseNames(raw);
} catch (err) {
  console.error(`check-backlog-waiting: 1 problem(s)\n`);
  console.error(`  ${NAMES} is unusable: ${err.message}`);
  console.error(`\nEvery open item is checked against that file, so nothing at all was verified. Fix the file rather than committing past this.\n`);
  process.exit(3);
}
let before = null;
try { before = parseNames(git("show", `HEAD:${NAMES}`)); } catch { /* new file, or a HEAD copy that is no use: nothing to lock against */ }

// Dates are the SHELTER's day (Asia/Bangkok, UTC+7), not UTC (#utcds). Proof lines (#prvln) are REPORTED, not failed:
// flip PROOF_STRICT to true (or set BACKLOG_PROOF_STRICT=1) once every waiting:lutan item carries one.
const PROOF_STRICT = process.env.BACKLOG_PROOF_STRICT === "1" || false;
const noProof = [];
const problems = [];
const seen = new Map();
const items = openItems(text);
if (!items.length) { console.error("check-backlog-waiting: no open items found — that cannot be right"); process.exit(1); }

for (const { lineNo, id, line } of items) {
  const who = `line ${lineNo}${id ? ` (#${id})` : ""}`;
  const tag = parseTag(line);
  if (!tag) { problems.push(`${who}: no <!--waiting:<state> since:YYYY-MM-DD--> tag at the end of the line`); }
  else {
    if (!STATES.includes(tag.state)) problems.push(`${who}: unknown state "${tag.state}" (one of ${STATES.join(", ")})`);
    if (tag.bad.length) problems.push(`${who}: unreadable tag part(s): ${tag.bad.join(" ")}`);
    if (tag.state === "decision" && !DECIDERS.includes(tag.by)) problems.push(`${who}: decision needs by:${DECIDERS.join("|")}`);
    if (tag.by && tag.state !== "decision") problems.push(`${who}: by: only belongs on a decision`);
    if (!validDate(tag.since)) problems.push(`${who}: since:"${tag.since}" does not parse as YYYY-MM-DD`);
    else if (sinceInFuture(tag.since)) problems.push(`${who}: since:${tag.since} is in the future`);
    if (needsProof(tag) && !hasProof(line)) (PROOF_STRICT ? problems : noProof).push(`${who}: waiting:lutan with no "**Proof:** <how to check it is done>" line`);
    if (tag.date && !validDate(tag.date)) problems.push(`${who}: date:"${tag.date}" does not parse as YYYY-MM-DD`);
  }
  if (!id) continue;
  const name = names[id];
  if (!name || !String(name).trim()) { problems.push(`${who}: no name in ${NAMES}`); continue; }
  const words = name.trim().split(/\s+/).length;
  if (words < 3 || words > 6) problems.push(`${who}: name "${name}" is ${words} words, wanted three to six`);
  const key = name.trim().toLowerCase();
  if (seen.has(key)) problems.push(`${who}: name "${name}" is also #${seen.get(key)}`);
  seen.set(key, id);
  if (before && before[id] !== undefined && before[id] !== name && !process.env.BACKLOG_RENAME_ALLOW)
    problems.push(`${who}: name changed from "${before[id]}" to "${name}" — a name does not move; BACKLOG_RENAME_ALLOW=1 for a deliberate rename`);
}

if (problems.length) {
  console.error(`check-backlog-waiting: ${problems.length} problem(s)\n`);
  for (const p of problems.slice(0, 25)) console.error(`  ${p}`);
  console.error(`\nTag shape: <!--waiting:<state> [by:<who>] since:YYYY-MM-DD [date:YYYY-MM-DD]--> (since = when the state was last MEASURED).\n`);
  process.exit(3);
}
if (noProof.length) {
  console.log(`check-backlog-waiting: ${noProof.length} waiting:lutan item(s) have no proof line yet (reported, not failing):`);
  for (const p of noProof) console.log(`  ${p}`);
}
console.log(`check-backlog-waiting: ok — ${items.length} open items, each tagged and named`);
