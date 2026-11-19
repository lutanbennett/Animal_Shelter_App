#!/usr/bin/env node
/**
 * A script that calls fetch( and process.exit( must end through lib/exit.mjs,
 * or say why it need not.
 *
 *   node scripts/check-script-exits.mjs            check the repository
 *   node scripts/check-script-exits.mjs --list     also print one line per script
 *   node scripts/check-script-exits.mjs <root>     check another tree (used by the fixture proof)
 *
 * process.exit() after a fetch can die inside libuv on Windows (exit 127, after
 * the work succeeded) because undici's socket is still open
 * (docs/decisions/2026-10-16-shared-exit-helper.md, 2026-11-19-exit-code-after-success.md).
 * `await exitWith(code)` from scripts/lib/exit.mjs avoids it. A file that has
 * both calls in code (comments ignored) passes only if it:
 *   - imports lib/exit.mjs, or
 *   - carries `// exit-ok: <reason>`  (every exit runs before any fetch; read and verified), or
 *   - carries `// exit-debt: <reason>` (at risk, known, not converted yet; counted and printed).
 * A new script has none of these, so it fails. Whether an exit can follow a fetch
 * is not decidable by a pattern (a fail() helper defined early can be called
 * after a fetch), so the marker is the human judgement and this is its guard.
 * Not seen: a fetch made inside an imported lib. Reads files only.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const list = args.includes("--list");
const root = resolve(args.find((a) => !a.startsWith("--")) ?? process.cwd());
const rel = (p) => relative(root, p).split(sep).join("/");

// Owned by another stream; reported rather than touched (brief, 2026-11-19).
const EXEMPT = new Map([["scripts/dev-signin.mjs", "owned by the product-admin stream (#1736); for the planner to convert"]]);

const walk = (dir, out = []) => {
  let names;
  try { names = readdirSync(dir); } catch { return out; }
  for (const n of names) {
    if (n === "node_modules" || n === ".next" || n === ".open-next") continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith(".mjs")) out.push(p);
  }
  return out;
};

const code = (src) => src.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
let bad = 0, ok = 0, debt = 0, helper = 0, exempt = 0;
for (const file of walk(join(root, "scripts")).sort()) {
  const src = readFileSync(file, "utf8");
  const c = code(src);
  if (!/\bfetch\(/.test(c) || !/\bprocess\.exit\(/.test(c)) continue;
  const r = rel(file);
  const marker = src.match(/^\/\/ exit-(ok|debt): (\S.*)$/m);
  if (/lib\/exit\.mjs/.test(c)) { helper++; if (list) console.log(`helper ${r}`); }
  else if (EXEMPT.has(r)) { exempt++; console.log(`exempt ${r}: ${EXEMPT.get(r)}`); }
  else if (marker?.[1] === "ok") { ok++; if (list) console.log(`ok     ${r}: ${marker[2]}`); }
  else if (marker?.[1] === "debt") { debt++; console.log(`debt   ${r}: ${marker[2]}`); }
  else {
    bad++;
    console.log(`FAIL   ${r}: calls fetch( and process.exit( with no lib/exit.mjs import and no exit-ok / exit-debt marker`);
  }
}
console.log(`\n${helper} use exitWith, ${ok} verified exit-ok, ${debt} known exit-debt, ${exempt} exempt, ${bad} unmarked.`);
if (bad) console.log("Use `await exitWith(code)` (scripts/lib/exit.mjs), or add the marker with a reason you have checked.");
process.exitCode = bad ? 1 : 0;
