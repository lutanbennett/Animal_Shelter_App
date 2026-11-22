#!/usr/bin/env node
/**
 * Fails when src/ reads process.env.X for a name that is in neither
 * scripts/lib/runtime-config.mjs nor wrangler.jsonc: such a value can never
 * arrive at any server (#psreg). Names with a reason live in
 * docs/env-reads-allowlist.json. Part of `npm run lint`. Needs no live state.
 *   node scripts/check-env-registered.mjs [--root <dir>]   (--root is for the self-test)
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { RUNTIME_CONFIG } from "./lib/runtime-config.mjs";
import { exitWith } from "./lib/exit.mjs";

const rootArg = process.argv.indexOf("--root");
const root = rootArg > 0 ? process.argv[rootArg + 1] : "src";

function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx|mjs)$/.test(f) && !/\.test\./.test(f)) yield p;
  }
}

const reads = new Map();
for (const file of walk(root)) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/process\.env(?:\.([A-Z][A-Z0-9_]+)|\[["']([A-Z][A-Z0-9_]+)["']\])/g)) {
    const n = m[1] ?? m[2];
    if (!reads.has(n)) reads.set(n, file);
  }
}

// wrangler.jsonc has comments; a quoted UPPER_CASE key followed by a colon is a var name.
const wrangler = new Set([...readFileSync("wrangler.jsonc", "utf8").matchAll(/"([A-Z][A-Z0-9_]+)"\s*:/g)].map((m) => m[1]));
const registered = new Set([...RUNTIME_CONFIG.map((c) => c.name), ...wrangler]);

const list = JSON.parse(readFileSync("docs/env-reads-allowlist.json", "utf8"));
const allowed = new Set(list.allowed.map((r) => r.name));
const faults = new Set(list.openFaults.map((r) => r.name));
const problems = [];

for (const [n, file] of reads) {
  if (registered.has(n)) continue;
  if (allowed.has(n) || faults.has(n)) continue;
  problems.push(`${n} (read in ${file}) is in neither scripts/lib/runtime-config.mjs nor wrangler.jsonc, so no server can hold it. Register it in the same change, or, having read what sets it, add a dated reason to docs/env-reads-allowlist.json.`);
}
if (root === "src") {
  for (const n of [...allowed, ...faults]) {
    if (registered.has(n)) problems.push(`${n} is now registered; delete its record in docs/env-reads-allowlist.json.`);
    else if (!reads.has(n)) problems.push(`${n} is no longer read in src/; delete its record in docs/env-reads-allowlist.json.`);
  }
}

for (const n of faults) console.log(`OPEN FAULT (filed ${list.openFaults.find((r) => r.name === n).filed}): ${n}`);
if (problems.length) {
  console.error("check-env-registered:\n  " + problems.join("\n  "));
  await exitWith(1);
} else {
  console.log(`check-env-registered: ${reads.size} names read in ${root}, every one registered or ruled.`);
  await exitWith(0);
}
