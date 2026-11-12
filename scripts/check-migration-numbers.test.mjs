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
