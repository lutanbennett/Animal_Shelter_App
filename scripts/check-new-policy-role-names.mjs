// A migration added on this branch must not create a policy that names a role. The standing rule is that a
// policy asks *what may you do* (a permission cell), not *who are you*; 0157_map_rooms (#422) shipped
// `current_user_role() in ('admin', 'management')` and nothing noticed, because scripts/check-policy-role-names.mjs
// — which does notice — reads pg_policies through the Supabase Management API, so it needs an account-wide token
// and runs in neither gates.mjs nor CI (backlog, 2026-10-07; decisions/2026-10-07-policy-enum-guard.md).
//
// This is the static half: it reads only the SQL files this branch adds, so it needs no token, no network and no
// database, and does not care whether the existing policies are green.
//
//   node scripts/check-new-policy-role-names.mjs                 # HEAD against origin/main
//   node scripts/check-new-policy-role-names.mjs --base <ref>
//   node scripts/check-new-policy-role-names.mjs <file.sql> ...  # these files, as if all were new (to see it fail)
//
// "Names a role" is what check-policy-role-names.mjs counts: a bare current_user_role(), or any of 'management'
// 'staff' 'doctor' 'admin' 'volunteer' cast to app_role, inside a `create policy` / `alter policy` statement. 'vet', the
// doctor's key before 0172, is still caught, since a file written before the rename may say it.
// Functions and views that mention a role are not judged — only policies.
//
// ESCAPE HATCH. A deliberate one (none on dev since 0167 converted the doctor's (then vet's) 54, the last) is marked with
//     -- policy-role: deliberate — <why>
// as a comment inside the statement or among the comment lines directly above it. The reason is required. Marked
// statements pass but are listed, so a reviewer sees each one. A guard with no way out gets deleted.
//
// SECOND QUESTION (2026-10-08, decisions/2026-10-08-scope-functions-beside-a-cell.md): a new policy calling a scope
// function (sees_all_*(), has_shelter_floor(), each TRUE for public_viewer) must AND a has_permission() cell beside
// every call. 0150's first draft did not, and public_viewer read 76 rows of translations; check-app-access-gate
// caught it after the fact. scripts/lib/scope-guard.mjs has the walk. Its own escape hatch, so a reason given for
// one question never silently covers the other:
//     -- scope-fn: deliberate — <why>
// check-policy-role-names.mjs asks the same of every live policy on dev.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { MIGRATIONS_DIR, MIGRATION_NAME, parseLsTree } from "./lib/migrations.mjs";
import { sqlCodeOnly } from "./lib/sql-code-only.mjs";
import { unguardedScopeCalls } from "./lib/scope-guard.mjs";

const args = process.argv.slice(2);
const baseArg = args.indexOf("--base");
const base = baseArg >= 0 ? args[baseArg + 1] : "origin/main";
const files = args.filter((a, i) => a.endsWith(".sql") && !(baseArg >= 0 && i === baseArg + 1));
const unknown = args.filter((a, i) => !a.endsWith(".sql") && a !== "--base" && !(baseArg >= 0 && i === baseArg + 1));
if (unknown.length || (baseArg >= 0 && !base)) {
  console.error("usage: node scripts/check-new-policy-role-names.mjs [--base <ref>] [file.sql ...]");
  process.exit(2);
}

const TAG = "new policy role names";
const git = (a) => {
  const r = spawnSync("git", a, { encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
};
const NAMES_ROLE = /current_user_role\s*\(\s*\)|'(management|staff|doctor|vet|admin|volunteer)'\s*::\s*app_role/i;
const MARKER = /--\s*policy-role:\s*deliberate\s*[—–-]+\s*(\S.*)/i;
const SCOPE_MARKER = /--\s*scope-fn:\s*deliberate\s*[—–-]+\s*(\S.*)/i;

/** Every create/alter policy in `sql` that names a role: { head, marker (the reason, or null) }. */
export const findRolePolicies = (sql) => findPolicies(sql, (text) => NAMES_ROLE.test(text), MARKER);

/** Every create/alter policy in `sql` calling a scope function with no cell ANDed beside it: { head, marker, fns }. */
export const findLooseScopePolicies = (sql) => findPolicies(sql, (text) => unguardedScopeCalls(text), SCOPE_MARKER);

/** Every create/alter policy for which `test(text)` is truthy (an array counts only when non-empty). */
function findPolicies(sql, test, MARKER) {
  // Two same-length readings of the file: `blank` (string contents blanked) says where a statement ends, so a `;` inside a literal does
  // not split one; `code` (strings kept, comments blanked) is what the tests read, so 'admin'::app_role is still seen but a `--` inside
  // a string no longer truncates the line. Bodies of do $$ … $$ are kept: a policy created inside one must not hide.
  const blank = sqlCodeOnly(sql, { dollarBodies: "keep" });
  const code = sqlCodeOnly(sql, { dollarBodies: "keep", strings: "keep" });
  const found = [];
  let carried = []; // comment lines since the last statement ended, which belong to the next one
  let at = 0;
  const chunks = blank.split(";");
  for (const [i, c] of chunks.entries()) {
    const rawLines = sql.slice(at, at + c.length).split("\n");
    const codeLines = code.slice(at, at + c.length).split("\n");
    at += c.length + 1;
    // A marker counts only where the code reading has gone blank to the end of the line, i.e. it is a comment and not text in a string.
    const markerOf = (k) => {
      const m = rawLines[k].match(MARKER);
      return m && !codeLines[k].slice(m.index).trim() ? m[1].trim() : null;
    };
    // A comment on the same line as the closing `;` belongs to the statement that just ended.
    const trailing = i > 0 ? markerOf(0) : null;
    if (i > 0) { rawLines.shift(); codeLines.shift(); }
    if (trailing && found.length && !found.at(-1).marker) found.at(-1).marker = trailing;
    const out = [];
    let marker = null;
    for (const [k, line] of rawLines.entries()) {
      marker = markerOf(k) ?? marker;
      const stripped = codeLines[k].trimEnd();
      if (stripped.trim()) out.push(stripped);
      else if (!out.length && line.trim().startsWith("--")) carried.push(markerOf(k) ?? "");
    }
    const text = out.join("\n");
    const hit = /^\s*(create|alter)\s+policy\b/i.test(text) ? test(text) : false;
    if (Array.isArray(hit) ? hit.length : hit) {
      const above = carried.find(Boolean);
      found.push({ head: text.trim().split("\n")[0].trim(), marker: marker ?? above ?? null, fns: Array.isArray(hit) ? hit : [] });
    }
    if (text.trim()) carried = [];
  }
  return found;
}

function newFiles() {
  if (files.length) return files;
  if (!git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]).ok) {
    console.error(`${TAG}: ${base} does not exist here (git fetch origin main)`);
    process.exit(2);
  }
  const main = parseLsTree(git(["ls-tree", base, `${MIGRATIONS_DIR}/`]).out);
  const here = git(["ls-tree", "--name-only", "HEAD", `${MIGRATIONS_DIR}/`]).out.split("\n").filter(Boolean);
  return here
    .map((p) => p.slice(MIGRATIONS_DIR.length + 1))
    .filter((n) => MIGRATION_NAME.test(n) && !main.has(n))
    .map((n) => `${MIGRATIONS_DIR}/${n}`);
}

const candidates = newFiles();
const bad = [];
const deliberate = [];
const looseScope = [];
const deliberateScope = [];
for (const f of candidates) {
  const sql = readFileSync(f, "utf8");
  for (const p of findRolePolicies(sql)) (p.marker ? deliberate : bad).push({ f, ...p });
  for (const p of findLooseScopePolicies(sql)) (p.marker ? deliberateScope : looseScope).push({ f, ...p });
}
for (const d of deliberate) console.log(`${TAG}: deliberate — ${d.f}: ${d.head}\n    why: ${d.marker}`);
for (const d of deliberateScope) console.log(`${TAG}: scope function deliberate — ${d.f}: ${d.head}\n    why: ${d.marker}`);
if (!bad.length && !looseScope.length) {
  console.log(
    `${TAG}: ok — ${candidates.length} new migration file(s), none with an unmarked role-named policy` +
      ` or a scope function without a cell beside it`,
  );
  process.exit(0);
}
if (bad.length)
  console.error(
    `${TAG}: a new policy names a role (current_user_role() or '<role>'::app_role):\n` +
      bad.map((b) => `  - ${b.f}: ${b.head}`).join("\n") +
      `\n  Policies ask what you may do, not who you are. Do one of:\n` +
      `    1. Use a permission cell: role_can('<cell>') — see docs/roles-and-permissions.md.\n` +
      `    2. If a role name is genuinely intended (a recorded decision, like the doctor's), add above or inside the\n` +
      `       statement:  -- policy-role: deliberate — <why>\n` +
      `       and make sure the table is in OWNERS in scripts/check-policy-role-names.mjs and in §15 of the doc.`,
  );
if (looseScope.length)
  console.error(
    `${TAG}: a new policy calls a scope function with no has_permission() ANDed beside it:\n` +
      looseScope.map((b) => `  - ${b.f}: ${b.head}  [${b.fns.map((n) => `${n}()`).join(", ")}]`).join("\n") +
      `\n  sees_all_*() and has_shelter_floor() are TRUE for public_viewer; they narrow a cell, they are not one.\n` +
      `    1. AND the cell beside it:  has_permission('<cell>') and sees_all_residents()\n` +
      `    2. If it is right as written (scripts/lib/scope-guard.mjs says which safe shapes the walk misreads), add\n` +
      `       above or inside the statement:  -- scope-fn: deliberate — <why>`,
  );
process.exit(1);
