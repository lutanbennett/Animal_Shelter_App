import test from "node:test";
import assert from "node:assert/strict";
import { cannotTellResult, guardWrite, isCannotTell } from "./write-unknown.ts";

function opts(log, agree = false) {
  return {
    cannotTell: () => cannotTellResult("first"),
    stillUnknown: () => cannotTellResult("still"),
    confirmReload: () => agree,
    reload: () => log.reloads++,
  };
}

test("the tag, not the words, says cannot tell", () => {
  assert.equal(isCannotTell(cannotTellResult("anything")), true);
  assert.equal(isCannotTell({ ok: false, error: "We couldn't tell whether that saved." }), false);
  assert.equal(isCannotTell(undefined), false);
});

test("a second press after cannot-tell sends nothing and offers a reload", async () => {
  const log = { reloads: 0, calls: 0 };
  const lock = { current: false };
  const call = async () => (log.calls++, cannotTellResult("server in flight"));
  await guardWrite(lock, call, opts(log));
  assert.equal(lock.current, true);
  const again = await guardWrite(lock, call, opts(log));
  assert.equal(log.calls, 1, "no request is sent on the second press");
  assert.equal(again.error, "still");
  assert.equal(log.reloads, 0, "declining the offer keeps what was typed");
  await guardWrite(lock, call, opts(log, true));
  assert.equal(log.reloads, 1);
});

test("a real answer leaves the lock off", async () => {
  const lock = { current: false };
  await guardWrite(lock, async () => ({ ok: true }), opts({ reloads: 0 }));
  assert.equal(lock.current, false);
});
