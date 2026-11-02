// Three SQL readers that stripped `--` before accounting for string literals. Each case below passed (or was missed) under the old reader.
// See docs/decisions/2026-11-02-three-sql-readers-know-string-literals.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { assertSelectOnly } from "./lib/readonly-checks.mjs";

test("assertSelectOnly: a -- inside a string cannot hide a write keyword after it (this FAILED OPEN before)", () => {
  assert.throws(() => assertSelectOnly("x", "select '--' as a, (delete from t) as b"), /delete/);
  assert.throws(() => assertSelectOnly("x", "select '--' as a; drop table t"), /more than one/);
  assert.throws(() => assertSelectOnly("x", "select 1 where 'it''s --' = x and set"), /set/);
});

test("assertSelectOnly: do $$ … $$ is still refused (the keyword itself is forbidden), and literals stay harmless", () => {
  assert.throws(() => assertSelectOnly("x", "select 1 where $$ -- $$ = 'a' and do $$ delete from t $$"), /do/);
  assert.doesNotThrow(() => assertSelectOnly("x", "select $$ delete; $$ as note -- trailing delete"));
  assert.doesNotThrow(() => assertSelectOnly("x", "select '--; insert' as note"));
});

test("new-policy-role-names: a role named one character past a -- inside a string is caught", () => {
  const r = spawnSync(process.execPath, ["scripts/check-new-policy-role-names.mjs", "scripts/test-fixtures/readers-dash-in-string.sql"], { encoding: "utf8" });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /names a role/);
});
