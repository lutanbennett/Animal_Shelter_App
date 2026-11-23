import test from "node:test";
import assert from "node:assert/strict";
import { liveReconnectAction } from "./shelter-drive-decide.ts";

// Stands in for: a live shelter whose recorded folder lives in account A, reconnected with a token for account B (cannot open it).
test("a recorded folder the new token cannot open is refused, never replaced", () => {
  assert.equal(liveReconnectAction("folderInAccountA", false), "refuse");
});
test("a recorded folder the token can open is reused", () => {
  assert.equal(liveReconnectAction("folderInAccountA", true), "reuse");
});
test("only a shelter with no folder recorded gets a new one", () => {
  assert.equal(liveReconnectAction(null, false), "make");
  assert.equal(liveReconnectAction("  ", false), "make");
});
