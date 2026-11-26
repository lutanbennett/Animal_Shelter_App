// exit-ok: every child process is a *Sync call and nothing opens a socket, so no handle is open at process.exit
// The tenancy catalogue gate WHERE A MIGRATION IS WRITTEN (#tnc41; docs/decisions/2026-11-26-tenancy-catalogue-gate.md).
//
// A migration this branch adds that creates a view, an API-executable security definer function or an RLS table in public must,
// in the same file, give it an owner (`owner to rls_definer`, or security_invoker for a view; `create policy definer_all` for a
// table) or carry an ALLOWED entry with its reason in scripts/lib/tenancy-catalogue.mjs. Reads SQL text only: no token, no
// database, so it runs on every pull request. FAILS the build.
//
//   node scripts/check-tenancy-migrations.mjs                 # files on HEAD not on origin/main
//   node scripts/check-tenancy-migrations.mjs --base <ref>
//   node scripts/check-tenancy-migrations.mjs <file.sql> ... # these files, as if new (earlier-numbered files count as existing)
//
// What it cannot see, and the nightly (check-tenancy-catalogue.mjs --strict) still covers: a `create or replace` of an object an
// earlier file created (its owner is in the database, not the text); grants made outside the file; objects made by dynamic SQL.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { MIGRATIONS_DIR, MIGRATION_NAME, parseLsTree } from "./lib/migrations.mjs";
import { ALLOWED } from "./lib/tenancy-catalogue.mjs";
import { lintMigration, definedKeys } from "./lib/tenancy-migration-lint.mjs";

const TAG = "tenancy migrations";
const args = process.argv.slice(2);
const bi = args.indexOf("--base");
const base = bi >= 0 ? args[bi + 1] : "origin/main";
const given = args.filter((a, i) => a.endsWith(".sql") && !(bi >= 0 && i === bi + 1));
const git = (a) => {
  const r = spawnSync("git", a, { encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim() };
};

const all = readdirSync(MIGRATIONS_DIR).filter((n) => MIGRATION_NAME.test(n)).sort();
let fresh;
if (given.length) {
  fresh = given.map((p) => p.replace(/\\/g, "/").split("/").pop());
} else {
  if (!git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]).ok) {
    console.error(`${TAG}: ${base} does not exist here (git fetch origin main)`);
    process.exit(2);
  }
  const onBase = parseLsTree(git(["ls-tree", base, `${MIGRATIONS_DIR}/`]).out);
  fresh = all.filter((n) => !onBase.has(n));
}
const freshSet = new Set(fresh);
const firstFresh = fresh.slice().sort()[0];
const existing = new Set();
for (const n of all) {
  if (freshSet.has(n) || (given.length && n >= firstFresh)) continue;
  for (const k of definedKeys(readFileSync(`${MIGRATIONS_DIR}/${n}`, "utf8"))) existing.add(k);
}

const bad = [];
for (const n of fresh) {
  const { findings, allowedHit } = lintMigration(readFileSync(`${MIGRATIONS_DIR}/${n}`, "utf8"), { existing, allowed: ALLOWED });
  for (const a of allowedHit) console.log(`${TAG}: allowed  ${n}: ${a.object}`);
  for (const f of findings) bad.push({ n, ...f });
}
if (!bad.length) {
  console.log(`${TAG}: ok — ${fresh.length} new migration file(s), every new view, API definer function and RLS table has an owner or an entry`);
  process.exit(0);
}
const HOW = {
  1: "alter view <name> owner to rls_definer;  (or create it with security_invoker = true)",
  2: "alter function <name>(<args>) owner to rls_definer;  (or revoke execute from public, anon, authenticated)",
  3: "create policy definer_all on <table> for all to rls_definer using (true) with check (true);",
};
console.error(
  `${TAG}: a new object has no owner and no catalogue entry:\n` +
    bad.map((b) => `  - ${b.n}: rule ${b.rule}  ${b.object}\n      fix in the file: ${HOW[b.rule]}`).join("\n") +
    `\n  If it must stay as it is (it reads auth.users, say), add it to ALLOWED in scripts/lib/tenancy-catalogue.mjs with the reason in\n` +
    `  checkable terms. Why: on Supabase postgres has BYPASSRLS, so an object it owns skips every tenant policy.`,
);
process.exit(1);
