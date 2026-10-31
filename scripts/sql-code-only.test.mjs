// The shared SQL reader, and the proof that the BLOCKING check (check-hard-coded-security) can no longer be made to pass by what a
// migration merely says. Each "hidden" fixture was a false GREEN before 2026-10-31: the check printed nothing about a real policy,
// definer function or anon grant. See docs/decisions/2026-10-31-sql-readers-know-string-literals.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sqlCodeOnly } from "./lib/sql-code-only.mjs";

test("a ; or -- inside a string, a block comment or a function body is not code", () => {
  const out = sqlCodeOnly("select 'a;b--c'; -- tail;\n/* x; /* nested */ y; */ grant 1;");
  assert.equal(out.split(";").length, 3);
  assert.ok(!out.includes("tail") && !out.includes("nested"));
  assert.ok(out.includes("grant 1"));
});

test("'' doubling, E'' escapes and quoted identifiers", () => {
  assert.ok(!sqlCodeOnly("select 'it''s; --x'").includes("--x"));
  assert.ok(!sqlCodeOnly("select E'a\'; --x'").includes("--x"));
  assert.ok(sqlCodeOnly('select "a--b"').includes("a--b"));
});

test("dollar bodies: blanked by default, scanned as code with keep", () => {
  const sql = "create function f() as $b$ select 1; /* c; */ select ';--' $b$; select 2;";
  assert.ok(!sqlCodeOnly(sql).includes("select 1"));
  const kept = sqlCodeOnly(sql, { dollarBodies: "keep" });
  assert.ok(kept.includes("select 1") && !kept.includes("c;") && !kept.includes("--"));
  assert.equal(sqlCodeOnly(sql).length, sql.length);
});

test("newlines survive, so line numbers stay honest", () => {
  const sql = "a\r\n-- c\r\n'x\ny'\r\n/* \n */b";
  assert.equal(sqlCodeOnly(sql).split(/\n/).length, sql.split(/\n/).length);
});

const repo = resolve(import.meta.dirname, "..");
function flagged(sql) {
  const dir = mkdtempSync(join(tmpdir(), "hcs-"));
  try {
    mkdirSync(join(dir, "docs"));
    mkdirSync(join(dir, "src/lib/permissions"), { recursive: true });
    mkdirSync(join(dir, "supabase/migrations"), { recursive: true });
    cpSync(join(repo, "docs/hard-coded-security-registry.json"), join(dir, "docs/hard-coded-security-registry.json"));
    cpSync(join(repo, "src/lib/permissions/can.ts"), join(dir, "src/lib/permissions/can.ts"));
    writeFileSync(join(dir, "supabase/migrations/9999_fixture.sql"), sql + "\n");
    const r = spawnSync(process.execPath, [join(repo, "scripts/check-hard-coded-security.mjs")], { cwd: dir, encoding: "utf8" });
    return /FAIL 9999_fixture/.test(r.stdout);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const HIDDEN = {
  "a -- in a string hides the rest of the line": "comment on table public.t is 'a -- b'; create policy p on public.t for select using (true);",
  "a commented-out has_permission( satisfies the gate": "create policy p on public.t for select /* has_permission('x') */ using (true);",
  "a string holding has_permission( satisfies the gate": "create policy p on public.t for select using (note = 'has_permission(' or true);",
  "a commented gate in a definer body": "create function public.f() returns int language sql security definer as $$ select 1 /* has_permission() */ $$;",
  "an anon grant behind a string --": "select '--'; grant select on public.t to anon;",
};
for (const [name, sql] of Object.entries(HIDDEN)) test(`blocking check sees it: ${name}`, () => assert.ok(flagged(sql)));

test("blocking check still passes the compliant forms", () => {
  assert.ok(!flagged("create policy p on public.t for select using (has_permission('x','read'));"));
  assert.ok(!flagged("create function public.f() returns int language sql security definer as $$ select has_permission('x','read') $$;"));
});
