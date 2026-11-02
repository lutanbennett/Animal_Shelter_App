// check-roles-columns must read a column added after a `--` inside a string literal. Before 2026-11-02 it stripped comments with
// s.replace(/--[^\n]*/g, ""), which cut the line at the string's `--` and hid the column.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, readFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const fixture = resolve("scripts/fixtures/roles-columns-string-dashes.sql");
const script = resolve("scripts/check-roles-columns.mjs");

test("the old regex would have lost the column the fixture adds", () => {
  const oldRead = (s) => s.replace(/--[^\n]*/g, "");
  const sql = readFileSync(fixture, "utf8");
  assert.ok(!/legacy_flag/.test(oldRead(sql)));
  assert.ok(/legacy_flag/.test(sql));
});

test("the check sees the column and passes a select of it", () => {
  const dir = mkdtempSync(join(tmpdir(), "rolescols-"));
  try {
    mkdirSync(join(dir, "supabase/migrations"), { recursive: true });
    mkdirSync(join(dir, "src"), { recursive: true });
    cpSync(fixture, join(dir, "supabase/migrations/0001_fixture.sql"));
    writeFileSync(join(dir, "src/a.ts"), 'const r = db.from("roles").select("id, key, legacy_flag");\n');
    const r = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /3 column\(s\)/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
