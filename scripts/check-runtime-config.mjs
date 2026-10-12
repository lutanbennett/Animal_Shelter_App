// Fails when runtime configuration has drifted from scripts/lib/runtime-config.mjs:
//   - a consumer keeps its own literal copy of a manifest name,
//   - .env.example and the manifest disagree about which names exist,
//   - the manifest itself is malformed.
// Part of `npm run lint`. It cannot tell you a value is SET anywhere; it only
// stops the lists disagreeing about which names exist.
import { readFileSync } from "node:fs";
import { RUNTIME_CONFIG } from "./lib/runtime-config.mjs";

const problems = [];
const names = RUNTIME_CONFIG.map((c) => c.name);
for (const c of RUNTIME_CONFIG) {
  if (!["worker", "pi", "both", "tools"].includes(c.where)) problems.push(`${c.name}: where "${c.where}" is not worker|pi|both|tools`);
  if (!c.purpose) problems.push(`${c.name}: no purpose line`);
}
for (const n of names) if (names.indexOf(n) !== names.lastIndexOf(n)) problems.push(`${n} is listed twice`);

const example = readFileSync(".env.example", "utf8");
const exampleNames = [...example.matchAll(/^#?\s*([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]);
for (const c of RUNTIME_CONFIG) {
  if ((c.source ?? "env") === "env" && !exampleNames.includes(c.name)) problems.push(`${c.name} is in the manifest but not in .env.example`);
}
for (const n of exampleNames) if (!names.includes(n)) problems.push(`${n} is in .env.example but not in scripts/lib/runtime-config.mjs`);

for (const f of ["scripts/deploy.mjs", "scripts/pi/write-env.mjs", "src/lib/status/run.ts"]) {
  const text = readFileSync(f, "utf8");
  for (const n of names) if (new RegExp(`["'\`]${n}["'\`]`).test(text)) problems.push(`${f} spells out "${n}"; derive it from the manifest`);
}

if (problems.length) {
  console.error("check-runtime-config:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`check-runtime-config: ${names.length} names, .env.example and consumers agree.`);
