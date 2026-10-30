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

// The meeting point of #1116 (this replay) and #1118 (the OpenAI-compatible adapter), built in parallel
// branches and first run together on 2026-10-30. The real adapter, a fake transport speaking Ollama's shape:
// arguments arrive as a JSON string, and a garbled one must score as an error, not stop the run.
test("replay runs through the OpenAI-compatible adapter unchanged", async () => {
  const { createOpenAiAdapter } = await import("../src/lib/assistant/llm-openai.ts");
  const { draftTools } = await import("../src/lib/assistant/llm-tools.ts");
  const answers = {
    "Panda weighs 4.2 kg today": ["weight", JSON.stringify({ residentId: "res-panda" })],
    "put Mochi in the hospital": ["hospital", JSON.stringify({ residentId: "res-mochi" })],
    'move Biscuit to the "front" yard': ["move", "{residentId: res-biscuit"],
  };
  const sent = [];
  const fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    sent.push({ url, body });
    const a = answers[body.messages.find((m) => m.role === "user").content];
    const message = a
      ? { role: "assistant", content: "", tool_calls: [{ id: "c", type: "function", function: { name: a[0], arguments: a[1] } }] }
      : { role: "assistant", content: "nothing to record" };
    return new Response(JSON.stringify({ model: "stub:8b", choices: [{ message, finish_reason: a ? "tool_calls" : "stop" }] }), { status: 200 });
  };
  const llm = createOpenAiAdapter({ baseUrl: "http://pc.lan:11434/v1/", model: "stub:8b", fetch });
  const out = await replay(sample(), llm, { system: "s", tools: draftTools() });
  const s = summarise(out);
  assert.deepEqual(s.intent, { right: 3, of: 4 }); // the garbled move is the miss
  assert.equal(s.errors, 1);
  assert.equal(sent[0].url, "http://pc.lan:11434/v1/chat/completions");
  assert.equal(sent[0].body.tools.length, draftTools().length);
  assert.deepEqual(sent[0].body.messages.map((m) => m.role), ["system", "user"]);
  assert.match(report(out, llm), /openai-compatible \/ stub:8b/);
});
