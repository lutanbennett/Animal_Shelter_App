import test from "node:test";
import assert from "node:assert/strict";
import { interpretSentence, interpretTools, runLookup, validateToolInput, MAX_ROUNDS } from "./interpret.ts";
import { LlmError } from "./llm.ts";

const rows = {
  residents: [
    { id: "r1", name: "Panda", thaiName: null, code: "D-001", enclosureId: "e1", enclosureName: "A3", enclosureNameTh: null, status: "Resident" },
    { id: "r2", name: "Panda Two", thaiName: null, code: "D-002", enclosureId: null, enclosureName: null, enclosureNameTh: null, status: "Resident" },
  ],
  enclosures: [{ id: "e1", name: "A3", nameTh: null }, { id: "e2", name: "B1", nameTh: null }],
  clinics: [{ id: "c1", name: "Dr Somchai" }],
  carers: [],
  immunizationTypes: [{ id: "v1", name: "Rabies", nameTh: null }],
};

// A scripted adapter: each complete() pops the next reply and records the request.
function script(replies) {
  const calls = [];
  return {
    provider: "fake",
    model: "fake-1",
    calls,
    async complete(req) {
      calls.push(structuredClone(req));
      const next = replies.shift();
      if (next instanceof Error) throw next;
      if (typeof next === "function") return next();
      return { text: "", toolCalls: [], stop: "end", usage: { inputTokens: 5, outputTokens: 2 }, model: "fake-1", ...next };
    },
  };
}
const call = (name, input, id = name) => ({ id, name, input });
const run = (llm, extra = {}) =>
  interpretSentence({ llm, rows, request: "move Panda to B1", today: "2026-10-30", canWrite: true, ...extra });

test("lookup then draft: the model finds ids through tools and the Draft comes back", async () => {
  const llm = script([
    { toolCalls: [call("lookup", { kind: "resident", query: "panda" }, "a"), call("lookup", { kind: "enclosure", query: "b1" }, "b")], stop: "tool_calls" },
    { toolCalls: [call("move", { residentId: "r1", enclosureId: "e2", date: "2026-10-30" })], stop: "tool_calls" },
  ]);
  const r = await run(llm);
  assert.equal(r.ok, true);
  assert.deepEqual(r.draft, { kind: "move", residentId: "r1", enclosureId: "e2", date: "2026-10-30" });
  assert.equal(r.trace.model, "fake-1");
  assert.equal(r.trace.exchange.outcome, "draft");
  assert.equal(r.trace.exchange.rounds, 2);
  assert.deepEqual(r.trace.exchange.usage, { inputTokens: 10, outputTokens: 4 });
  // The model was never handed the list: only the request, then the lookup answers.
  assert.equal(JSON.stringify(llm.calls[0].messages).includes("Panda Two"), false);
  const second = llm.calls[1].messages;
  assert.equal(second.at(-1).content[0].type, "tool_result");
  assert.match(second.at(-1).content[0].content, /Panda Two/);
  // The system prompt is not part of the recorded exchange.
  assert.equal(JSON.stringify(r.trace.exchange).includes("You turn one sentence"), false);
});

test("an invented id is refused, sent back once, and a corrected call is accepted", async () => {
  const llm = script([
    { toolCalls: [call("move", { residentId: "made-up", enclosureId: "e2", date: null })], stop: "tool_calls" },
    { toolCalls: [call("move", { residentId: "r1", enclosureId: "e2", date: null })], stop: "tool_calls" },
  ]);
  const r = await run(llm);
  assert.equal(r.ok, true);
  assert.equal(r.draft.residentId, "r1");
  const back = llm.calls[1].messages.at(-1).content[0];
  assert.equal(back.isError, true);
  assert.match(back.content, /residentId/);
});

test("malformed twice gives up as 'malformed' and keeps the exchange", async () => {
  const bad = { toolCalls: [call("move", { residentId: "r1", colour: "red" })], stop: "tool_calls" };
  const r = await run(script([bad, bad, bad]));
  assert.equal(r.ok, false);
  assert.equal(r.reason, "malformed");
  assert.equal(r.trace.exchange.outcome, "malformed");
});

test("wrong types and bad lookups are malformed, not trusted", () => {
  const weight = interpretTools(true).find((t) => t.name === "weight");
  assert.match(validateToolInput(weight, { residentId: "r1", weightKg: "5", date: null }, rows), /weightKg/);
  assert.match(validateToolInput(weight, { residentId: "r1", weightKg: 5, date: "tomorrow" }, rows), /date/);
  assert.equal(validateToolInput(weight, { residentId: "r1", weightKg: 5, date: "2026-10-30" }, rows), null);
  assert.equal(validateToolInput(weight, { residentId: "r1", weightKg: null }, rows), null);
  const lookup = interpretTools(true)[0];
  assert.match(validateToolInput(lookup, { kind: "dog", query: "x" }, rows), /kind/);
  assert.match(validateToolInput(lookup, { kind: "resident", query: null }, rows), /query/);
  assert.match(validateToolInput(lookup, "resident", rows), /object/);
});

test("a person who may only ask is offered only the questions", () => {
  const names = interpretTools(false).map((t) => t.name).sort();
  assert.deepEqual(names, ["due", "lookup", "where", "who"]);
  assert.ok(interpretTools(true).some((t) => t.name === "death"));
});

test("words only: no_draft; refusal: refused", async () => {
  const a = await run(script([{ text: "I cannot do that.", stop: "end" }]));
  assert.equal(a.reason, "no_draft");
  const b = await run(script([{ text: "no", stop: "refused" }]));
  assert.equal(b.reason, "refused");
  assert.equal(b.trace.exchange.outcome, "refused");
});

test("errors: not_configured leaves no trace (version 1 unchanged); others record the kind", async () => {
  const a = await run(script([new LlmError("not_configured", "x")]));
  assert.deepEqual(a, { ok: false, reason: "not_configured" });
  const b = await run(script([new LlmError("rate_limited", "x", 429)]));
  assert.equal(b.reason, "error");
  assert.equal(b.trace.exchange.errorKind, "rate_limited");
  const c = await run(script([new Error("boom")]));
  assert.equal(c.trace.exchange.errorKind, "unknown");
});

test("a slow model times out", async () => {
  const slow = () => new Promise(() => {});
  const r = await run(script([slow]), { timeoutMs: 20 });
  assert.equal(r.reason, "timeout");
  assert.equal(r.trace.exchange.outcome, "timeout");
});

test("endless lookups stop at MAX_ROUNDS", async () => {
  const again = { toolCalls: [call("lookup", { kind: "resident", query: "p" })], stop: "tool_calls" };
  const llm = script(Array.from({ length: 10 }, () => again));
  const r = await run(llm);
  assert.equal(r.reason, "malformed");
  assert.equal(llm.calls.length, MAX_ROUNDS);
});

test("lookup matches name, code and caps results", () => {
  assert.equal(runLookup(rows, "resident", "d-002")[0].id, "r2");
  assert.equal(runLookup(rows, "resident", "panda").length, 2);
  assert.deepEqual(runLookup(rows, "enclosure", "zzz"), []);
  assert.equal(runLookup(rows, "vaccine", "rab")[0].id, "v1");
});
