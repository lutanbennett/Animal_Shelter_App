import test from "node:test";
import assert from "node:assert/strict";
import { findProblems, refusalKeys, REFUSAL_KEY, KEYED_FROM } from "./check-sql-refusal-keys.mjs";
import { REFUSAL_KEY as APP_KEY } from "../src/lib/db-refusal.ts";

// The gate of #3nuwy, proven against fixtures rather than described.

const userCls = { id: "called-and-forwarded", reads: "user" };
const row = (file, texts, cls = userCls, unparsed = 0) => ({
  f: { name: "f", file },
  m: { messages: texts.map((text) => ({ text })), unparsed, all: texts.length + unparsed },
  cls,
  srcCallers: [{ rel: "src/app/x/actions.ts" }],
});
const keys = new Set(["label.known"]);

test("the check and the app agree on what a key looks like", () => {
  assert.equal(String(REFUSAL_KEY), String(APP_KEY));
});

test("a NEW person-read function raising an English sentence fails", () => {
  const p = findProblems([row(`0${KEYED_FROM + 1}_x.sql`, ["no such thing: %"])], keys, keys);
  assert.equal(p.length, 1);
  assert.match(p[0], /raises a sentence, not a key/);
});

test("the same sentence in a function last defined BEFORE the cut-off is ignored", () => {
  assert.deepEqual(findProblems([row("0166_x.sql", ["not a translatable label: %.%"])], keys, keys), []);
});

test("a new function's sentence is ignored when no person reads it (trigger, masked)", () => {
  for (const cls of [{ id: "trigger", reads: "maybe" }, { id: "called-and-masked", reads: "masked" }]) {
    assert.deepEqual(findProblems([row(`0${KEYED_FROM}_x.sql`, ["English"], cls)], keys, keys), []);
  }
});

test("a forwarded-and-masked caller counts as read by a person", () => {
  const p = findProblems([row(`0${KEYED_FROM}_x.sql`, ["English"], { id: "called-forwarded-and-masked", reads: "maybe" })], keys, keys);
  assert.equal(p.length, 1);
});

test("an unreadable raise in scope fails", () => {
  assert.equal(findProblems([row(`0${KEYED_FROM}_x.sql`, [], userCls, 1)], keys, keys).length, 1);
});

test("a raised key missing from either dictionary fails, wherever the function is defined", () => {
  const p = findProblems([row("0100_x.sql", ["label.unknown"])], keys, new Set(["label.unknown"]));
  assert.equal(p.length, 1);
  assert.match(p[0], /no entry in refusals in en\.ts/);
});

test("a keyed function with wording in both passes", () => {
  assert.deepEqual(findProblems([row(`0${KEYED_FROM}_x.sql`, ["label.known"])], keys, keys), []);
});

test("refusalKeys reads only the refusals block, CRLF or LF", () => {
  const src = 'const en = {\r\n  common: {\r\n    "a.b": 1,\r\n  },\r\n  refusals: {\r\n    "label.x": () => "X",\r\n    "label.y": (p) =>\r\n      `y`,\r\n  },\r\n};';
  assert.deepEqual([...refusalKeys(src)].sort(), ["label.x", "label.y"]);
});
