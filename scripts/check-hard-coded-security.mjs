// Hard-coded security is forbidden (Lutan, 2026-10-24): a role is exactly the set of cards it holds, and nothing keyed by role may
// change what a card does or whether it shows. This is the ratchet on the KNOWN debt in docs/hard-coded-security-registry.json.
//
//   node scripts/check-hard-coded-security.mjs
//
// It FAILS (exit 1) when a listed mechanism's reference count has risen above its baseline, or when a mechanism has moved from
// the file the registry names. A fall is good: it prints the new baseline to write down and exits 0. It never fails for a reduction.
//
// WHAT IT CANNOT DO: it counts references to mechanisms somebody has already named. It cannot detect a brand-new KIND of
// hard-coded rule that nobody has put in the registry. A green run means "the known set did not grow", not "there is none".
// Counts are lines in src/**/*.ts(x) matching each entry's pattern (docs/decisions/2026-10-24-hard-coded-security-ratchet.md).
// It counts CODE that names a mechanism: comments are blanked first, and the registry's "diagnostics" (functions that evaluate a
// rule only to REPORT which one refused, each with its reason written down) are blanked too. Both exist so that explaining hidden
// security is never what turns this red (docs/decisions/2026-10-24-ratchet-counts-rules-not-mentions.md).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const registry = JSON.parse(readFileSync(join(root, "docs/hard-coded-security-registry.json"), "utf8"));

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(name)) files.push(p);
  }
})(join(root, "src"));

// Blank comments, keeping every newline so line counts stay honest. Strings and template literals are skipped over so a "//" inside
// one is not mistaken for a comment.
const NL = String.fromCharCode(10);
const keepNewlines = (s) => s.split(NL).map(() => "").join(NL);
function stripComments(src) {
  let out = "";
  for (let i = 0; i < src.length; ) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { while (i < src.length && src[i] !== NL) i++; }
    else if (c === "/" && d === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? src.length : end + 2;
      out += keepNewlines(src.slice(i, stop));
      i = stop;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && !(c !== "`" && src[j] === NL)) j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
    } else { out += c; i++; }
  }
  return out;
}

// Blank a registry-listed diagnostic: from its `function <name>` to the first closing brace in column 0 (the repo formats every
// top-level function that way). Null when the function is not there.
function blankFunction(src, name) {
  const at = src.search(new RegExp("function[ ]+" + name + "[(<]"));
  if (at < 0) return null;
  const close = src.indexOf(NL + "}", at);
  const end = close < 0 ? src.length : close + 2;
  return src.slice(0, at) + keepNewlines(src.slice(at, end)) + src.slice(end);
}

const text = new Map(files.map((f) => [f, stripComments(readFileSync(f, "utf8"))]));
for (const d of registry.diagnostics ?? []) {
  const f = join(root, d.file);
  const blanked = text.has(f) ? blankFunction(text.get(f), d.function) : null;
  if (blanked === null) { console.log(`FAIL diagnostic ${d.id}: ${d.function} not found in ${d.file}. It moved or was renamed; its exemption must follow it, or go.`); process.exitCode = 1; continue; }
  text.set(f, blanked);
}

let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };

for (const m of registry.mechanisms) {
  const re = new RegExp(m.pattern);
  const scope = m.files ? m.files.map((f) => join(root, f)) : files;
  let count = 0;
  for (const f of scope) for (const line of (text.get(f) ?? "").split("\n")) if (re.test(line)) count++;
  const anchored = existsSync(join(root, m.anchorFile)) && readFileSync(join(root, m.anchorFile), "utf8").includes(m.anchor);

  if (count > m.baseline) fail(`${m.id}: ${count} references, baseline ${m.baseline}. Hard-coded security may only go down; make it a card instead (CLAUDE.md, "Hard-coded security is forbidden").`);
  else if (!anchored && count > 0) fail(`${m.id}: no longer at ${m.anchorFile} ("${m.anchor}") but still referenced ${count} times. It moved; the registry must say where.`);
  else if (!anchored) console.log(`gone ${m.id}: removed. Delete its entry from the registry.`);
  else if (count < m.baseline) console.log(`down ${m.id}: ${count}, baseline ${m.baseline}. Lower "baseline" to ${count} in docs/hard-coded-security-registry.json.`);
  else console.log(`ok   ${m.id}: ${count}`);
}
if (failed) console.log(`\n${failed} failed. See CLAUDE.md: record it in docs/card-access-faults.md, do not patch around it and do not add another.`);
process.exit(failed || process.exitCode ? 1 : 0);
