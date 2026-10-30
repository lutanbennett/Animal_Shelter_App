import test from "node:test";
import assert from "node:assert/strict";
import { LlmError, clampMaxTokens, createLlm, MAX_TOKENS_CEILING, DEFAULT_MAX_TOKENS } from "./llm.ts";
import { createClaudeAdapter, DEFAULT_CLAUDE_MODEL } from "./llm-claude.ts";
import { draftTools, draftFromToolCall, DRAFT_KINDS } from "./llm-tools.ts";

// A fake transport: records the request, answers with a canned reply. No network.
function fakeFetch(status, body) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  fn.calls = calls;
  return fn;
}

const reply = (content, stop_reason = "end_turn") => ({
  id: "msg_1",
  type: "message",
  role: "assistant",
  model: "claude-test",
  content,
  stop_reason,
  stop_sequence: null,
  usage: { input_tokens: 11, output_tokens: 7 },
});

const ask = { messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }] };

test("text reply comes back as neutral text with usage and model", async () => {
  const f = fakeFetch(200, reply([{ type: "text", text: "hello" }]));
  const llm = createClaudeAdapter({ apiKey: "k", model: "m-1", fetch: f });
  const r = await llm.complete({ ...ask, system: "be brief" });
  assert.equal(r.text, "hello");
  assert.equal(r.stop, "end");
  assert.deepEqual(r.usage, { inputTokens: 11, outputTokens: 7 });
  assert.equal(r.model, "claude-test");
  assert.equal(f.calls[0].body.model, "m-1");
  assert.equal(f.calls[0].body.system, "be brief");
  assert.equal(f.calls[0].body.max_tokens, DEFAULT_MAX_TOKENS);
});

test("model defaults, and comes from one option", () => {
  assert.equal(createClaudeAdapter({ apiKey: "k", fetch: fakeFetch(200, {}) }).model, DEFAULT_CLAUDE_MODEL);
  assert.equal(createClaudeAdapter({ apiKey: "k", model: " x ", fetch: fakeFetch(200, {}) }).model, "x");
});

test("a tool call becomes a neutral tool call, and tools go out as plain schemas with auto choice", async () => {
  const f = fakeFetch(200, reply([{ type: "tool_use", id: "t1", name: "weight", input: { residentId: "r", weightKg: 4.2, date: null } }], "tool_use"));
  const llm = createClaudeAdapter({ apiKey: "k", fetch: f });
  const r = await llm.complete({ ...ask, tools: draftTools() });
  assert.equal(r.stop, "tool_calls");
  assert.deepEqual(r.toolCalls, [{ id: "t1", name: "weight", input: { residentId: "r", weightKg: 4.2, date: null } }]);
  assert.deepEqual(f.calls[0].body.tool_choice, { type: "auto" });
  assert.equal(f.calls[0].body.tools.length, DRAFT_KINDS.length);
  assert.ok(f.calls[0].body.tools[0].input_schema);
});

test("tool results and earlier tool calls are sent back in the vendor shape", async () => {
  const f = fakeFetch(200, reply([{ type: "text", text: "ok" }]));
  const llm = createClaudeAdapter({ apiKey: "k", fetch: f });
  await llm.complete({
    messages: [
      { role: "user", content: [{ type: "text", text: "weigh Panda" }] },
      { role: "assistant", content: [{ type: "tool_call", id: "t1", name: "weight", input: {} }] },
      { role: "user", content: [{ type: "tool_result", callId: "t1", content: "done", isError: false }] },
    ],
  });
  const m = f.calls[0].body.messages;
  assert.equal(m[1].content[0].type, "tool_use");
  assert.equal(m[2].content[0].tool_use_id, "t1");
});

test("spend guard: max tokens is clamped at the adapter", async () => {
  assert.equal(clampMaxTokens(undefined), DEFAULT_MAX_TOKENS);
  assert.equal(clampMaxTokens(-5), DEFAULT_MAX_TOKENS);
  assert.equal(clampMaxTokens(999999), MAX_TOKENS_CEILING);
  const f = fakeFetch(200, reply([{ type: "text", text: "x" }]));
  await createClaudeAdapter({ apiKey: "k", fetch: f }).complete({ ...ask, maxTokens: 999999 });
  assert.equal(f.calls[0].body.max_tokens, MAX_TOKENS_CEILING);
});

test("stop reasons map", async () => {
  for (const [wire, want] of [["max_tokens", "max_tokens"], ["refusal", "refused"], ["end_turn", "end"]]) {
    const r = await createClaudeAdapter({ apiKey: "k", fetch: fakeFetch(200, reply([{ type: "text", text: "" }], wire)) }).complete(ask);
    assert.equal(r.stop, want);
  }
});

test("vendor failures arrive as LlmError kinds", async () => {
  const err = { type: "error", error: { type: "x", message: "nope" } };
  for (const [status, kind] of [[401, "auth"], [429, "rate_limited"], [400, "bad_request"], [500, "unavailable"]]) {
    const llm = createClaudeAdapter({ apiKey: "k", fetch: fakeFetch(status, err) });
    await assert.rejects(llm.complete(ask), (e) => e instanceof LlmError && e.kind === kind);
  }
});

test("no key means not_configured, and an unknown provider is refused", async () => {
  assert.throws(() => createClaudeAdapter({ apiKey: undefined }), (e) => e instanceof LlmError && e.kind === "not_configured");
  const was = process.env.ASSISTANT_LLM_PROVIDER;
  process.env.ASSISTANT_LLM_PROVIDER = "nope";
  try {
    await assert.rejects(createLlm(), (e) => e instanceof LlmError && e.kind === "not_configured");
  } finally {
    if (was === undefined) delete process.env.ASSISTANT_LLM_PROVIDER;
    else process.env.ASSISTANT_LLM_PROVIDER = was;
  }
});

test("one tool per Draft kind; every field is required, and additionalProperties is false", () => {
  const tools = draftTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [...DRAFT_KINDS].sort());
  for (const t of tools) {
    assert.equal(t.inputSchema.additionalProperties, false);
    assert.deepEqual([...t.inputSchema.required].sort(), Object.keys(t.inputSchema.properties).sort());
  }
});

test("a tool call turns into a Draft; wrong types become blanks", () => {
  assert.deepEqual(draftFromToolCall("weight", { residentId: "r1", weightKg: 4.5, date: "2026-10-30" }), {
    kind: "weight", residentId: "r1", weightKg: 4.5, date: "2026-10-30",
  });
  assert.deepEqual(draftFromToolCall("weight", { residentId: 5, weightKg: "heavy" }), {
    kind: "weight", residentId: null, weightKg: null, date: null,
  });
  assert.deepEqual(draftFromToolCall("immunization", { residentId: "r", immunizationTypeIds: ["a", 3, ""] }), {
    kind: "immunization", residentId: "r", immunizationTypeIds: ["a"], date: null,
  });
  assert.equal(draftFromToolCall("rehome", { rehomeKind: "bogus" }).rehomeKind, null);
  assert.equal(draftFromToolCall("due", {}).days, 7);
  assert.equal(draftFromToolCall("constructor", {}), null);
  assert.equal(draftFromToolCall("nope", {}), null);
});
