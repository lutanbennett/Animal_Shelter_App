// Fails when `await confirm(` sits inside a `startTransition(` callback in src/.
// The confirm dialog's state update joins the transition, the transition waits for
// the click, the dialog never commits: the whole app (nav included) freezes.
// House pattern: `if (!(await confirm({...}))) return;` then `startTransition(...)`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(n)) out.push(p);
  }
  return out;
}

// Blank out comments and string/template contents so braces and words inside them are ignored.
function strip(src) {
  let o = "", i = 0;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { while (i < src.length && src[i] !== "\n") { o += " "; i++; } }
    else if (c === "/" && d === "*") { while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) { o += src[i] === "\n" ? "\n" : " "; i++; } o += "  "; i += 2; }
    else if (c === '"' || c === "'" || c === "`") {
      o += c; i++;
      while (i < src.length && src[i] !== c) { if (src[i] === "\\") { o += "  "; i += 2; continue; } o += src[i] === "\n" ? "\n" : " "; i++; }
      o += c; i++;
    } else { o += c; i++; }
  }
  return o;
}

const bad = [];
for (const file of walk("src")) {
  const raw = readFileSync(file, "utf8");
  if (!raw.includes("startTransition")) continue;
  const s = strip(raw);
  const re = /startTransition\s*\(/g;
  let m;
  while ((m = re.exec(s))) {
    let depth = 1, i = re.lastIndex;
    for (; i < s.length && depth > 0; i++) { if (s[i] === "(") depth++; else if (s[i] === ")") depth--; }
    const body = s.slice(re.lastIndex, i);
    const hit = /await\s+(?:\w+\.)?confirm\s*\(/.exec(body);
    if (hit) bad.push(`${file}:${s.slice(0, re.lastIndex + hit.index).split("\n").length}`);
  }
}
if (bad.length) {
  console.error("await confirm( inside startTransition( freezes the app. Ask first, then start the transition:");
  for (const b of bad) console.error("  " + b);
  process.exit(1);
}
console.log("ok: no await confirm( inside startTransition(");
