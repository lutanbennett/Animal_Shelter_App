import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCsv, labelOf, replay, summarise, report } from "./lib/assistant-eval.mjs";

const sample = () => parseCsv(readFileSync(new URL("./fixtures/assistant-eval-sample.csv", import.meta.url), "utf8"));
const setup = { system: "s", tools: [] };

// A scripted adapter: answers by sentence, like the mocked transport in llm.test.mjs but one layer up.
const scripted = (answers) => ({
  provider: "scripted",
  model: "m",
  complete: async (req) => {
    const a = answers[req.messages[0].content[0].text];
    if (a === "throw") throw new Error("boom");
    return { text: "", stop: a ? "tool_calls" : "end", toolCalls: a ? [{ id: "t", name: a[0], input: { residentId: a[1] } }] : [], usage: { inputTokens: 1, outputTokens: 1 }, model: "m" };
  },
});

test("parseCsv reads quotes, doubled quotes, Thai text, a BOM and CRLF", () => {
  const rows = parseCsv('﻿id,typed,correct_intent,correct_answer\r\n1,"a, ""b""",weight,r1\r\n2,ยัง,,\r\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].typed, 'a, "b"');
  assert.equal(rows[1].typed, "ยัง");
});

test("parseCsv refuses a file that is not the export", () => {
  assert.throws(() => parseCsv("a,b\n1,2\n"), /could-not-help export/);
  assert.throws(() => parseCsv(""), /no rows/);
});

test("labelOf skips blank labels and strips the formula guard", () => {
  assert.equal(labelOf({ correct_intent: "" }), null);
  assert.deepEqual(labelOf({ correct_intent: " Weight ", correct_answer: "'=x" }), { intent: "weight", resident: "=x" });
});

test("replay scores intent and resident, skips unlabelled rows", async () => {
  const llm = scripted({
    "Panda weighs 4.2 kg today": ["weight", "res-panda"],
    "put Mochi in the hospital": ["hospital", "WRONG"],
    'move Biscuit to the "front" yard': ["clinic", "res-biscuit"],
    "what is the weather": null,
  });
  const out = await replay(sample(), llm, setup);
  const s = summarise(out);
  assert.equal(s.unlabelled, 1);
  assert.deepEqual(s.intent, { right: 3, of: 4 });
  assert.deepEqual(s.resident, { right: 2, of: 3 });
  const text = report(out, llm);
  assert.match(text, /INTENT agreement\s+75\.0%/);
  assert.match(text, /No threshold/);
});

test("a model error counts as wrong intent and does not stop the run", async () => {
  const out = await replay(sample(), scripted({ "Panda weighs 4.2 kg today": "throw" }), setup);
  assert.equal(summarise(out).errors, 1);
  assert.equal(out.results.length, 4);
});

test("an empty labelled set reports n/a rather than dividing by zero", async () => {
  const out = await replay([{ id: "1", typed: "x", correct_intent: "", correct_answer: "" }], scripted({}), setup);
  assert.match(report(out, { provider: "p", model: "m" }), /n\/a/);
});
