#!/usr/bin/env node
// Every table, view and sequence a migration creates must be granted in the
// same file (docs/decisions.md, 2026-09-24, "Data API grants").
//
// From 2026-10-30 Supabase no longer gives new objects in `public` automatic
// grants to anon / authenticated / service_role. A migration that creates a
// table and grants nothing still applies cleanly, and the table is then
// "permission denied" to supabase-js whatever its RLS policies say. Nothing
// fails until someone opens the page. This check makes it fail at lint time.
//
// For each migration numbered above 0077 (0077 wrote down the grants for
// everything before it), it finds
//
//   create [unlogged] table [if not exists] <name>
//   create [or replace] [materialized] view <name>
//   create sequence [if not exists] <name>
//   <col> serial / bigserial / smallserial   → the implicit <table>_<col>_seq
//
// and requires a `grant … on [table|sequence] …<name>… to …` naming at least
// one of anon, authenticated, service_role. Which roles is the author's call:
// authenticated + service_role by default, anon only for deliberately public
// objects. Identity columns need no sequence grant (Postgres does not check
// privileges on an identity column's sequence). Temporary tables and objects
// in schemas other than public are skipped. Comments and dollar-quoted bodies
// are ignored, so a `create table` inside a function or DO block is neither
// counted nor able to satisfy the check; write the grants at top level.
//
//   node scripts/check-migration-grants.mjs            # every file above 0077
//   node scripts/check-migration-grants.mjs <file>…    # just these, any number
//
// Runs as part of `npm run lint`, so scripts/gates.mjs and CI both run it.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(here, "..", "supabase", "migrations");
// Everything up to and including this number predates the rule; 0077 is the
// catch-up that grants all of it.
const LAST_EXEMPT = 77;
const API_ROLES = ["anon", "authenticated", "service_role"];
// 0086 moved these into `private` and left a gated view of the same name in
// `public`. A later `create or replace view <name>` in `public` would replace
// the gate, so a file after 0086 edits `private.<name>` and may re-create the
// public one only as the gate again (it must, to pick up a new column:
// `select *` is expanded when the view is created).
const GATED_SINCE = 86;
const GATED_VIEWS = [
  "app_users",
  "current_placement",
  "resident_current_state",
  "immunization_compliance",
  "immunization_duplicate_check",
  "translation_queue",
];

/** Blank out comments and dollar-quoted strings, keeping the rest as is. */
function stripSql(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\$([A-Za-z_]\w*)?\$[\s\S]*?\$\1\$/g, " ");
}

/** `public.foo` / `"foo"` → `foo`; null for another schema. */
function normalise(name) {
  const parts = name.replace(/"/g, "").toLowerCase().split(".");
  if (parts.length === 2 && parts[0] !== "public") return null;
  return parts.at(-1);
}

/** The text between the parenthesis at `open` and its partner. */
function parenBody(sql, open) {
  let depth = 0;
  for (let i = open; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    else if (sql[i] === ")" && --depth === 0) return sql.slice(open + 1, i);
  }
  return sql.slice(open + 1);
}

const NAME = String.raw`((?:"?\w+"?\.)?"?\w+"?)`;

function createdObjects(sql) {
  const found = [];
  const table = new RegExp(
    String.raw`\bcreate\s+(?:(temp|temporary)\s+|unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?${NAME}\s*\(`,
    "gi",
  );
  for (const m of sql.matchAll(table)) {
    const name = normalise(m[2]);
    if (m[1] || !name) continue;
    found.push({ kind: "table", name });
    const body = parenBody(sql, m.index + m[0].length - 1);
    for (const col of body.matchAll(/(?:^|,)\s*"?(\w+)"?\s+(?:small|big)?serial\b/gi)) {
      found.push({ kind: "sequence", name: `${name}_${col[1].toLowerCase()}_seq`, implicit: true });
    }
  }
  const view = new RegExp(
    String.raw`\bcreate\s+(?:or\s+replace\s+)?(temp\s+|temporary\s+)?(?:recursive\s+)?(materialized\s+)?view\s+(?:if\s+not\s+exists\s+)?${NAME}`,
    "gi",
  );
  for (const m of sql.matchAll(view)) {
    const name = normalise(m[3]);
    if (m[1] || !name) continue;
    found.push({ kind: m[2] ? "materialized view" : "view", name });
  }
  const sequence = new RegExp(
    String.raw`\bcreate\s+(temp\s+|temporary\s+)?sequence\s+(?:if\s+not\s+exists\s+)?${NAME}`,
    "gi",
  );
  for (const m of sql.matchAll(sequence)) {
    const name = normalise(m[2]);
    if (m[1] || !name) continue;
    found.push({ kind: "sequence", name });
  }
  return found;
}

/** Each `grant … on … to …` as { onSequence, objects, roles }. */
function grants(sql) {
  const out = [];
  for (const statement of sql.split(";")) {
    const m = statement.match(/^\s*grant\s+[\s\S]*?\s+on\s+([\s\S]+?)\s+to\s+([\s\S]+)$/i);
    if (!m) continue;
    let target = m[1].trim();
    const kind = target.match(/^(table|sequence|function|procedure|routine|schema|all\s+tables|all\s+sequences)\b/i);
    const keyword = kind ? kind[1].toLowerCase().replace(/\s+/g, " ") : "table";
    if (["function", "procedure", "routine", "schema"].includes(keyword)) continue;
    if (keyword === "table" || keyword === "sequence") target = target.slice(kind ? kind[0].length : 0);
    const roles = m[2]
      .replace(/\bwith\s+grant\s+option\b/i, "")
      .split(",")
      .map((r) => r.trim().replace(/"/g, "").toLowerCase());
    out.push({
      onSequence: keyword === "sequence" || keyword === "all sequences",
      all: keyword.startsWith("all "),
      objects: keyword.startsWith("all ") ? [] : target.split(",").map((o) => normalise(o.trim())),
      roles,
    });
  }
  return out;
}

function checkFile(file) {
  const sql = stripSql(readFileSync(file, "utf8"));
  const given = grants(sql).filter((g) => g.roles.some((r) => API_ROLES.includes(r)));
  const missing = [];
  for (const obj of createdObjects(sql)) {
    const wantSequence = obj.kind === "sequence";
    const ok = given.some(
      (g) => g.onSequence === wantSequence && (g.all || g.objects.includes(obj.name)),
    );
    if (!ok) missing.push(obj);
  }
  return missing;
}

function numberOf(file) {
  const m = path.basename(file).match(/^(\d+)_/);
  return m ? Number(m[1]) : null;
}

const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql") && (numberOf(f) ?? 0) > LAST_EXEMPT)
      .sort()
      .map((f) => path.join(MIGRATIONS_DIR, f));

let failed = 0;
let ungated = 0;
for (const file of files) {
  if ((numberOf(file) ?? 0) > GATED_SINCE) {
    for (const statement of stripSql(readFileSync(file, "utf8")).split(";")) {
      const [obj] = createdObjects(statement);
      if (obj?.kind !== "view" || !GATED_VIEWS.includes(obj.name)) continue;
      const gated =
        new RegExp(String.raw`\bfrom\s+private\.${obj.name}\b`, "i").test(statement) &&
        /\bprivate\.has_app_access\(\)/i.test(statement);
      if (gated) continue;
      ungated++;
      console.error(
        `${path.basename(file)}: re-creates public.${obj.name} without the gate (0086). Change` +
          ` private.${obj.name}, then re-create the public one as \`select * from private.${obj.name}` +
          ` where private.has_app_access()\` so it picks up the new columns.`,
      );
    }
  }
  for (const obj of checkFile(file)) {
    failed++;
    const how = obj.kind === "sequence" ? "grant usage, select on sequence" : "grant select, … on";
    console.error(
      `${path.basename(file)}: ${obj.implicit ? "serial column's sequence" : obj.kind} ${obj.name} ` +
        `is created without a grant — add \`${how} ${obj.name} to authenticated, service_role;\`` +
        ` (and anon only if it is deliberately public).`,
    );
  }
}
if (ungated) {
  console.error(
    `\nmigration grants: ${ungated} gated view(s) re-created without the gate (docs/decisions.md,` +
      ` 2026-09-25, "Internal views need a staff role, not a session").`,
  );
}
if (failed) {
  console.error(
    `\nmigration grants: ${failed} object(s) without Data API grants. Supabase no longer adds them` +
      ` automatically (docs/decisions.md, 2026-09-24).`,
  );
}
if (failed || ungated) process.exit(1);
console.log(`migration grants: ok (${files.length} file(s) checked)`);
