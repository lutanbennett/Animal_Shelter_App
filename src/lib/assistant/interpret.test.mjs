import test from "node:test";
import assert from "node:assert/strict";
import {
  askableField,
  historyPreface,
  interpretSentence,
  interpretTools,
  runLookup,
  validateToolInput,
  MAX_HISTORY,
  MAX_ROUNDS,
  MAX_ROUNDS_PER_SENTENCE,
} from "./interpret.ts";
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
  assert.deepEqual(names, ["due", "lookup", "request_details", "where", "who"]);
  // The question tool can only be about the actions this person was given.
  const rd = interpretTools(false).find((t) => t.name === "request_details");
  assert.deepEqual(rd.inputSchema.properties.action.enum, ["where", "who", "due"]);
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

// ------------------------------------------------- stream 4: conversation

const ask = (action, fields, id = "q") => call("request_details", { action, fields, question: "What does she weigh?" }, id);
const weigh = (extra = {}) => ({ request: "weigh Panda", ...extra });

test("request_details: the model asks, the person answers, the answer returns as the tool result", async () => {
  const first = script([
    { toolCalls: [call("lookup", { kind: "resident", query: "Panda" }, "l")], stop: "tool_calls" },
    { toolCalls: [ask("weight", ["weightKg"])], stop: "tool_calls" },
  ]);
  const a = await run(first, weigh());
  assert.equal(a.ok, true);
  assert.equal(a.ask.action, "weight");
  assert.deepEqual(a.ask.fields, [{ name: "weightKg", input: "number" }]);
  assert.equal(a.trace.exchange.outcome, "asked");
  assert.equal(a.trace.exchange.v, 2);

  // The browser hands the paused exchange back as plain JSON, as a server action would.
  const state = JSON.parse(JSON.stringify(a.resume));
  const second = script([
    () => {
      const last = second.calls[0].messages.at(-1).content.at(-1);
      assert.equal(last.type, "tool_result");
      assert.equal(last.callId, "q");
      assert.deepEqual(JSON.parse(last.content).answers, { weightKg: 12.4 });
      return {
        text: "",
        toolCalls: [call("weight", { residentId: "r1", weightKg: 12.4, date: null })],
        stop: "tool_calls",
        usage: { inputTokens: 5, outputTokens: 2 },
        model: "fake-1",
      };
    },
  ]);
  const b = await run(second, weigh({ resume: { state, answer: { weightKg: "12.4" } } }));
  assert.equal(b.ok, true);
  assert.deepEqual(b.draft, { kind: "weight", residentId: "r1", weightKg: 12.4, date: null });
  // One row per sentence: the whole exchange, both legs, the question and its answer.
  const ex = b.trace.exchange;
  assert.equal(ex.rounds, 3);
  assert.equal(ex.asks, 1);
  assert.deepEqual(ex.usage, { inputTokens: 15, outputTokens: 6 });
  assert.equal(ex.messages.filter((m) => m.role === "assistant").length, 3);
});

test("a skipped question tells the model to pass null, and the card gets a blank", async () => {
  const a = await run(script([{ toolCalls: [ask("weight", ["weightKg"])], stop: "tool_calls" }]), weigh());
  const llm = script([{ toolCalls: [call("weight", { residentId: "r1", weightKg: null, date: null })], stop: "tool_calls" }]);
  const b = await run(llm, weigh({ resume: { state: a.resume, answer: {} } }));
  assert.equal(b.ok, true);
  assert.equal(b.draft.weightKg, null);
  assert.match(llm.calls[0].messages.at(-1).content.at(-1).content, /skipped/);
});

test("drift: a field already answered is not asked again; asking only that is refused", async () => {
  const a = await run(script([{ toolCalls: [ask("weight", ["weightKg"])], stop: "tool_calls" }]), weigh());
  // Re-asks weightKg alongside a new field: only the new one is put to the person.
  const b = await run(
    script([{ toolCalls: [ask("weight", ["weightKg", "date"], "q2")], stop: "tool_calls" }]),
    weigh({ resume: { state: a.resume, answer: { weightKg: 12 } } }),
  );
  assert.deepEqual(b.ask.fields.map((f) => f.name), ["date"]);
  // Re-asks only weightKg: refused back to the model, which then calls the action.
  const llm = script([
    { toolCalls: [ask("weight", ["weightKg"], "q2")], stop: "tool_calls" },
    { toolCalls: [call("weight", { residentId: "r1", weightKg: 12, date: null })], stop: "tool_calls" },
  ]);
  const c = await run(llm, weigh({ resume: { state: a.resume, answer: { weightKg: 12 } } }));
  assert.equal(c.ok, true);
  assert.equal(c.draft.weightKg, 12);
  const refusal = llm.calls[1].messages.at(-1).content[0];
  assert.equal(refusal.isError, true);
  assert.match(refusal.content, /Already answered/);
});

test("drift: a model that forgets or rewrites the person's answer has it put back", async () => {
  const a = await run(script([{ toolCalls: [ask("weight", ["weightKg"])], stop: "tool_calls" }]), weigh());
  const b = await run(
    script([{ toolCalls: [call("weight", { residentId: "r1", weightKg: null, date: null })], stop: "tool_calls" }]),
    weigh({ resume: { state: a.resume, answer: { weightKg: 9.5 } } }),
  );
  assert.equal(b.draft.weightKg, 9.5);
});

test("drift: asking for an id, a field the tool lacks or an action it was not given is refused", async () => {
  for (const bad of [ask("weight", ["residentId"]), ask("weight", ["colour"]), ask("death", ["causeOfDeath"])]) {
    const llm = script([{ toolCalls: [bad], stop: "tool_calls" }, { toolCalls: [bad], stop: "tool_calls" }]);
    const r = await run(llm, { canWrite: bad.input.action !== "death" });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "malformed");
    assert.equal(llm.calls[1].messages.at(-1).content[0].isError, true);
  }
});

test("drift: a model that never stops asking is cut off at MAX_ASKS, within the sentence's round cap", async () => {
  let state = (await run(script([{ toolCalls: [ask("death", ["causeOfDeath"], "q1")], stop: "tool_calls" }]))).resume;
  state = (await run(script([{ toolCalls: [ask("death", ["date"], "q2")], stop: "tool_calls" }]), { resume: { state, answer: {} } })).resume;
  assert.ok(state, "the second question is allowed");
  const third = script([
    { toolCalls: [ask("death", ["residentId"], "q3")], stop: "tool_calls" },
    { toolCalls: [ask("move", ["date"], "q4")], stop: "tool_calls" },
  ]);
  const r = await run(third, { resume: { state, answer: {} } });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "malformed");
  const lastReply = r.trace.exchange.messages.at(-1).content[0].content;
  assert.match(lastReply, /No more questions/);
  // However the legs fall, a sentence never costs more than MAX_ROUNDS_PER_SENTENCE model calls.
  assert.ok(r.trace.exchange.rounds <= MAX_ROUNDS_PER_SENTENCE);
});

test("drift: a model that both acts and asks in one reply has acted", async () => {
  const r = await run(
    script([{ toolCalls: [ask("move", ["date"]), call("move", { residentId: "r1", enclosureId: "e2", date: null })], stop: "tool_calls" }]),
  );
  assert.equal(r.ok, true);
  assert.equal(r.draft.kind, "move");
});

test("a tampered or mismatched resume is refused, never trusted", async () => {
  const a = await run(script([{ toolCalls: [ask("weight", ["weightKg"])], stop: "tool_calls" }]), weigh());
  const none = script([]);
  // Another sentence.
  assert.equal((await run(none, { request: "something else", resume: { state: a.resume, answer: {} } })).reason, "malformed");
  // Already answered: nothing is waiting.
  const answered = structuredClone(a.resume);
  answered.messages.at(-1).content.push({ type: "tool_result", callId: "q", content: "{}" });
  assert.equal((await run(none, weigh({ resume: { state: answered, answer: {} } }))).reason, "malformed");
  // Junk.
  assert.equal((await run(none, weigh({ resume: { state: { messages: "x" }, answer: {} } }))).reason, "malformed");
  assert.equal(none.calls.length, 0, "no model call is made for a refused resume");
  // An answer to a field that was not asked, or of the wrong type, never reaches the model.
  const llm = script([{ toolCalls: [call("weight", { residentId: "r1", weightKg: null, date: null })], stop: "tool_calls" }]);
  await run(llm, weigh({ resume: { state: a.resume, answer: { weightKg: "heavy", residentId: "r2" } } }));
  assert.deepEqual(JSON.parse(llm.calls[0].messages.at(-1).content.at(-1).content).answers, { weightKg: null });
});

test("ambiguity is asked, not guessed: a pick among several matches that is not exact goes to the picker", async () => {
  const lookPan = { toolCalls: [call("lookup", { kind: "resident", query: "pan" }, "l")], stop: "tool_calls" };
  const guessed = await run(script([lookPan, { toolCalls: [call("where", { residentId: "r2" })], stop: "tool_calls" }]));
  assert.equal(guessed.draft.residentId, null);
  assert.deepEqual(guessed.residentCandidates, ["r1", "r2"]);
  const left = await run(script([lookPan, { toolCalls: [call("where", { residentId: null })], stop: "tool_calls" }]));
  assert.deepEqual(left.residentCandidates, ["r1", "r2"]);
  // "Panda" is exactly r1's name, so picking r1 out of Panda and Panda Two stands.
  const exact = { toolCalls: [call("lookup", { kind: "resident", query: "Panda" }, "l")], stop: "tool_calls" };
  const sure = await run(script([exact, { toolCalls: [call("where", { residentId: "r1" })], stop: "tool_calls" }]));
  assert.equal(sure.draft.residentId, "r1");
  assert.deepEqual(sure.residentCandidates, []);
});

test("history: the model sees earlier sentences, checked and capped; the row stores none of their text", async () => {
  const history = [
    { request: "oldest, dropped", outcome: "recorded" },
    { request: "an invented id", outcome: "recorded", kind: "move", residentId: "nope" },
    { request: "bad outcome", outcome: "hacked" },
    { request: "weigh her 12kg", outcome: "open", kind: "weight", residentId: "r1" },
  ];
  const llm = script([{ toolCalls: [call("hospital", { residentId: "r1", date: null })], stop: "tool_calls" }]);
  const r = await run(llm, { request: "send her to hospital", history });
  const sent = llm.calls[0].messages[0].content[0].text;
  assert.ok(sent.endsWith("send her to hospital"));
  assert.match(sent, /resident Panda, id r1/);
  assert.doesNotMatch(sent, /oldest, dropped|hacked|nope/);
  assert.equal(r.trace.exchange.history, 2);
  assert.equal(MAX_HISTORY, 3);
  // The row keeps the sentence alone: the earlier ones each have their own row.
  assert.equal(r.trace.exchange.messages[0].content[0].text, "send her to hospital");
  assert.equal(JSON.stringify(r.trace.exchange).includes("weigh her"), false);
  // The system prompt does not change with the history, so a local server can keep it read.
  const bare = script([{ toolCalls: [call("hospital", { residentId: "r1", date: null })], stop: "tool_calls" }]);
  await run(bare, { request: "send her to hospital" });
  assert.equal(bare.calls[0].system, llm.calls[0].system);
  assert.deepEqual(historyPreface("nonsense", rows), { text: "", count: 0 });
});

test("the modal's fields come from the tool's own schema", () => {
  const tools = new Map(interpretTools(true).map((t) => [t.name, t]));
  assert.deepEqual(askableField(tools.get("weight"), "weightKg"), { name: "weightKg", input: "number" });
  assert.deepEqual(askableField(tools.get("weight"), "date"), { name: "date", input: "date" });
  assert.deepEqual(askableField(tools.get("clinic"), "time"), { name: "time", input: "time" });
  assert.deepEqual(askableField(tools.get("death"), "causeOfDeath"), { name: "causeOfDeath", input: "text" });
  assert.deepEqual(askableField(tools.get("rehome"), "rehomeKind"), { name: "rehomeKind", input: "choice", options: ["foster", "adopt"] });
  assert.deepEqual(askableField(tools.get("due"), "days"), { name: "days", input: "integer" });
  assert.equal(askableField(tools.get("rehome"), "carerId"), null);
  assert.equal(askableField(tools.get("immunization"), "immunizationTypeIds"), null);
  assert.equal(askableField(tools.get("weight"), "colour"), null);
});
