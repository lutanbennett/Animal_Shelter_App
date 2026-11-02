#!/usr/bin/env node
/**
 * Re-takes the measurement behind the backlog item "English the Thai-dictionary
 * check CANNOT see" and sorts it with scripts/lib/english-in-ts-classes.mjs.
 * Report only, always exits 0; it is NOT the extension of check-thai-dictionary
 * (its own item). Method, so it can be repeated: every string and template
 * literal in src/ .ts files (not .d.ts, not the dictionaries), comments
 * skipped, template substitutions blanked; kept when the whole string is words
 * and ordinary punctuation, three or more words, one of four letters or more.
 *
 *   node scripts/measure-english-in-ts.mjs          counts per class
 *   node scripts/measure-english-in-ts.mjs --list   every string with its class
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classify, CLASSES } from "./lib/english-in-ts-classes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function literals(s) {
  const out = [];
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    const d = s[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && s[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && d === "*") {
      i = s.indexOf("*/", i + 2);
      if (i < 0) break;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let b = "";
      while (j < n && s[j] !== c && s[j] !== "\n") {
        if (s[j] === "\\") {
          b += s[j + 1];
          j += 2;
        } else b += s[j++];
      }
      out.push({ t: b, line: s.slice(0, i).split("\n").length });
      i = j + 1;
      continue;
    }
    if (c === "`") {
      let j = i + 1;
      let b = "";
      while (j < n) {
        if (s[j] === "\\") {
          b += s[j + 1];
          j += 2;
          continue;
        }
        if (s[j] === "$" && s[j + 1] === "{") {
          b += " ";
          let k = 1;
          j += 2;
          while (j < n && k) {
            if (s[j] === "{") k++;
            else if (s[j] === "}") k--;
            j++;
          }
          continue;
        }
        if (s[j] === "`") break;
        b += s[j++];
      }
      out.push({ t: b, line: s.slice(0, i).split("\n").length });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

const words = (t) => t.match(/[A-Za-z][A-Za-z'’]*/g) ?? [];
const SHAPE = /^[A-Z(“"']?[A-Za-z][A-Za-z'’]*(?:[\s,:;.!?()\-–—/&%$'"“”0-9]+[A-Za-z0-9][A-Za-z0-9'’]*){2,}[\s.!?]*$/;
const prose = (t) => /\s/.test(t) && SHAPE.test(t) && !/https?:|=>|[{};=<>]/.test(t) && words(t).length >= 3 && words(t).some((w) => w.length >= 4);

const rows = [];
for (const file of walk(path.join(root, "src"))) {
  if (!file.endsWith(".ts") || file.endsWith(".d.ts")) continue;
  const rel = path.relative(root, file).replaceAll("\\", "/");
  if (rel.startsWith("src/lib/i18n/dictionaries/")) continue;
  for (const l of literals(readFileSync(file, "utf8"))) {
    const t = l.t.replace(/\s+/g, " ").trim();
    if (prose(t)) rows.push({ rel, line: l.line, t });
  }
}

const manual = rows.filter((r) => r.rel === "src/lib/manual/en.ts").length;
const releases = rows.filter((r) => r.rel === "src/lib/releases.ts").length;
const rest = rows.filter((r) => r.rel !== "src/lib/manual/en.ts" && r.rel !== "src/lib/releases.ts");

const tally = new Map();
const unclassified = [];
for (const r of rest) {
  const c = classify(r.rel, r.t);
  if (!c) {
    unclassified.push(r);
    continue;
  }
  tally.set(c.id, (tally.get(c.id) ?? 0) + 1);
  if (process.argv.includes("--list")) {
    console.log(`${c.reads.padEnd(8)} ${c.id.padEnd(30)} ${r.rel}:${r.line} ${JSON.stringify(r.t.slice(0, 80))}`);
  }
}

console.log(`prose strings in .ts: ${rows.length} (manual/en.ts ${manual}, releases.ts ${releases}, elsewhere ${rest.length})`);
const byReads = {};
for (const c of CLASSES) {
  const n = tally.get(c.id) ?? 0;
  byReads[c.reads] = (byReads[c.reads] ?? 0) + n;
  console.log(`  ${String(n).padStart(4)}  ${c.reads.padEnd(8)} ${c.id}`);
}
console.log(`  ${String(unclassified.length).padStart(4)}  UNCLASSIFIED`);
for (const r of unclassified) console.log(`        ${r.rel}:${r.line} ${JSON.stringify(r.t.slice(0, 80))}`);
console.log(`by reader: ${Object.entries(byReads).map(([k, v]) => `${k} ${v}`).join(", ")}`);
