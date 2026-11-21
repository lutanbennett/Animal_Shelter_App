// Google identity: what can this session see, and does the written record agree?
//
//   node scripts/check-google-identity.mjs              (every environment whose env file is here)
//   node scripts/check-google-identity.mjs --env uat    (one environment)
//   node scripts/check-google-identity.mjs --no-probe   (names only, no network)
//
// WHY. Every other part of this system has an instrument; Google identity had a dated
// document (docs/google-cloud-inventory.md) and backlog prose. When the platform's own
// account was created and its tokens minted, nothing in the repository changed, and
// planners went on repeating the old sentence (#3zr7o, 2026-11-21).
//
// It reads docs/google-identity-registry.json (what is RECORDED per environment and
// identity) and the env files (what is OBSERVED, by a refresh probe), and exits 1 only
// when the two CONTRADICT. A token recorded as revoked that IS revoked passes: a check
// that went red on a known state (#drvtk) would be ignored, which is the fault it fixes.
//
// NO SECRET VALUE IS PRINTED: key names and verdicts only. Read-only; creates nothing.
import { readGoogleIdentity, readRegistry, compare } from "./lib/google-identity.mjs";
import { ENVIRONMENTS } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const argv = process.argv.slice(2);
const i = argv.indexOf("--env");
const envs = i >= 0 ? [argv[i + 1]] : ENVIRONMENTS;
if (i >= 0 && !ENVIRONMENTS.includes(envs[0])) {
  console.error(`--env must be one of ${ENVIRONMENTS.join(", ")}`);
  await exitWith(2);
}
const rows = compare(await readGoogleIdentity({ envs, probe: !argv.includes("--no-probe") }), readRegistry());

for (const r of rows) {
  const who = r.identity === "*" ? "(all)" : r.identity;
  const same = r.sameAccountAs ? `; same Drive account as ${r.sameAccountAs}` : r.sameAccountAs === null ? "; a different Drive account from the other identity" : "";
  const tag = r.status === "CONTRADICTS" ? "FAIL" : r.status === "as-recorded" ? "ok  " : "note";
  const src = r.identity !== "*" ? ` [${r.source}]` : "";
  console.log(`${tag} ${r.env}/${who}: ${r.verdict}${same} - ${r.status}${r.detail ? `: ${r.detail}` : ""}${src}`);
}
const bad = rows.filter((r) => r.status === "CONTRADICTS");
console.log("");
console.log(
  bad.length
    ? `${bad.length} recorded claim(s) contradicted by what this session sees. Update docs/google-identity-registry.json (and any backlog item parked on it).`
    : "No recorded claim is contradicted.",
);
await exitWith(bad.length ? 1 : 0);
