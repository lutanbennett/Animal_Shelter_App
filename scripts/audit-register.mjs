// The PR `audit` job's command: `npm audit` for production dependencies, read through docs/advisory-register.json.
//
//   node scripts/audit-register.mjs        (npm run audit:register)
//
// npm has no native ignore, so this wraps it. It FAILS on any high or critical advisory that is not registered, and on a registered
// one whose recorded "why it is unreachable" has stopped being true (a mustStayAbsent pattern now matches, or reviewBy has passed).
// It is not a way to hide a red: every entry needs a decision file, and anything new is red. `npm run audit:prod` is unchanged and is
// what advisories.yml (the daily run, which fails on purpose) and the release step still use.
//
// Output keeps the markers ci.yml greps for ("found N vulnerabilit…", "Severity:") on a finding only. A registry or npm failure
// prints neither, so ci.yml's "inconclusive, not a finding" path still applies.
import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const reg = JSON.parse(readFileSync("docs/advisory-register.json", "utf8"));
const RANK = { low: 1, moderate: 2, high: 3, critical: 4 };

let raw;
try {
  raw = execSync("npm audit --omit=dev --json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 26 });
} catch (e) {
  raw = e.stdout; // npm exits 1 when it finds anything; the JSON is still on stdout
}
let report;
try { report = JSON.parse(raw); } catch { console.error("audit-register: npm audit gave no readable JSON (registry unreachable?). Not a finding."); process.exit(2); }
if (report.error) { console.error(`audit-register: npm audit error: ${report.error.summary ?? report.error.code}. Not a finding.`); process.exit(2); }

const found = new Map(); // GHSA id -> { package, severity, title }
for (const [name, v] of Object.entries(report.vulnerabilities ?? {})) {
  for (const via of v.via) {
    if (typeof via !== "object") continue;
    const id = (via.url ?? "").split("/").pop();
    if (RANK[via.severity] >= RANK.high) found.set(id, { package: name, severity: via.severity, title: via.title });
  }
}

const accepted = new Map(reg.accepted.map((a) => [a.id, a]));
const problems = [];
const today = new Date().toISOString().slice(0, 10);

function* walk(p) {
  if (!existsSync(p)) return;
  if (statSync(p).isFile()) { yield p; return; }
  for (const f of readdirSync(p)) if (f !== "node_modules") yield* walk(join(p, f));
}
const grep = (re, paths, skip = []) => {
  const hits = [];
  for (const root of paths) for (const f of walk(root)) {
    if (skip.includes(f.replaceAll("\\", "/"))) continue;
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((l, i) => { if (re.test(l)) hits.push(`${f}:${i + 1}`); });
  }
  return hits;
};

const newOnes = [];
for (const [id, a] of found) {
  const rec = accepted.get(id);
  if (!rec) { newOnes.push([id, a]); continue; }
  if (today > rec.reviewBy) problems.push(`${id}: review date ${rec.reviewBy} has passed. Re-assess, then move reviewBy on (${rec.decision}).`);
  for (const c of rec.mustStayAbsent) {
    const hits = grep(new RegExp(c.pattern), c.paths, c.skip);
    if (hits.length) problems.push(`${id}: no longer unreachable. ${c.what} now appears at ${hits.slice(0, 5).join(", ")}. Re-read ${rec.decision}.`);
  }
  const b = rec.mustBeAbsentFromBuild;
  if (b) {
    const built = b.paths.filter(existsSync);
    if (!built.length) console.log(`note: ${id}: no build present, so "${b.what}" was not checked.`);
    else if (grep(new RegExp(b.pattern), built).length) problems.push(`${id}: ${b.what} now contains /${b.pattern}/. Re-read ${rec.decision}.`);
  }
}
for (const id of accepted.keys()) if (!found.has(id)) console.log(`note: ${id} is no longer reported. Delete its entry from docs/advisory-register.json.`);
for (const r of reg.resolved) for (const id of r.ids) if (found.has(id)) problems.push(`${id}: came back after being resolved (${r.decision}). That is a regression, not an accepted advisory.`);

for (const [id, a] of found) if (accepted.has(id) && !problems.length) console.log(`registered: ${id} (${a.package}, ${a.severity}) ${a.title}`);
if (newOnes.length) {
  console.log(`found ${newOnes.length} vulnerabilities not on the register`);
  for (const [id, a] of newOnes) console.log(`Severity: ${a.severity}  ${id}  ${a.package}  ${a.title}`);
  console.log("Assess reachability, then fix it, or record a decision file and an entry in docs/advisory-register.json.");
}
for (const p of problems) console.log(`REGISTER: ${p}`);
if (newOnes.length || problems.length) process.exit(1);
console.log(`audit-register: ${found.size} high/critical advisor${found.size === 1 ? "y" : "ies"}, all registered and still unreachable.`);
