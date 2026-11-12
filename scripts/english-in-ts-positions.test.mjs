import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NAMED_ARG_POSITIONS, namedArgPositions } from "./lib/english-in-ts-positions.mjs";

// The position rule 3 could not see, proven against fixtures rather than
// described: docs/decisions/2026-11-12-rule3-drive-error-fallback.md.
// It reports nothing on today's tree because every call already passes a
// dictionary lookup, so these are what prove the position fires at all.

const here = path.dirname(fileURLToPath(import.meta.url));

test("the table holds exactly one entry, and it is the Drive fallback", () => {
  assert.equal(NAMED_ARG_POSITIONS.length, 1);
  assert.equal(NAMED_ARG_POSITIONS[0].callee, "driveErrorMessage");
  assert.deepEqual(NAMED_ARG_POSITIONS[0].args, [1]);
});

test("every entry names its argument positions and says why", () => {
  for (const p of NAMED_ARG_POSITIONS) {
    assert.ok(p.args.length > 0, `${p.callee} names no argument`);
    assert.ok(
      p.args.every((n) => Number.isInteger(n) && n >= 0),
      `${p.callee} has a non-index argument position`,
    );
    assert.ok((p.why ?? "").length > 20, `${p.callee} has no reason`);
  }
});

test("the second argument of driveErrorMessage is a named position", () => {
  assert.deepEqual(namedArgPositions("driveErrorMessage"), [1]);
});

test("a call reached through an object still matches on its name", () => {
  assert.deepEqual(namedArgPositions("errors.driveErrorMessage"), [1]);
});

test("the second argument of any OTHER call is NOT a position", () => {
  // The whole point of naming positions: a general rule would flood the report.
  for (const callee of ["refuse", "console.error", "supabase.from", "t", "driveErrorMessageOther", "getDriveErrorMessage"]) {
    assert.equal(namedArgPositions(callee), null, `${callee} should not be a position`);
  }
});

test("a callee whose name is not statically known is not a position", () => {
  for (const callee of ["a[b]", "f()", "pick(x).driveErrorMessage"]) {
    assert.equal(namedArgPositions(callee), null, `${callee} should not be a position`);
  }
});

test("a non-string callee is handled rather than thrown on", () => {
  for (const callee of [undefined, null, 0, {}]) assert.equal(namedArgPositions(callee), null);
});

test("rule 3 is still wired to the table", () => {
  // A table nothing reads would report nothing and look exactly like a clean tree.
  const src = readFileSync(path.join(here, "check-thai-dictionary.mjs"), "utf8");
  assert.match(src, /import \{ namedArgPositions \} from "\.\/lib\/english-in-ts-positions\.mjs";/);
  assert.match(src, /namedArgPositions\(callee\)/);
});

test("RULE_3_BLOCKS is still false", () => {
  // The flip waits on a Thai speaker reading the strings (#y1dqu) and on a day
  // of PRs with no false positive. Not this stream's to make.
  const src = readFileSync(path.join(here, "check-thai-dictionary.mjs"), "utf8");
  assert.match(src, /const RULE_3_BLOCKS = false;/);
});
