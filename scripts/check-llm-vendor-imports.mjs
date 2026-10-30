#!/usr/bin/env node
/**
 * Nothing outside the LLM adapter may import a vendor SDK.
 *
 *   node scripts/check-llm-vendor-imports.mjs
 *
 * The provider-neutral interface (src/lib/assistant/llm.ts) is only neutral
 * while the one file that knows a vendor is the only file that does. Scans
 * src/, worker/ and scripts/ for an import, require or dynamic import of a
 * known vendor package; the allowed files are listed below. Reads files
 * only, no network, so a bare process.exit is safe.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const VENDORS = ["@anthropic-ai/", "openai", "@google/generative-ai", "@google/genai", "@mistralai/", "cohere-ai", "ollama", "groq-sdk"];
const ALLOWED = new Set(["src/lib/assistant/llm-claude.ts"]);
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
      if (IMPORT.test(line) && !ALLOWED.has(name)) problems.push(`${name}:${i + 1} imports a vendor SDK: ${line.trim()}`);
    });
  }
}

if (problems.length) {
  console.log("FAIL: a vendor SDK is imported outside the adapter (allowed: " + [...ALLOWED].join(", ") + ")");
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log(`ok: no vendor SDK imported outside the adapter (${scanned} files scanned)`);
process.exit(0);
