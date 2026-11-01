import test from "node:test";
import assert from "node:assert/strict";
import { runWriteAction } from "./action-result.ts";
import { isWrappedWritePath, WRITE_WAIT_MS, ORIGIN_ATTEMPT_MS, WORKER_FALLBACK_MS, writeRequestIdFrom, WRITE_REQUEST_FIELD } from "./write-requests.ts";

// Pi failover (C). The wrapper's whole value is what it does with the three
// answers 0292 gives, so each one is pinned here rather than described.

const messages = {
  somethingWentWrong: (ref) => `went wrong ${ref}`,
  saveUnknown: "could not tell",
  reloadToSave: "reload first",
};

/** A stand-in for the Supabase client: records the calls and answers to order. */
function db(claimAnswer, { claimError = null, finishError = null } = {}) {
  const calls = [];
  return {
    calls,
    rpc(fn, args) {
      calls.push({ fn, args });
      if (fn === "claim_write_request") return Promise.resolve({ data: claimAnswer, error: claimError });
      return Promise.resolve({ data: null, error: finishError });
    },
  };
}

const id = "11111111-2222-4333-8444-555555555555";
const quiet = (run) => {
  const real = console.error;
  console.error = () => {};
  return run().finally(() => { console.error = real; });
};

test("a fresh claim runs the write and records its answer", async () => {
  const d = db({ status: "claimed" });
  let ran = 0;
  const result = await runWriteAction("t", messages, { id, action: "a", db: d }, async () => {
    ran++;
    return { ok: true, success: "saved" };
  });
  assert.deepEqual(result, { ok: true, success: "saved" });
  assert.equal(ran, 1);
  assert.deepEqual(d.calls.map((c) => c.fn), ["claim_write_request", "finish_write_request"]);
  assert.deepEqual(d.calls[1].args.p_result, { ok: true, success: "saved" });
});

test("a replay returns the first result verbatim and never runs the write again", async () => {
  const stored = { ok: true, success: "saved the first time" };
  const d = db({ status: "replay", action: "a", result: stored });
  let ran = 0;
  const result = await runWriteAction("t", messages, { id, action: "a", db: d }, async () => {
    ran++;
    return { ok: true, success: "saved twice" };
  });
  assert.deepEqual(result, stored);
  assert.equal(ran, 0, "the body must not run on a replay");
  assert.deepEqual(d.calls.map((c) => c.fn), ["claim_write_request"]);
});

test("in_flight is a refusal, never a success and never a second write", async () => {
  const d = db({ status: "in_flight", action: "a" });
  let ran = 0;
  const result = await quiet(() =>
    runWriteAction("t", messages, { id, action: "a", db: d }, async () => {
      ran++;
      return { ok: true };
    }),
  );
  assert.deepEqual(result, { ok: false, error: "could not tell" });
  assert.equal(ran, 0);
});

test("a refusal is stored too, so a replay of a refused save is refused the same way", async () => {
  const d = db({ status: "claimed" });
  const result = await runWriteAction("t", messages, { id, action: "a", db: d }, async () => ({ ok: false, error: "no" }));
  assert.deepEqual(result, { ok: false, error: "no" });
  assert.deepEqual(d.calls[1].args.p_result, { ok: false, error: "no" });
});

test("a THROWN body leaves the claim open on purpose, so the retry reads in_flight", async () => {
  const d = db({ status: "claimed" });
  const result = await quiet(() =>
    runWriteAction("t", messages, { id, action: "a", db: d }, async () => {
      throw new Error("connection reset");
    }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /^went wrong /);
  assert.deepEqual(d.calls.map((c) => c.fn), ["claim_write_request"], "finish must NOT be called: we cannot tell whether the write landed");
});

test("no request id is refused rather than written, because the Worker may replay this path", async () => {
  const d = db({ status: "claimed" });
  let ran = 0;
  const result = await quiet(() =>
    runWriteAction("t", messages, { id: null, action: "a", db: d }, async () => {
      ran++;
      return { ok: true };
    }),
  );
  assert.deepEqual(result, { ok: false, error: "reload first" });
  assert.equal(ran, 0);
  assert.equal(d.calls.length, 0, "nothing is claimed without an id");
});

test("a claim that errors never runs the write", async () => {
  const d = db(null, { claimError: { message: "request id already used by action b, not a", code: "22023" } });
  let ran = 0;
  const result = await quiet(() =>
    runWriteAction("t", messages, { id, action: "a", db: d }, async () => {
      ran++;
      return { ok: true };
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(ran, 0);
});

test("a finish that fails still reports the write that happened", async () => {
  const d = db({ status: "claimed" }, { finishError: { message: "no open claim" } });
  const result = await quiet(() => runWriteAction("t", messages, { id, action: "a", db: d }, async () => ({ ok: true, success: "saved" })));
  assert.deepEqual(result, { ok: true, success: "saved" });
});

test("an unrecognised claim answer is a failure, not a licence to write", async () => {
  const d = db({ status: "something new" });
  let ran = 0;
  const result = await quiet(() =>
    runWriteAction("t", messages, { id, action: "a", db: d }, async () => {
      ran++;
      return { ok: true };
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(ran, 0);
});

test("the browser's wait is the Pi's attempt plus the Worker's own render", () => {
  assert.equal(WRITE_WAIT_MS, ORIGIN_ATTEMPT_MS + WORKER_FALLBACK_MS);
  assert.equal(WRITE_WAIT_MS, 30_000);
});

test("only a v4 uuid counts as a request id", () => {
  const form = new FormData();
  assert.equal(writeRequestIdFrom(form), null);
  form.set(WRITE_REQUEST_FIELD, "not-a-uuid");
  assert.equal(writeRequestIdFrom(form), null);
  form.set(WRITE_REQUEST_FIELD, id);
  assert.equal(writeRequestIdFrom(form), id);
});

test("the wrapped-write list matches real URLs, and holds the two unlisted addresses out", () => {
  assert.ok(isWrappedWritePath("/admin/units"));
  assert.ok(isWrappedWritePath("/residents/42/edit"));
  assert.ok(!isWrappedWritePath("/admin/unitsx"));
  for (const held of ["/admin/security", "/admin/security/verify"]) assert.ok(!isWrappedWritePath(held));
  assert.ok(isWrappedWritePath("/services/desexing"));
});

test("Next's own control-flow throws pass straight through, redirect included", async () => {
  const d = db({ status: "claimed" });
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/admin/units;303;" });
  await assert.rejects(
    () => runWriteAction("t", messages, { id, action: "a", db: d }, async () => { throw redirect; }),
    (e) => e === redirect,
  );
});
