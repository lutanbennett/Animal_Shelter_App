#!/usr/bin/env node
/**
 * NO file may import a model vendor's SDK. There is no allow-list.
 *
 *   node scripts/check-llm-vendor-imports.mjs
 *
 * The assistant's model runs on the shelter's own machine, so no vendor
 * package has any business in this repository
 * (docs/decisions/2026-11-01-drop-anthropic-sdk.md). This check used to allow
 * one file, src/lib/assistant/llm-claude.ts, which is why it could not catch
 * the Anthropic SDK reaching production in 0.41.0; that file is gone and the
 * exception with it. The one implementation, src/lib/assistant/llm-openai.ts,
 * speaks the OpenAI-compatible wire shape over plain fetch and imports
 * nothing. Scans src/, worker/ and scripts/ for an import, require or dynamic
 * import of a known vendor package. Reads files only, no network, so a bare
 * process.exit is safe.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const VENDORS = ["@anthropic-ai/", "openai", "@google/generative-ai", "@google/genai", "@mistralai/", "cohere-ai", "ollama", "groq-sdk"];
const ROOTS = ["src", "worker", "scripts"];
const SELF = "scripts/check-llm-vendor-imports.mjs";

const root = process.cwd();
const rel = (p) => relative(root, p).split(sep).join("/");
const walk = (dir, out = []) => {
  let names;
  try { names = readdirSync(dir); } catch { return out; }
  for (const n of names) {
    if (n === "node_modules" || n === ".next" || n === ".open-next") continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(n)) out.push(p);
  }
  return out;
};

const spec = VENDORS.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const IMPORT = new RegExp(`(?:from\\s*|import\\s*\\(?\\s*|require\\s*\\(\\s*)["'](?:${spec})(?:/[^"']*)?["']`);

const problems = [];
let scanned = 0;
for (const r of ROOTS) {
  for (const f of walk(join(root, r))) {
    const name = rel(f);
    if (name === SELF) continue;
    scanned++;
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (IMPORT.test(line)) problems.push(`${name}:${i + 1} imports a vendor SDK: ${line.trim()}`);
    });
  }
}

if (problems.length) {
  console.log("FAIL: a model vendor's SDK is imported. No file may import one -- the model runs on the shelter's own machine.");
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log(`ok: no model vendor's SDK is imported anywhere (${scanned} files scanned)`);
process.exit(0);
