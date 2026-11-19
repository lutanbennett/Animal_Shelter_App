#!/usr/bin/env node
/**
 * A script that imports a TypeScript module must reach only modules whose own
 * relative imports carry a file extension.
 *
 *   node scripts/check-script-ts-imports.mjs            check the repository
 *   node scripts/check-script-ts-imports.mjs --list     also print one line per script
 *   node scripts/check-script-ts-imports.mjs <root>     check another tree (used by the fixture proof)
 *
 * Raw Node's ESM resolver does not add extensions the way tsc and Next do, so
 * `import "./x"` inside a .ts file reached from a script dies at start with
 * ERR_MODULE_NOT_FOUND, before the script does anything
 * (docs/decisions/2026-11-19-script-ts-import-resolution.md). Starting from
 * every .mjs under scripts/ that imports a .ts file, this follows the relative
 * imports of each .ts file reached and fails on any without an extension.
 * Type-only imports are erased, so they are skipped. Exempt, because extensionless
 * imports resolve there: a *.test.mjs (npm test loads scripts/test-support/
 * register.mjs with --import) and a script that itself registers
 * test-support/resolve-hooks.mjs. Reads files only.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const list = args.includes("--list");
const root = resolve(args.find((a) => !a.startsWith("--")) ?? process.cwd());
const rel = (p) => relative(root, p).split(sep).join("/");

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

// Relative specifiers a module imports or re-exports at run time.
const RELATIVE = /(?:^|[\s;])(?:import|export)\s+(?!type\b)(?:[^"';]*?\sfrom\s*)?["'](\.{1,2}\/[^"']*)["']|import\s*\(\s*["'](\.{1,2}\/[^"']*)["']\s*\)/gm;
const specifiers = (src) => [...src.matchAll(RELATIVE)].map((m) => m[1] ?? m[2]);
const hasExtension = (s) => /\.[a-z]+$/i.test(s.split("/").pop());

// Everything reached from a .ts file, as { file, specifier } faults.
function faultsFrom(tsFile, seen = new Set()) {
  if (seen.has(tsFile)) return [];
  seen.add(tsFile);
  let src;
  try { src = readFileSync(tsFile, "utf8"); } catch { return [{ file: tsFile, specifier: "(unreadable)" }]; }
  const out = [];
  for (const s of specifiers(src)) {
    if (!hasExtension(s)) { out.push({ file: tsFile, specifier: s }); continue; }
    const next = resolve(dirname(tsFile), s);
    if (next.endsWith(".ts") && existsSync(next)) out.push(...faultsFrom(next, seen));
  }
  return out;
}

const scriptsDir = join(root, "scripts");
const TS_IMPORT = /from\s*["']([^"']+\.ts)["']|import\s*\(\s*["']([^"']+\.ts)["']\s*\)/g;
let bad = 0;
let scripts = 0;
for (const file of walk(scriptsDir).sort()) {
  const src = readFileSync(file, "utf8");
  const hooked = file.endsWith(".test.mjs") || src.includes("resolve-hooks.mjs");
  const targets = [...src.matchAll(TS_IMPORT)].map((m) => m[1] ?? m[2]).filter((t) => t.startsWith("."));
  if (!targets.length) continue;
  scripts++;
  const seen = new Set();
  const faults = hooked ? [] : targets.flatMap((t) => faultsFrom(resolve(dirname(file), t), seen));
  if (faults.length) {
    bad++;
    console.log(`FAIL ${rel(file)}`);
    for (const f of faults) console.log(`       ${rel(f.file)} imports "${f.specifier}" with no extension`);
  } else if (list) {
    console.log(`ok   ${rel(file)} -> ${targets.map((t) => rel(resolve(dirname(file), t))).join(", ")} ${hooked ? "(resolver hook loaded)" : `(${seen.size} .ts reached)`}`);
  }
}
console.log(bad
  ? `\n${bad} of ${scripts} scripts that import TypeScript reach a module with an extensionless import. Add the extension, or import a leaf file.`
  : `\nAll ${scripts} scripts that import TypeScript reach only modules whose imports carry extensions.`);
process.exitCode = bad ? 1 : 0;
