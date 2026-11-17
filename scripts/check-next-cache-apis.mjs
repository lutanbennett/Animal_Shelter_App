#!/usr/bin/env node
/**
 * Two Next.js cache APIs must stay absent from src/ and worker/ (#cchgd).
 *
 * next@16.4.2 carries a moderate advisory (GHSA-mfr8-8qww-v76h): information
 * disclosure across root params when a "use cache" function is called through
 * unstable_cache(). PR #1652 chose NOT to upgrade Next because the flaw is
 * unreachable here, and that is true only while these APIs are unused. Nothing
 * else reads that condition (the advisory is moderate, so advisory-register.json
 * and audit-register.mjs never look at it). This is the instrument.
 *
 * Watches: unstable_cache, "use cache" / 'use cache' directive, cacheLife, cacheTag
 * in code under src/ and worker/.
 * Ignores, on purpose: comments (a note explaining the ban must not trip it),
 * *.test.* / *.spec.* files and __fixtures__ (never shipped, may quote the
 * strings), docs/ and decisions (not scanned at all), and this script.
 * A string literal IS scanned, because `"use cache"` is itself a string literal.
 *
 *   node scripts/check-next-cache-apis.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exitWith } from "./lib/exit.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXT = /\.(?:[cm]?[jt]sx?)$/;
const SKIP_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const PATTERNS = [
  [/\bunstable_cache\b/, "unstable_cache"],
  [/\bcacheLife\b/, "cacheLife"],
  [/\bcacheTag\b/, "cacheTag"],
  [/["'`]use cache(?::\s*\w+)?["'`]/, '"use cache" directive'],
];

function files(dir) {
  const out = [];
  let entries = [];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === "__fixtures__" || e.startsWith(".")) continue;
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) out.push(...files(full));
    else if (EXT.test(e) && !SKIP_FILE.test(e)) out.push(full);
  }
  return out;
}

/** Source with comments blanked (newlines kept, so line numbers hold). Strings are left intact. */
function blankComments(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") i++;
    } else if (c === "/" && n === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        out += src[i] === "\n" ? "\n" : " ";
        i++;
      }
      i += 2;
    } else if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") { out += src[i++]; }
        out += src[i++] ?? "";
      }
      out += q;
      i++;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

const hits = [];
for (const dir of ["src", "worker"]) {
  for (const file of files(path.join(repo, dir))) {
    const lines = blankComments(readFileSync(file, "utf8")).split("\n");
    lines.forEach((line, k) => {
      for (const [re, name] of PATTERNS) {
        if (re.test(line)) hits.push(`${path.relative(repo, file).replaceAll("\\", "/")}:${k + 1}  ${name}`);
      }
    });
  }
}

if (hits.length === 0) {
  console.log("no Next.js cache APIs (unstable_cache, \"use cache\", cacheLife, cacheTag) in src/ or worker/");
  await exitWith(0);
} else {
  console.error("A Next.js cache API has appeared:\n  " + hits.join("\n  "));
  console.error(
    "\nWhy this fails: next@16.4.2 carries advisory GHSA-mfr8-8qww-v76h (moderate): information disclosure " +
      "across root params when a \"use cache\" function is called through unstable_cache(). We did not upgrade " +
      "Next because those APIs were unused. Using one makes the advisory reachable.\n" +
      "Read docs/decisions/2026-11-17-next-agent-upgrade-halt.md, then either upgrade Next first or " +
      "re-assess and record the decision in docs/decisions/2026-11-17-next-cache-api-guard.md.",
  );
  await exitWith(1);
}
