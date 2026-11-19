import test from "node:test";
import assert from "node:assert/strict";
import { unknownArgs, unknownArgsMessage } from "./lib/args.mjs";

const spec = { flags: ["--apply"], valued: ["--env", "--shelter"] };

test("known flags and values pass", () => {
  assert.deepEqual(unknownArgs(["--env", "uat", "--apply", "--shelter", "lanna"], spec), []);
  assert.deepEqual(unknownArgs([], spec), []);
});

test("a mistyped flag is named", () => {
  assert.deepEqual(unknownArgs(["--aply"], spec), ["--aply"]);
  assert.deepEqual(unknownArgs(["--dryrun", "--apply", "--oops"], spec), ["--dryrun", "--oops"]);
});

test("a bare token that is nobody's value is unknown; a value is not judged", () => {
  assert.deepEqual(unknownArgs(["apply"], spec), ["apply"]);
  assert.deepEqual(unknownArgs(["--env", "--apply"], spec), []); // --apply is --env's value here; the script's own value check refuses it
});

test("the message names every unknown argument and says nothing was done", () => {
  const m = unknownArgsMessage("x", ["--a", "--b"]);
  assert.match(m, /unknown arguments --a --b/);
  assert.match(m, /nothing was done/);
});
