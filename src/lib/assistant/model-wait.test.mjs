import test from "node:test";
import assert from "node:assert/strict";
import { ASK_MODEL, MODEL_ASLEEP_MS, mayAskModel, waitAfter } from "./model-wait.ts";
import { MAX_ROUNDS, MODEL_TIMEOUT_MS, REQUEST_BUDGET_MS, REQUEST_RESERVE_MS, stepTimeoutMs } from "./interpret.ts";

const NOW = 1_762_000_000_000;
const fail = (reason, extra = {}) => ({ ok: false, reason, ...extra });

test("a fresh conversation asks the model", () => {
  assert.equal(mayAskModel(ASK_MODEL, NOW), true);
});

test("no model in this build is remembered for the whole conversation", () => {
  const wait = waitAfter(fail("not_configured"), NOW);
  assert.deepEqual(wait, { kind: "none" });
  assert.equal(mayAskModel(wait, NOW), false);
  assert.equal(mayAskModel(wait, NOW + 365 * 24 * 3600_000), false);
});

test("a model that did not answer at its address is left alone, then asked again", () => {
  const wait = waitAfter(fail("error", { errorKind: "unavailable" }), NOW);
  assert.deepEqual(wait, { kind: "asleep", until: NOW + MODEL_ASLEEP_MS });
  // The sentence typed straight after does not pay the wait again.
  assert.equal(mayAskModel(wait, NOW + 1000), false);
  assert.equal(mayAskModel(wait, NOW + MODEL_ASLEEP_MS - 1), false);
  // Once the window is up it tries once more, with nobody having to do anything.
  assert.equal(mayAskModel(wait, NOW + MODEL_ASLEEP_MS), true);
});

test("the window is a few minutes, not seconds and not an hour", () => {
  assert.ok(MODEL_ASLEEP_MS >= 60_000 && MODEL_ASLEEP_MS <= 600_000, `${MODEL_ASLEEP_MS} is not a few minutes`);
});

test("nothing else latches: a slow, confused or refusing model is still there", () => {
  for (const reason of ["timeout", "no_draft", "refused", "malformed"]) {
    assert.equal(waitAfter(fail(reason), NOW), null, reason);
  }
  for (const kind of ["auth", "rate_limited", "bad_request", "bad_response", "unknown"]) {
    assert.equal(waitAfter(fail("error", { errorKind: kind }), NOW), null, kind);
  }
  // An "error" the server action raised itself carries no kind.
  assert.equal(waitAfter(fail("error"), NOW), null);
  assert.equal(waitAfter({ ok: true, draft: {}, residentCandidates: [], trace: { model: "m", exchange: {} } }, NOW), null);
});

test("the worst case of a request fits inside the platform's limit", () => {
  assert.equal(MODEL_TIMEOUT_MS * MAX_ROUNDS, REQUEST_BUDGET_MS - REQUEST_RESERVE_MS);
  assert.ok(MODEL_TIMEOUT_MS * MAX_ROUNDS < REQUEST_BUDGET_MS, "no room left for the rest of the request");
});

test("a configured timeout shortens a step and can never lengthen it", () => {
  assert.equal(stepTimeoutMs(undefined), MODEL_TIMEOUT_MS);
  assert.equal(stepTimeoutMs(""), MODEL_TIMEOUT_MS);
  assert.equal(stepTimeoutMs("not a number"), MODEL_TIMEOUT_MS);
  assert.equal(stepTimeoutMs(10), MODEL_TIMEOUT_MS, "a value under a second means unset");
  assert.equal(stepTimeoutMs("8000"), 8000);
  assert.equal(stepTimeoutMs(8000.9), 8000);
  // The default the adapter documents, which four of would be 720 s against a 100 s limit.
  assert.equal(stepTimeoutMs("180000"), MODEL_TIMEOUT_MS);
});
