// Hard-coded security is forbidden (Lutan, 2026-10-24): a role is exactly the set of cards it holds, and nothing keyed by role may
// change what a card does or whether it shows. This is the ratchet on the KNOWN debt in docs/hard-coded-security-registry.json.
//
//   node scripts/check-hard-coded-security.mjs
//
// It FAILS (exit 1) when a listed mechanism's reference count has risen above its baseline, or when a mechanism has moved from
// the file the registry names. A fall is good: it prints the new baseline to write down and exits 0. It never fails for a reduction.
//
// WHAT IT CANNOT DO: it counts references to mechanisms somebody has already named. It cannot detect a brand-new KIND of
// hard-coded rule that nobody has put in the registry. A green run means "the known set did not grow", not "there is none".
// Counts are lines in src/**/*.ts(x) matching each entry's pattern (docs/decisions/2026-10-24-hard-coded-security-ratchet.md).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const registry = JSON.parse(readFileSync(join(root, "docs/hard-coded-security-registry.json"), "utf8"));

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(name)) files.push(p);
  }
})(join(root, "src"));
const text = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };

for (const m of registry.mechanisms) {
  const re = new RegExp(m.pattern);
  const scope = m.files ? m.files.map((f) => join(root, f)) : files;
  let count = 0;
  for (const f of scope) for (const line of (text.get(f) ?? "").split("\n")) if (re.test(line)) count++;
  const anchored = existsSync(join(root, m.anchorFile)) && readFileSync(join(root, m.anchorFile), "utf8").includes(m.anchor);

  if (count > m.baseline) fail(`${m.id}: ${count} references, baseline ${m.baseline}. Hard-coded security may only go down; make it a card instead (CLAUDE.md, "Hard-coded security is forbidden").`);
  else if (!anchored && count > 0) fail(`${m.id}: no longer at ${m.anchorFile} ("${m.anchor}") but still referenced ${count} times. It moved; the registry must say where.`);
  else if (!anchored) console.log(`gone ${m.id}: removed. Delete its entry from the registry.`);
  else if (count < m.baseline) console.log(`down ${m.id}: ${count}, baseline ${m.baseline}. Lower "baseline" to ${count} in docs/hard-coded-security-registry.json.`);
  else console.log(`ok   ${m.id}: ${count}`);
}
if (failed) console.log(`\n${failed} failed. See CLAUDE.md: record it in docs/card-access-faults.md, do not patch around it and do not add another.`);
process.exit(failed ? 1 : 0);
