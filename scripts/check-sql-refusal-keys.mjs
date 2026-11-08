#!/usr/bin/env node
// Fails when a database refusal a person can read is written as an English sentence instead of a key, in any function
// defined from KEYED_FROM on, and when a key a live function raises has no wording in en.ts or th.ts. #3nuwy;
// docs/decisions/2026-11-08-db-refusal-keys-mechanism.md.
//
// Reads supabase/migrations/*.sql through scripts/lib/sql-refusals.mjs and classifies with
// scripts/lib/sql-refusal-classes.mjs -- the same parser and caller search as scripts/measure-sql-refusals.mjs, so the
// gate and the count can never disagree about what a function raises. No database, no network, no node_modules.
//
// WHAT IT ASSERTS (each failure names the function and the file):
//   1. A live function whose LIVE definition is in migration KEYED_FROM (0339) or later, and which a person can read
//      (class `user`, or `called-forwarded-and-masked`: some src caller forwards the message), raises only keys:
//      every `raise exception` message matches REFUSAL_KEY, and none is in a shape the parser cannot read.
//   2. Every key any live function raises has an entry in the `refusals` block of BOTH en.ts and th.ts. (A missing one
//      would still be safe -- src/lib/db-refusal.ts widens it to "something went wrong" -- but it would be a sentence
//      nobody planned, so it is a build failure rather than a surprise.)
//
// WHAT IT DELIBERATELY IGNORES, and why:
//   - Every function whose live definition is OLDER than 0339 (today about 150 messages in the user and maybe classes).
//     Converting those is the programme's later streams; a stored list or count of them would be a ratchet to maintain.
//     Instead the rule bites when a function is next redefined: any migration that rewrites one of them must convert its
//     refusals in the same file. That is the moment it is cheapest.
//   - Triggers, functions only other SQL calls, functions whose callers only mask the message (databaseFailure), and
//     functions nothing calls. Their English reaches the log, not a person (the 2026-11-03 decision: diagnostics).
//   - Raises inside `do $$` blocks (harnesses and one-offs, never live).
//   - Whether a key's detail parameters match what its wording reads. A missing parameter would show as "undefined" in
//     the sentence; each group's unit test of its wording (src/lib/db-refusal.test.mjs) is where that is caught.
// Limits it inherits from the parser: dynamic SQL, `alter function ... rename`, and the live database are invisible.
//
//   node scripts/check-sql-refusal-keys.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { classifyLiveRefusals } from "./lib/sql-refusal-classes.mjs";

export const KEYED_FROM = 339;
// The same pattern as REFUSAL_KEY in src/lib/db-refusal.ts; scripts/check-sql-refusal-keys.test.mjs asserts they agree.
export const REFUSAL_KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

/** The keys in a dictionary's `refusals` block, read from its source text. */
export function refusalKeys(source) {
  const text = source.replace(/\r\n/g, "\n");
  const start = text.indexOf("\n  refusals: {");
  if (start < 0) return new Set();
  const end = text.indexOf("\n  },", start);
  return new Set([...text.slice(start, end).matchAll(/^\s*"([^"]+)"\s*:/gm)].map((m) => m[1]));
}

const fileNumber = (file) => Number(/^(\d{4})_/.exec(file)?.[1] ?? 0);
const personReads = (cls) => cls.reads === "user" || cls.id === "called-forwarded-and-masked";

/** rows: classifyLiveRefusals().rows. Returns a list of problem sentences; empty means clean. */
export function findProblems(rows, enKeys, thKeys, from = KEYED_FROM) {
  const problems = [];
  for (const r of rows) {
    if (fileNumber(r.f.file) < from || !personReads(r.cls)) continue;
    const english = r.m.messages.filter((x) => !REFUSAL_KEY.test(x.text));
    for (const x of english) {
      problems.push(`${r.f.name} (${r.f.file}) raises a sentence, not a key: '${x.text}'. A person reads this function's refusals (callers: ${r.srcCallers.map((c) => c.rel).join("; ")}). Raise a key and put the words in refusals in en.ts and th.ts; parameters go in detail as JSON.`);
    }
    if (r.m.unparsed) problems.push(`${r.f.name} (${r.f.file}) has ${r.m.unparsed} raise exception the parser cannot read (a variable message?). Raise a literal key.`);
  }
  for (const r of rows) {
    for (const x of r.m.messages.filter((m) => REFUSAL_KEY.test(m.text))) {
      for (const [lang, keys] of [["en.ts", enKeys], ["th.ts", thKeys]]) {
        if (!keys.has(x.text)) problems.push(`${r.f.name} (${r.f.file}) raises '${x.text}', which has no entry in refusals in ${lang}.`);
      }
    }
  }
  return [...new Set(problems)];
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const { rows } = classifyLiveRefusals(root);
  const read = (lang) => refusalKeys(readFileSync(path.join(root, `src/lib/i18n/dictionaries/${lang}.ts`), "utf8"));
  const enKeys = read("en");
  const thKeys = read("th");
  const problems = findProblems(rows, enKeys, thKeys);
  const keyed = rows.filter((r) => r.m.messages.some((x) => REFUSAL_KEY.test(x.text)));
  const raised = new Set(keyed.flatMap((r) => r.m.messages.map((x) => x.text).filter((t) => REFUSAL_KEY.test(t))));
  const unused = [...enKeys].filter((k) => !raised.has(k));
  if (problems.length) {
    console.log(`sql refusal keys: NOT CLEAN, ${problems.length} problem(s)`);
    for (const p of problems) console.log(`  - ${p}`);
    console.log("docs/decisions/2026-11-08-db-refusal-keys-mechanism.md says how to raise a key.");
    process.exitCode = 1;
    return;
  }
  console.log(`sql refusal keys: ok. ${keyed.length} live function(s) raise ${raised.size} key(s), each worded in en.ts and th.ts; every person-read function defined from ${String(KEYED_FROM).padStart(4, "0")} raises keys only.`);
  if (unused.length) console.log(`  (report only) wording no live function raises: ${unused.join(", ")}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
