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
// 'staff' 'vet' 'admin' 'volunteer' cast to app_role, inside a `create policy` / `alter policy` statement.
// Functions and views that mention a role are not judged — only policies.
//
// ESCAPE HATCH. A deliberate one (the vet's 54 are a recorded decision: perm-convert-vet is parked) is marked with
//     -- policy-role: deliberate — <why>
// as a comment inside the statement or among the comment lines directly above it. The reason is required. Marked
// statements pass but are listed, so a reviewer sees each one. A guard with no way out gets deleted.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { MIGRATIONS_DIR, MIGRATION_NAME, parseLsTree } from "./lib/migrations.mjs";

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
const NAMES_ROLE = /current_user_role\s*\(\s*\)|'(management|staff|vet|admin|volunteer)'\s*::\s*app_role/i;
const MARKER = /--\s*policy-role:\s*deliberate\s*[—–-]+\s*(\S.*)/i;

/** Every create/alter policy in `sql` that names a role: { head, marker (the reason, or null) }. */
export function findRolePolicies(sql) {
  const found = [];
  let carried = []; // comment lines since the last statement ended, which belong to the next one
  const chunks = sql.split(";");
  for (const [i, chunk] of chunks.entries()) {
    const lines = chunk.split("\n");
    // A comment on the same line as the closing `;` belongs to the statement that just ended.
    const trailing = i > 0 ? lines.shift().match(MARKER) : null;
    if (trailing && found.length && !found.at(-1).marker) found.at(-1).marker = trailing[1].trim();
    const code = [];
    let marker = null;
    for (const line of lines) {
      const m = line.match(MARKER);
      if (m) marker = m[1].trim();
      const stripped = line.replace(/--.*$/, "");
      if (stripped.trim()) code.push(stripped);
      else if (!code.length && line.trim().startsWith("--")) carried.push(line);
    }
    const text = code.join("\n");
    if (/^\s*(create|alter)\s+policy\b/i.test(text) && NAMES_ROLE.test(text)) {
      const above = carried.map((l) => l.match(MARKER)?.[1].trim()).find(Boolean);
      found.push({ head: text.trim().split("\n")[0].trim(), marker: marker ?? above ?? null });
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
for (const f of candidates) {
  for (const p of findRolePolicies(readFileSync(f, "utf8"))) (p.marker ? deliberate : bad).push({ f, ...p });
}
for (const d of deliberate) console.log(`${TAG}: deliberate — ${d.f}: ${d.head}\n    why: ${d.marker}`);
if (!bad.length) {
  console.log(`${TAG}: ok — ${candidates.length} new migration file(s), none with an unmarked role-named policy`);
  process.exit(0);
}
console.error(
  `${TAG}: a new policy names a role (current_user_role() or '<role>'::app_role):\n` +
    bad.map((b) => `  - ${b.f}: ${b.head}`).join("\n") +
    `\n  Policies ask what you may do, not who you are. Do one of:\n` +
    `    1. Use a permission cell: role_can('<cell>') — see docs/roles-and-permissions.md.\n` +
    `    2. If a role name is genuinely intended (a recorded decision, like the vet's), add above or inside the\n` +
    `       statement:  -- policy-role: deliberate — <why>\n` +
    `       and make sure the table is in OWNERS in scripts/check-policy-role-names.mjs and in §15 of the doc.`,
);
process.exit(1);
