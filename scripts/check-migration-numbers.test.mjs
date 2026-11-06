import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { KNOWN_DUPLICATES, collisionsWithOpenPrs, duplicateNumbers } from "./lib/migrations.mjs";

const FX = "scripts/fixtures/migration-numbers";
const run = (...a) => spawnSync("node", ["scripts/check-migration-numbers.mjs", "--no-prs", "--base", "HEAD", ...a], { encoding: "utf8" });

test("a planted duplicate number is refused, with no network", () => {
  const r = run("--names-file", `${FX}/planted-duplicate-names.txt`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /0003 is used by more than one file/);
});

test("a clean list passes", () => {
  assert.equal(run("--names-file", `${FX}/clean-names.txt`).status, 0);
});

test("the two known duplicates on main are recorded, not silent", () => {
  assert.deepEqual([...KNOWN_DUPLICATES.keys()], [191, 324]);
  const d = duplicateNumbers(["0324_a.sql", "0324_b.sql", "0325_c.sql", "notes.txt"]);
  assert.deepEqual([...d.keys()], [324]);
});

const prs = [{ number: 9, headRefName: "claude/other", files: [{ path: "supabase/migrations/0328_other.sql" }, { path: "src/x.ts" }] }];

test("an open PR holding the same number is a collision", () => {
  const hits = collisionsWithOpenPrs(["0328_mine.sql"], prs, "claude/mine");
  assert.deepEqual(hits.map((h) => [h.pr, h.other]), [[9, "0328_other.sql"]]);
});

test("a number unique among open PRs passes, and a PR never collides with itself", () => {
  assert.deepEqual(collisionsWithOpenPrs(["0329_mine.sql"], prs, "claude/mine"), []);
  assert.deepEqual(collisionsWithOpenPrs(["0328_other.sql"], prs, "claude/other"), []);
});
