import test from "node:test";
import assert from "node:assert/strict";
import { forcedTagFailureCode } from "./force-tag-failure.ts";

test("forces a failure only on dev, and only for the two named values", () => {
  assert.equal(forcedTagFailureCode({ NODE_ENV: "development", ASSISTANT_FORCE_TAG_FAILURE: "denied" }), "42501");
  assert.equal(forcedTagFailureCode({ NODE_ENV: "development", ASSISTANT_FORCE_TAG_FAILURE: " Failed " }), "XX000");
  assert.equal(forcedTagFailureCode({ NODE_ENV: "development", ASSISTANT_FORCE_TAG_FAILURE: "1" }), null);
  assert.equal(forcedTagFailureCode({ NODE_ENV: "development" }), null);
});

test("does nothing in any deployed build", () => {
  assert.equal(forcedTagFailureCode({ NODE_ENV: "production", ASSISTANT_FORCE_TAG_FAILURE: "denied" }), null);
  assert.equal(forcedTagFailureCode({ NODE_ENV: "test", ASSISTANT_FORCE_TAG_FAILURE: "failed" }), null);
  assert.equal(forcedTagFailureCode({ ASSISTANT_FORCE_TAG_FAILURE: "failed" }), null);
});
