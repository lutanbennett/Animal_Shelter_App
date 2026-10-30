import test from "node:test";
import assert from "node:assert/strict";
import { LlmError, createLlm, MAX_TOKENS_CEILING, DEFAULT_MAX_TOKENS } from "./llm.ts";
import { createOpenAiAdapter, DEFAULT_OPENAI_BASE_URL } from "./llm-openai.ts";
import { draftTools, DRAFT_KINDS } from "./llm-tools.ts";

function fakeFetch(status, body) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), init, body: JSON.parse(init.body) });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  };
  fn.calls = calls;
  return fn;
}
const reply = (message, finish_reason = "stop") => ({
  model: "qwen-test",
  choices: [{ message, finish_reason }],
  usage: { prompt_tokens: 40, completion_tokens: 9 },
});
const ask = { messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }] };
const make = (f, extra = {}) => createOpenAiAdapter({ model: "m", fetch: f, ...extra });
const rejectsKind = (p, kind) => assert.rejects(p, (e) => e instanceof LlmError && e.kind === kind);

test("text reply, usage, model; request goes to chat/completions with system first and a clamped cap", async () => {
  const f = fakeFetch(200, reply({ content: "hello" }));
  const r = await make(f, { baseUrl: "http://box:1234/v1/" }).complete({ ...ask, system: "be brief", maxTokens: 999999 });
  assert.deepEqual([r.text, r.stop, r.model], ["hello", "end", "qwen-test"]);
  assert.deepEqual(r.usage, { inputTokens: 40, outputTokens: 9 });
  assert.equal(f.calls[0].url, "http://box:1234/v1/chat/completions");
  assert.deepEqual(f.calls[0].body.messages[0], { role: "system", content: "be brief" });
  assert.equal(f.calls[0].body.max_tokens, MAX_TOKENS_CEILING);
  assert.equal(f.calls[0].body.stream, false);
  assert.equal(f.calls[0].body.tools, undefined);
  assert.equal(f.calls[0].init.headers.authorization, undefined);
});

test("defaults: Ollama address, default cap; key sent as bearer when set", async () => {
  const f = fakeFetch(200, reply({ content: "x" }));
  await make(f, { apiKey: "k" }).complete(ask);
  assert.equal(f.calls[0].url, `${DEFAULT_OPENAI_BASE_URL}/chat/completions`);
  assert.equal(f.calls[0].body.max_tokens, DEFAULT_MAX_TOKENS);
  assert.equal(f.calls[0].init.headers.authorization, "Bearer k");
});

test("tools go out as functions with auto choice; a tool call has its JSON string parsed", async () => {
  const args = JSON.stringify({ residentId: "r", weightKg: 4.2, date: null });
  const f = fakeFetch(200, reply({ content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "weight", arguments: args } }] }, "tool_calls"));
  const r = await make(f).complete({ ...ask, tools: draftTools() });
  assert.equal(r.stop, "tool_calls");
  assert.deepEqual(r.toolCalls, [{ id: "c1", name: "weight", input: { residentId: "r", weightKg: 4.2, date: null } }]);
  assert.equal(f.calls[0].body.tool_choice, "auto");
  assert.equal(f.calls[0].body.tools.length, DRAFT_KINDS.length);
  assert.equal(f.calls[0].body.tools[0].type, "function");
  assert.ok(f.calls[0].body.tools[0].function.parameters);
});

test("a missing id is filled, an object argument is accepted, and a server that says stop with calls still means tool_calls", async () => {
  const f = fakeFetch(200, reply({ tool_calls: [{ function: { name: "due", arguments: { days: 3 } } }, { function: { name: "who", arguments: "" } }] }, "stop"));
  const r = await make(f).complete(ask);
  assert.deepEqual(r.toolCalls.map((c) => [c.id, c.name, c.input]), [["call_1", "due", { days: 3 }], ["call_2", "who", {}]]);
  assert.equal(r.stop, "tool_calls");
});

test("malformed tool calls are bad_response, never a crash or a guess", async () => {
  for (const args of ["{not json", "[1,2]", "7", "null"]) {
    const f = fakeFetch(200, reply({ tool_calls: [{ id: "c", function: { name: "weight", arguments: args } }] }, "tool_calls"));
    await rejectsKind(make(f).complete(ask), "bad_response");
  }
  await rejectsKind(make(fakeFetch(200, reply({ tool_calls: [{ id: "c", function: { arguments: "{}" } }] }))).complete(ask), "bad_response");
  await rejectsKind(make(fakeFetch(200, { choices: [] })).complete(ask), "bad_response");
  await rejectsKind(make(fakeFetch(200, "<html>")).complete(ask), "bad_response");
});

test("tool results and earlier tool calls are sent in the OpenAI shape", async () => {
  const f = fakeFetch(200, reply({ content: "ok" }));
  await make(f).complete({
    messages: [
      { role: "user", content: [{ type: "text", text: "weigh Panda" }] },
      { role: "assistant", content: [{ type: "tool_call", id: "t1", name: "weight", input: { a: 1 } }] },
      { role: "user", content: [{ type: "tool_result", callId: "t1", content: "done" }, { type: "tool_result", callId: "t2", content: "bad", isError: true }] },
    ],
  });
  const m = f.calls[0].body.messages;
  assert.deepEqual(m[1], { role: "assistant", content: null, tool_calls: [{ id: "t1", type: "function", function: { name: "weight", arguments: '{"a":1}' } }] });
  assert.deepEqual(m[2], { role: "tool", tool_call_id: "t1", content: "done" });
  assert.deepEqual(m[3], { role: "tool", tool_call_id: "t2", content: "Error: bad" });
});

test("stop reasons map", async () => {
  for (const [wire, want] of [["length", "max_tokens"], ["content_filter", "refused"], ["stop", "end"]]) {
    const r = await make(fakeFetch(200, reply({ content: "" }, wire))).complete(ask);
    assert.equal(r.stop, want);
  }
});

test("HTTP failures arrive as LlmError kinds", async () => {
  for (const [status, kind] of [[401, "auth"], [429, "rate_limited"], [400, "bad_request"], [404, "bad_request"], [500, "unavailable"]]) {
    await rejectsKind(make(fakeFetch(status, { error: "x" })).complete(ask), kind);
  }
});

test("a server that is not running is unavailable, with a message that says what to do", async () => {
  const down = async () => { throw new TypeError("fetch failed"); };
  await assert.rejects(make(down).complete(ask), (e) => e.kind === "unavailable" && /ollama serve/.test(e.message));
});

test("a slow server times out as its own kind; the wait is configurable", async () => {
  const hang = (url, init) => new Promise((_, rej) => init.signal.addEventListener("abort", () => rej(init.signal.reason)));
  await rejectsKind(make(hang, { timeoutMs: 1000 }).complete(ask), "timeout");
});

test("no model means not_configured; createLlm wires the provider names and reads its env", async () => {
  assert.throws(() => createOpenAiAdapter({ model: " " }), (e) => e.kind === "not_configured");
  const keys = ["ASSISTANT_LLM_PROVIDER", "ASSISTANT_LLM_MODEL", "ASSISTANT_LLM_BASE_URL"];
  const was = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  try {
    process.env.ASSISTANT_LLM_PROVIDER = " Ollama ";
    delete process.env.ASSISTANT_LLM_MODEL;
    await rejectsKind(createLlm(), "not_configured");
    process.env.ASSISTANT_LLM_MODEL = "qwen3:8b";
    const llm = await createLlm();
    assert.deepEqual([llm.provider, llm.model], ["openai-compatible", "qwen3:8b"]);
  } finally {
    for (const k of keys) was[k] === undefined ? delete process.env[k] : (process.env[k] = was[k]);
  }
});
