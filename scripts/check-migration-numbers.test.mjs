import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { KNOWN_DUPLICATES, collisionsWithOpenPrs, duplicateNumbers, numbersClaimedByOpenPrs } from "./lib/migrations.mjs";
import { evaluate } from "./check-migration-numbers.mjs";

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

// "The next free number" has to count the numbers other open PRs hold, or the check is unsatisfiable the
// moment one of them takes main's highest + 1: that number fails as a collision and the next fails as a gap.
// Measured on 2026-11-12, PRs #1513 (0360_adoption_update_channel_app.sql) and #1515 (this stream): no
// number passed at all, and the refusal's own advice — "take the next free number" — was rejected by the
// gap rule. These are that case, as data.
const MAIN = new Map([
  ["0358_a.sql", "x"],
  ["0359_b.sql", "x"],
]);
const PRS_HOLDING_0360 = [
  { number: 1513, headRefName: "claude/other", files: [{ path: "supabase/migrations/0360_other.sql" }] },
];

test("numbersClaimedByOpenPrs: another PR's number, not my own branch's", () => {
  const claimed = numbersClaimedByOpenPrs(PRS_HOLDING_0360, "claude/mine");
  assert.deepEqual([...claimed.keys()], [360]);
  assert.equal(claimed.get(360).pr, 1513);
  assert.equal(numbersClaimedByOpenPrs(PRS_HOLDING_0360, "claude/other").size, 0);
  assert.equal(numbersClaimedByOpenPrs(null, "claude/mine").size, 0);
});

test("numbersClaimedByOpenPrs: the lowest PR wins, so gh's order cannot change the answer", () => {
  const prs = [
    { number: 99, headRefName: "b", files: [{ path: "supabase/migrations/0360_late.sql" }] },
    { number: 12, headRefName: "a", files: [{ path: "supabase/migrations/0360_early.sql" }] },
  ];
  assert.equal(numbersClaimedByOpenPrs(prs, "mine").get(360).pr, 12);
  assert.equal(numbersClaimedByOpenPrs([...prs].reverse(), "mine").get(360).pr, 12);
});

test("evaluate: with 0360 held by an open PR, 0361 is the next free number", () => {
  const claimed = numbersClaimedByOpenPrs(PRS_HOLDING_0360, "claude/mine");
  const v = evaluate(["supabase/migrations/0361_mine.sql"], MAIN, claimed);
  assert.deepEqual(v.problems, []);
  assert.deepEqual(v.ok, ["0361_mine.sql"]);
});

test("evaluate: 0360 itself is left for the open-PR check to report, not reported twice", () => {
  const claimed = numbersClaimedByOpenPrs(PRS_HOLDING_0360, "claude/mine");
  const v = evaluate(["supabase/migrations/0360_mine.sql"], MAIN, claimed);
  assert.deepEqual(v.problems, []);
  assert.deepEqual(v.ok, []); // not ok either: main() adds the collision problem naming PR 1513
  assert.deepEqual(v.fresh, ["0360_mine.sql"]);
});

test("evaluate: a real gap is still a problem, and names the free number", () => {
  const claimed = numbersClaimedByOpenPrs(PRS_HOLDING_0360, "claude/mine");
  const v = evaluate(["supabase/migrations/0362_mine.sql"], MAIN, claimed);
  assert.equal(v.problems.length, 1);
  assert.match(v.problems[0], /leaves a gap/);
  assert.match(v.problems[0], /0361/);
});

test("evaluate: with no PRs known (the hook), 0360 is the next number and 0361 is a gap", () => {
  assert.deepEqual(evaluate(["supabase/migrations/0360_mine.sql"], MAIN).ok, ["0360_mine.sql"]);
  assert.match(evaluate(["supabase/migrations/0361_mine.sql"], MAIN).problems[0], /leaves a gap/);
});

test("evaluate: two new files take the next two free numbers", () => {
  const claimed = numbersClaimedByOpenPrs(PRS_HOLDING_0360, "claude/mine");
  const v = evaluate(["supabase/migrations/0361_a.sql", "supabase/migrations/0362_b.sql"], MAIN, claimed);
  assert.deepEqual(v.problems, []);
  assert.deepEqual(v.ok, ["0361_a.sql", "0362_b.sql"]);
});

test("evaluate: a number already on main is still refused", () => {
  const v = evaluate(["supabase/migrations/0359_mine.sql"], MAIN);
  assert.equal(v.problems.length, 1);
  assert.match(v.problems[0], /already taken on/);
});

import { renumberAdvice } from "./check-migration-numbers.mjs";
test("renumber advice: applied means do NOT renumber; not applied means renumber; unknown says how to find out", () => {
  assert.match(renumberAdvice("0365_x.sql", "yes"), /ALREADY APPLIED.*Do NOT renumber/s);
  assert.match(renumberAdvice("0365_x.sql", "no"), /safe to renumber/);
  assert.match(renumberAdvice("0365_x.sql", "unknown"), /--is-applied 0365_x\.sql.*do NOT rename/s);
});

// #w8kq3: the hook (allowGap) cannot see open PRs, so a number past main's highest + 1 is accepted there.
// A duplicate or a number main already holds is still refused. CI (no allowGap) stays strict.
test("hook: a gap is accepted (allowGap), CI still refuses it", () => {
  const f = ["supabase/migrations/0361_mine.sql"];
  assert.equal(evaluate(f, MAIN, new Map(), { allowGap: true }).problems.length, 0);
  assert.equal(evaluate(f, MAIN).problems.length, 1);
});

test("hook: a duplicate among new files and a number on main are still refused under allowGap", () => {
  const dup = evaluate(["supabase/migrations/0361_a.sql", "supabase/migrations/0361_b.sql"], MAIN, new Map(), { allowGap: true });
  assert.equal(dup.problems.length, 1);
  assert.match(dup.problems[0], /shared with/);
  const taken = evaluate(["supabase/migrations/0359_mine.sql"], MAIN, new Map(), { allowGap: true });
  assert.match(taken.problems[0], /already taken on/);
});

// #mnchk (2026-11-18): when the open-PR half cannot run, the check must say NOT CHECKED, advise no rename and
// exit 2 — never a verdict. Proved end to end against a throwaway repo: base commit holds 0001-0002, HEAD adds
// 0004 (a real gap). --gh-fails stands in for a GitHub outage; --prs-file stands in for a working gh.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve("scripts/check-migration-numbers.mjs");
function gapRepo(newFile) {
  const dir = mkdtempSync(join(tmpdir(), "mnchk-"));
  const sh = (...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", ...a], { cwd: dir, encoding: "utf8" });
  sh("init", "-q");
  mkdirSync(join(dir, "supabase/migrations"), { recursive: true });
  for (const n of ["0001_a.sql", "0002_b.sql"]) writeFileSync(join(dir, "supabase/migrations", n), "-- x\n");
  sh("add", "."); sh("commit", "-q", "-m", "base"); sh("tag", "base");
  if (newFile) {
    writeFileSync(join(dir, "supabase/migrations", newFile), "-- x\n");
    sh("add", "."); sh("commit", "-q", "-m", "new");
  }
  return dir;
}
const check = (dir, ...a) => spawnSync("node", [SCRIPT, "--base", "base", "--branch", "claude/mine", ...a], { cwd: dir, encoding: "utf8" });

test("gh fails and a new file exists: NOT CHECKED, exit 2, no rename instruction, even for a real gap", () => {
  const dir = gapRepo("0004_gap.sql");
  try {
    const r = check(dir, "--gh-fails");
    assert.equal(r.status, 2);
    assert.match(r.stderr, /NOT CHECKED/);
    assert.doesNotMatch(r.stderr + r.stdout, /git mv|Rename it|safe to renumber/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("gh answers and the same real gap: still refused exactly as before, with the rename", () => {
  const dir = gapRepo("0004_gap.sql");
  const prs = join(dir, "prs.json");
  writeFileSync(prs, "[]");
  try {
    const r = check(dir, "--prs-file", prs);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /leaves a gap/);
    assert.match(r.stderr, /Rename it to 0003_gap\.sql/);
    assert.doesNotMatch(r.stderr, /NOT CHECKED/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("gh answers and the numbering is right: ok, exit 0", () => {
  const dir = gapRepo("0003_fine.sql");
  const prs = join(dir, "prs.json");
  writeFileSync(prs, "[]");
  try { assert.equal(check(dir, "--prs-file", prs).status, 0); } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("gh fails but no migration file is new: nothing to number, so ok (an outage must not block unrelated PRs)", () => {
  const dir = gapRepo(null);
  try { assert.equal(check(dir, "--gh-fails").status, 0); } finally { rmSync(dir, { recursive: true, force: true }); }
});
