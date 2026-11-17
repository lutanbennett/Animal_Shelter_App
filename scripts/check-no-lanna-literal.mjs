// Part 8 of the tenancy programme (#b4cmn), second half: no NEW file in src/ or worker/ may name Lanna.
// A shelter's name is read through shelterNames() (src/lib/shelter-settings.ts). A file that still names Lanna must be
// recorded in docs/shelter-settings-registry.json under lannaLiteralFiles with a reason; the manual (src/lib/manual/)
// is out of scope by the item's own done-when. `lanna` inside another word (planNameOf) is not a hit.
//   node scripts/check-no-lanna-literal.mjs
import fs from "node:fs";
import { execSync } from "node:child_process";

const reg = JSON.parse(fs.readFileSync("docs/shelter-settings-registry.json", "utf8"));
const allowed = new Map(reg.lannaLiteralFiles.map((r) => [r.file, r.reason]));
const found = new Map();
for (const f of execSync("git ls-files src worker", { encoding: "utf8" }).split(/\r?\n/).filter((f) => /\.(ts|tsx|mjs|js)$/.test(f))) {
  if (f.startsWith("src/lib/manual/") || !fs.existsSync(f)) continue;
  const n = fs.readFileSync(f, "utf8").split(/\r?\n/).filter((l) => /(?<![a-z])lanna/i.test(l)).length;
  if (n) found.set(f, n);
}
const bad = [];
for (const [f, n] of found) if (!allowed.has(f)) bad.push(`NEW LANNA LITERAL  ${f} (${n} line${n === 1 ? "" : "s"}): read the name through shelterNames() or record the file with a reason`);
for (const [f, why] of allowed) {
  if (!found.has(f)) bad.push(`STALE  ${f}: no longer names Lanna; delete its record`);
  if (!why || why.length < 15) bad.push(`NO REASON  ${f}`);
}
console.log(`${found.size} files name Lanna, ${allowed.size} recorded`);
bad.forEach((b) => console.log(b));
console.log(bad.length ? "NOT CLEAN" : "no unrecorded Lanna literal");
process.exit(bad.length ? 1 : 0);
