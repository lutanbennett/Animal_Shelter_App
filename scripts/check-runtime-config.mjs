// Fails when runtime configuration has drifted from scripts/lib/runtime-config.mjs:
//   - a consumer keeps its own literal copy of a manifest name,
//   - .env.example and the manifest disagree about which names exist,
//   - the manifest itself is malformed.
// Part of `npm run lint`. It cannot tell you a value is SET anywhere; it only
// stops the lists disagreeing about which names exist.
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { CLASSIFICATION, RUNTIME_CONFIG, WORKER_DEFAULTED_KNOBS } from "./lib/runtime-config.mjs";

const problems = [];
const names = RUNTIME_CONFIG.map((c) => c.name);
for (const c of RUNTIME_CONFIG) {
  if (!["worker", "pi", "both", "tools"].includes(c.where)) problems.push(`${c.name}: where "${c.where}" is not worker|pi|both|tools`);
  if ((c.routed || c.distinct) && c.source !== "wrangler") problems.push(`${c.name}: routed/distinct only mean something for a wrangler.jsonc var (source: "wrangler")`);
  if (c.routed && c.routed !== "required") problems.push(`${c.name}: routed "${c.routed}" is not "required"`);
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

// Every name must be classified for both machines, and a name the Worker code reads
// must be in the manifest, in wrangler.jsonc, or a listed defaulted knob.
const ROLES = ["secret-required", "secret-optional", "build-var", "wrangler-var", "own-module", "not-here"];
for (const c of CLASSIFICATION) for (const t of ["worker", "pi"]) if (!ROLES.includes(c[t].role) || !c[t].reason) problems.push(`${c.name}: no classification for ${t}`);
const wrangler = readFileSync("wrangler.jsonc", "utf8");
const known = new Set([...names, ...WORKER_DEFAULTED_KNOBS]);
for (const f of readdirSync("worker").filter((f) => f.endsWith(".mjs") && !f.endsWith(".test.mjs"))) {
  const reads = new Set([...readFileSync(`worker/${f}`, "utf8").matchAll(/env.([A-Z][A-Z0-9_]{3,})/g)].map((m) => m[1]));
  for (const n of reads) if (!known.has(n) && !wrangler.includes(`"${n}"`)) problems.push(`worker/${f} reads env.${n}, which is in no list: add it to scripts/lib/runtime-config.mjs (or wrangler.jsonc vars)`);
}
for (const n of WORKER_DEFAULTED_KNOBS) if (names.includes(n)) problems.push(`${n} is in the manifest, so drop it from WORKER_DEFAULTED_KNOBS`);

if (problems.length) {
  console.error("check-runtime-config:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`check-runtime-config: ${names.length} names, .env.example and consumers agree.`);
