import test from "node:test";
import assert from "node:assert/strict";
import { dbRefusal, refusalParams, REFUSAL_KEY } from "./db-refusal.ts";
import en from "./i18n/dictionaries/en.ts";
import th from "./i18n/dictionaries/th.ts";

// The mechanism of #3nuwy: a database function raises a key, the app words it.
// docs/decisions/2026-11-08-db-refusal-keys-mechanism.md

const quiet = (fn) => {
  const original = console.error;
  const logged = [];
  console.error = (...a) => logged.push(a);
  try {
    return { result: fn(), logged };
  } finally {
    console.error = original;
  }
};

test("a known key is worded in each language, with its parameters from details", () => {
  const error = { code: "22023", message: "label.not_translatable", details: '{"table":"diets","column":"name"}' };
  const inEnglish = dbRefusal("t", error, en);
  const inThai = dbRefusal("t", error, th);
  assert.equal(inEnglish.ok, false);
  assert.match(inEnglish.error, /"diets\.name" is not a label that can be translated/);
  assert.match(inThai.error, /"diets\.name" ไม่ใช่ป้ายชื่อที่แปลได้/);
  assert.notEqual(inEnglish.error, inThai.error);
});

test("a key with no parameters needs no details", () => {
  const r = dbRefusal("t", { code: "42501", message: "label.approve_not_allowed", details: null }, th);
  assert.equal(r.error, th.refusals["label.approve_not_allowed"]());
});

test("an UNKNOWN key widens to the generic message with a reference, and never shows the key", () => {
  const { result, logged } = quiet(() =>
    dbRefusal("t", { code: "22023", message: "label.deliberately_not_in_the_dictionary", details: "{}" }, th),
  );
  const ref = result.error.match(/[0-9a-f]{8}/)?.[0];
  assert.ok(ref, "carries a reference");
  assert.equal(result.error, th.common.somethingWentWrong(ref));
  assert.doesNotMatch(result.error, /deliberately_not_in_the_dictionary/);
  assert.equal(logged.length, 1, "the raw error goes to the server log");
});

test("an unknown key with a privilege code still widens to the generic message, not to a narrower sentence", () => {
  const { result } = quiet(() => dbRefusal("t", { code: "42501", message: "some.new_key" }, en));
  assert.match(result.error, /^Something went wrong/);
});

test("an English sentence (an unconverted function) keeps databaseFailure's rules", () => {
  assert.equal(dbRefusal("t", { code: "23505", message: "duplicate key value" }, en).error, en.common.alreadyExists);
  assert.equal(dbRefusal("t", { code: "42501", message: "permission denied for table x" }, th).error, th.common.notAllowed);
  const { result } = quiet(() => dbRefusal("t", { code: "P0001", message: "This job does not fall on Monday." }, en));
  assert.match(result.error, /^Something went wrong/);
});

test("a key never matches an inherited property of the dictionary block", () => {
  const { result } = quiet(() => dbRefusal("t", { message: "constructor.name" }, en));
  assert.match(result.error, /^Something went wrong/);
});

test("details that are not a JSON object give no parameters rather than a throw", () => {
  assert.deepEqual(refusalParams(null), {});
  assert.deepEqual(refusalParams("not json"), {});
  assert.deepEqual(refusalParams("[1,2]"), {});
  assert.deepEqual(refusalParams('{"row":5,"x":null}'), { row: "5", x: "" });
});

test("every key in the refusals block has the key shape, and Thai has exactly the same keys", () => {
  for (const k of Object.keys(en.refusals)) assert.match(k, REFUSAL_KEY, k);
  assert.deepEqual(Object.keys(th.refusals).sort(), Object.keys(en.refusals).sort());
});
