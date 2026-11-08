// Fails when src/lib/audit/recent-changes.ts and the migrations disagree about which tables are audited.
//
// Reads supabase/migrations/*.sql (scripts/lib/audit-triggers.mjs replays them in order) and the source of
// recent-changes.ts and both dictionaries. No database, no network, no browser: it runs in about a second, and
// needs no `exitWith` workaround because nothing here opens a socket (a bare process.exit after a fetch is what
// dies in libuv on Windows; see scripts/lib/exit.mjs). Run it with: node scripts/check-audited-tables.mjs
//
// Four ways to fail, each naming the tables rather than counting them:
//   1. a table with an audit trigger that AUDITED_TABLES neither lists nor AUDIT_TABLES_NOT_LISTED excuses
//      (its rows would show unlabelled);
//   2. a listed table no migration leaves an audit trigger on (it can never log a row, or was dropped);
//   3. a listed table with no NAME_FROM_IMAGE entry;
//   4. a listed table with no label in en.ts or th.ts (recentChanges.tables); a missing one renders blank.
// docs/decisions/2026-11-08-audited-tables-drift.md

import { readFileSync } from "node:fs";
import { auditTriggerTables } from "./lib/audit-triggers.mjs";

const src = readFileSync("src/lib/audit/recent-changes.ts", "utf8");

function block(text, open) {
  const i = text.indexOf(open);
  if (i < 0) return null;
  const j = text.indexOf("\n}", i);
  return text.slice(i, j);
}
const listBlock = src.slice(src.indexOf("export const AUDITED_TABLES = ["), src.indexOf("] as const;"));
const listed = [...listBlock.replace(/\/\/[^\n]*/g, "").matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
const nl = src.indexOf("{", src.indexOf("export const AUDIT_TABLES_NOT_LISTED"));
const notListed = [...src.slice(nl + 1, src.indexOf("}", nl)).replace(/\/\/[^\n]*/g, "").matchAll(/([a-z_]+)\s*:/g)].map((m) => m[1]);
const nameBlock = block(src, "const NAME_FROM_IMAGE") ?? "";
const named = new Set([...nameBlock.matchAll(/^\s*([a-z_]+):\s*\{/gm)].map((m) => m[1]));
const legacy = Object.fromEntries([...(src.match(/LEGACY_TABLE_NAMES[^=]*=\s*\{([^}]*)\}/)?.[1] ?? "").matchAll(/(\w+):\s*"(\w+)"/g)].map((m) => [m[1], m[2]]));

const triggered = new Map();
for (const [t, v] of auditTriggerTables()) triggered.set(legacy[t] ?? t, v); // 0172 renamed a table inside a DO block

const problems = [];
const missing = [...triggered.keys()].filter((t) => !listed.includes(t) && !notListed.includes(t)).sort();
if (missing.length) problems.push(`Audited but not listed (rows show unlabelled). Add each to AUDITED_TABLES with a NAME_FROM_IMAGE entry and a label in en.ts and th.ts, or to AUDIT_TABLES_NOT_LISTED with a reason:\n    ${missing.map((t) => `${t} (${triggered.get(t).file})`).join("\n    ")}`);
const stale = listed.filter((t) => !triggered.has(t)).sort();
if (stale.length) problems.push(`Listed but no migration leaves an audit trigger on it (dropped, or never audited). Remove from AUDITED_TABLES:\n    ${stale.join("\n    ")}`);
const both = notListed.filter((t) => listed.includes(t));
if (both.length) problems.push(`In both AUDITED_TABLES and AUDIT_TABLES_NOT_LISTED: ${both.join(", ")}`);
const unlistedStale = notListed.filter((t) => !triggered.has(t));
if (unlistedStale.length) problems.push(`In AUDIT_TABLES_NOT_LISTED but no longer audited (delete the entry): ${unlistedStale.join(", ")}`);
const noName = listed.filter((t) => !named.has(t));
if (noName.length) problems.push(`Listed with no NAME_FROM_IMAGE entry (use cols: [] for "no name of its own"): ${noName.join(", ")}`);
for (const lang of ["en", "th"]) {
  const dict = readFileSync(`src/lib/i18n/dictionaries/${lang}.ts`, "utf8");
  const i = dict.indexOf("recentChanges: {");
  const t0 = dict.indexOf("tables: {", i);
  const labels = new Set([...dict.slice(t0, dict.indexOf("},", t0)).matchAll(/^\s*([a-z_]+):\s*"/gm)].map((m) => m[1]));
  const none = listed.filter((t) => !labels.has(t));
  if (none.length) problems.push(`No label in ${lang}.ts recentChanges.tables (the row would render blank): ${none.join(", ")}`);
}

if (problems.length) {
  console.log(`NOT CLEAN: the audited-table list has drifted from the migrations.\n\n${problems.join("\n\n")}`);
  process.exitCode = 1;
} else {
  console.log(`ok: ${listed.length} audited tables, each with a name entry and a label in both dictionaries; ${triggered.size} tables carry an audit trigger and every one is listed${notListed.length ? ` or excused (${notListed.join(", ")})` : ""}.`);
}
