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
// Views also need their write grants revoked (files above 0160 only). The
// project's default privileges give `authenticated` insert, update, delete,
// truncate, references and trigger on every new object, and Postgres cannot
// set default privileges for views apart from tables, which need DML. So every
// public view a migration creates or replaces must be followed, in the same
// file, by
//
//   revoke insert, update, delete, truncate, references, trigger on <view> from authenticated, anon;
//
// (`revoke all on <view> from …` naming both roles counts too, as 0161 writes
// it; the grant of select comes after). On a non-updatable view the grants do
// nothing, and a writable security_invoker one is still bounded by its table's
// policies, but an `instead of` trigger added later would make them real.
// `create or replace` keeps a view's grants, so replacing a view an earlier
// migration created needs no revoke unless this file drops it first (as for
// functions below). 0160 revoked them from the six views that had them
// (docs/decisions/2026-10-07-view-write-grants.md), so every view that existed
// then is clean, and everything up to and including 0160 is exempt from this
// one rule.
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
// Files up to and including this number are exempt from the view-revoke rule;
// 0160 revoked the write grants from every view that existed then.
const VIEW_REVOKES_SINCE = 160;
const VIEW_WRITES = ["insert", "update", "delete", "truncate", "references", "trigger"];
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
    String.raw`\bcreate\s+(or\s+replace\s+)?(temp\s+|temporary\s+)?(?:recursive\s+)?(materialized\s+)?view\s+(?:if\s+not\s+exists\s+)?${NAME}`,
    "gi",
  );
  for (const m of sql.matchAll(view)) {
    const name = normalise(m[4]);
    if (m[2] || !name) continue;
    found.push({ kind: m[3] ? "materialized view" : "view", name, replace: Boolean(m[1]) });
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

// ---------------------------------------------------------------------------
// Security checks (backlog DB-10). Each is a mistake no later migration can
// make; they apply to every file above LAST_EXEMPT, like the grant check.
//
//   RLS            every table created in `public` is followed, in the same
//                  file, by `alter table … enable row level security`
//   search_path    every `security definer` function pins `set search_path`
//   function anon  every function created in `public` (trigger functions
//                  aside: PostgREST cannot call them) is followed by a
//                  `revoke … on function … from … public … anon …`. Postgres
//                  grants EXECUTE to PUBLIC on a new function and anon is a
//                  member of PUBLIC, so naming anon alone leaves it callable.
//   anon grants    `grant … to anon` only on objects named public_* / site_*
//                  (and the functions the public site calls, below)
// ---------------------------------------------------------------------------

// Functions the public site calls as anon, granted back by 0082 and 0084; the
// same set as PUBLIC_FUNCTIONS in check-public-views.mjs, which verifies them
// against the live project.
const ANON_FUNCTIONS = new Set([
  "current_user_role",
  "is_public_drive_file",
  "shelter_date",
  "shelter_time_zone",
  "shelter_today",
  // Granted by 0082, taken back by 0089; the file that granted it is history.
  "is_known_drive_file",
]);
const ANON_OK = /^(public_|site_)/;

/** Statements of a stripped file, trimmed, with blanks dropped. */
function statements(sql) {
  return sql.split(";").map((s) => s.trim()).filter(Boolean);
}

const OBJECT_NAME = String.raw`((?:"?\w+"?\.)?"?\w+"?)`;

/** Names of functions created in `public` by every migration numbered below `n`. */
function functionsBefore(n) {
  const known = new Set();
  const fn = new RegExp(String.raw`\bcreate\s+(?:or\s+replace\s+)?function\s+${OBJECT_NAME}\s*\(`, "gi");
  for (const f of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql") && (numberOf(f) ?? 0) < n)) {
    for (const m of stripSql(readFileSync(path.join(MIGRATIONS_DIR, f), "utf8")).matchAll(fn)) {
      const name = normalise(m[1]);
      if (name) known.add(name);
    }
  }
  return known;
}

function securityFindings(sql, before) {
  const out = [];
  const stmts = statements(sql);
  const lc = stmts.map((s) => s.toLowerCase());

  // RLS
  for (const obj of createdObjects(sql)) {
    if (obj.kind !== "table") continue;
    const enabled = lc.some((s) =>
      new RegExp(String.raw`^alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(?:public\.)?"?${obj.name}"?\s+enable\s+row\s+level\s+security\b`).test(s),
    );
    if (!enabled) {
      out.push(`table ${obj.name} is created without \`alter table ${obj.name} enable row level security;\` — without it every grant reads and writes every row.`);
    }
  }

  // Functions
  const fn = new RegExp(
    String.raw`^create\s+(?:or\s+replace\s+)?function\s+${OBJECT_NAME}\s*\(([\s\S]*?)\)\s*returns\s+([\s\S]*)$`,
    "i",
  );
  for (const s of stmts) {
    const m = s.match(fn);
    if (!m) continue;
    const name = normalise(m[1]);
    if (!name) continue;
    const header = m[3];
    if (/\bsecurity\s+definer\b/i.test(header) && !/\bset\s+search_path\b/i.test(header)) {
      out.push(`security definer function ${name}() does not pin \`set search_path = public\` — a caller's search_path would resolve its unqualified names.`);
    }
    if (/^trigger\b/i.test(header.trim())) continue;
    // The ACL survives `create or replace`; only a first creation (or one after a drop) needs a revoke.
    if (
      /^create\s+or\s+replace\b/i.test(s) &&
      before.has(name) &&
      !lc.some((t) => /^drop\s+function\b/.test(t) && t.includes(name))
    ) {
      continue;
    }
    // A function the public site calls is granted back to anon on purpose.
    if (ANON_FUNCTIONS.has(name)) continue;
    const revokes = lc.filter(
      (t) =>
        /^revoke\b/.test(t) &&
        /\bon\s+(?:function|all\s+functions\s+in\s+schema)\b/.test(t) &&
        (/\ball\s+functions\s+in\s+schema\b/.test(t) || new RegExp(String.raw`\b${name}\b`).test(t)),
    );
    const revokedFrom = (role) => revokes.some((t) => new RegExp(String.raw`\bfrom\b[\s\S]*\b${role}\b`).test(t));
    const revoked = revokedFrom("public") && revokedFrom("anon");
    if (!revoked) {
      out.push(`function ${name}() is created without \`revoke all on function ${name}(…) from public, anon;\` — Postgres grants EXECUTE to PUBLIC, so anon could call it through /rest/v1/rpc/.`);
    }
  }

  // Grants to anon
  for (const s of stmts) {
    const m = s.match(/^grant\s+[\s\S]*?\s+on\s+([\s\S]+?)\s+to\s+([\s\S]+)$/i);
    if (!m) {
      const d = s.match(/^alter\s+default\s+privileges[\s\S]*?\bgrant\b[\s\S]*\bto\b([\s\S]*)$/i);
      if (d && /\banon\b/i.test(d[1])) out.push("`alter default privileges … grant … to anon` would hand anon every future object.");
      continue;
    }
    const roles = m[2].replace(/\bwith\s+grant\s+option\b/i, "").split(",").map((r) => r.trim().replace(/"/g, "").toLowerCase());
    if (!roles.includes("anon")) continue;
    const target = m[1].trim();
    const kind = target.match(/^(table|sequence|function|procedure|routine|schema|all\s+\w+\s+in\s+schema)\b/i);
    const keyword = kind ? kind[1].toLowerCase().replace(/\s+/g, " ") : "table";
    if (keyword === "schema") continue;
    if (keyword.startsWith("all ")) {
      out.push(`\`grant … ${keyword} … to anon\` reaches objects that are not public_* / site_*.`);
      continue;
    }
    const rest = kind ? target.slice(kind[0].length) : target;
    const isFn = ["function", "procedure", "routine"].includes(keyword);
    // Split on commas outside parentheses (argument lists).
    const names = rest.split(/,(?![^(]*\))/).map((o) => o.trim().replace(/\(.*$/s, "")).filter(Boolean).map(normalise);
    for (const name of names) {
      if (!name) continue;
      if (ANON_OK.test(name) || (isFn && ANON_FUNCTIONS.has(name))) continue;
      out.push(`\`grant … on ${name} to anon\` — anon may only be granted public_* / site_* objects${isFn ? " or a function on the public-site allow-list (ANON_FUNCTIONS)" : ""}.`);
    }
  }
  return out;
}

/** Names of views created in `public` by every migration numbered below `n`. */
function viewsBefore(n) {
  const known = new Set();
  for (const f of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql") && (numberOf(f) ?? 0) < n)) {
    for (const obj of createdObjects(stripSql(readFileSync(path.join(MIGRATIONS_DIR, f), "utf8")))) {
      if (obj.kind.endsWith("view")) known.add(obj.name);
    }
  }
  return known;
}

/** Views created in `public` whose write grants the file does not revoke from authenticated and anon. */
function viewWriteFindings(sql, before) {
  const stmts = statements(sql);
  const dropped = (name) =>
    stmts.some((s) => /^drop\s+(?:materialized\s+)?view\b/i.test(s) && new RegExp(String.raw`\b${name}\b`, "i").test(s));
  const revokes = [];
  for (const s of stmts) {
    const m = s
      .toLowerCase()
      .match(/^revoke\s+([\s\S]+?)\s+on\s+(?:table\s+)?([\s\S]+?)\s+from\s+([\s\S]+?)(?:\s+(?:cascade|restrict))?$/);
    if (!m) continue;
    revokes.push({
      privs: m[1].split(",").map((p) => p.trim()),
      objects: m[2].split(",").map((o) => normalise(o.trim())),
      roles: m[3].split(",").map((r) => r.trim().replace(/"/g, "")),
    });
  }
  const out = [];
  for (const obj of createdObjects(sql)) {
    if (obj.kind !== "view" && obj.kind !== "materialized view") continue;
    // A replaced view keeps its grants; only a first creation (or one after a drop) gets the defaults.
    if (obj.replace && before.has(obj.name) && !dropped(obj.name)) continue;
    const revoked = (role) =>
      new Set(
        revokes
          .filter((r) => r.objects.includes(obj.name) && r.roles.includes(role))
          .flatMap((r) => (r.privs.some((p) => /^all(\s+privileges)?$/.test(p)) ? VIEW_WRITES : r.privs)),
      );
    const short = ["authenticated", "anon"].filter((role) => VIEW_WRITES.some((p) => !revoked(role).has(p)));
    if (short.length) {
      out.push(
        `${obj.kind} ${obj.name} is created without \`revoke insert, update, delete, truncate, references, trigger` +
          ` on ${obj.name} from authenticated, anon;\` (short for ${short.join(", ")}) — the default privileges` +
          ` give every signed-in login those on a new view (0160).`,
      );
    }
  }
  return out;
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
let secure = 0;
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
  const stripped = stripSql(readFileSync(file, "utf8"));
  const findings = securityFindings(stripped, functionsBefore(numberOf(file) ?? 0));
  if ((numberOf(file) ?? 0) > VIEW_REVOKES_SINCE) findings.push(...viewWriteFindings(stripped, viewsBefore(numberOf(file) ?? 0)));
  for (const finding of findings) {
    secure++;
    console.error(`${path.basename(file)}: ${finding}`);
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
if (secure) {
  console.error(`\nmigration grants: ${secure} security finding(s) (backlog DB-10; see the header).`);
}
if (failed || ungated || secure) process.exit(1);
console.log(`migration grants: ok (${files.length} file(s) checked)`);
