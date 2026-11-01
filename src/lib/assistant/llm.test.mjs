import test from "node:test";
import assert from "node:assert/strict";
import { LlmError, clampMaxTokens, createLlm, MAX_TOKENS_CEILING, DEFAULT_MAX_TOKENS } from "./llm.ts";
import { draftTools, draftFromToolCall, DRAFT_KINDS } from "./llm-tools.ts";

// This file covers the provider-neutral door only. The one implementation and
// its wire shape are covered by llm-openai.test.mjs, including that the clamp
// below reaches the request as max_tokens. The Claude tests that used to live
// here went with llm-claude.ts (docs/decisions/2026-11-01-drop-anthropic-sdk.md).

test("spend guard: the output cap is clamped before any implementation sees it", () => {
  assert.equal(clampMaxTokens(undefined), DEFAULT_MAX_TOKENS);
  assert.equal(clampMaxTokens(-5), DEFAULT_MAX_TOKENS);
  assert.equal(clampMaxTokens(0), DEFAULT_MAX_TOKENS);
  assert.equal(clampMaxTokens(Number.NaN), DEFAULT_MAX_TOKENS);
  assert.equal(clampMaxTokens(10), 10);
  assert.equal(clampMaxTokens(999999), MAX_TOKENS_CEILING);
});

test("an unknown provider is refused, and so is the retired one", async () => {
  const was = process.env.ASSISTANT_LLM_PROVIDER;
  try {
    for (const name of ["nope", "claude", "anthropic"]) {
      process.env.ASSISTANT_LLM_PROVIDER = name;
      await assert.rejects(createLlm(), (e) => e instanceof LlmError && e.kind === "not_configured");
    }
  } finally {
    if (was === undefined) delete process.env.ASSISTANT_LLM_PROVIDER;
    else process.env.ASSISTANT_LLM_PROVIDER = was;
  }
});

test("unset provider means the self-hosted implementation, and unset model means not_configured", async () => {
  const keys = ["ASSISTANT_LLM_PROVIDER", "ASSISTANT_LLM_MODEL"];
  const was = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  try {
    delete process.env.ASSISTANT_LLM_PROVIDER;
    delete process.env.ASSISTANT_LLM_MODEL;
    await assert.rejects(createLlm(), (e) => e instanceof LlmError && e.kind === "not_configured");
    process.env.ASSISTANT_LLM_MODEL = "qwen3:8b";
    const llm = await createLlm();
    assert.deepEqual([llm.provider, llm.model], ["openai-compatible", "qwen3:8b"]);
  } finally {
    for (const k of keys) was[k] === undefined ? delete process.env[k] : (process.env[k] = was[k]);
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
