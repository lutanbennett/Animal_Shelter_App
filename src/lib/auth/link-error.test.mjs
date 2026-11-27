import test from "node:test";
import assert from "node:assert/strict";
import { linkErrorFromHash } from "./link-error.ts";

test("the fragment seen live on production reads as a spent link", () => {
  assert.equal(
    linkErrorFromHash("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"),
    "used",
  );
});

test("no fragment, or one without an error, is not a link error", () => {
  assert.equal(linkErrorFromHash(""), null);
  assert.equal(linkErrorFromHash("#section"), null);
});

test("an unknown code gets the generic line and the description is ignored", () => {
  assert.equal(linkErrorFromHash("#error=server_error&error_code=something_new&error_description=<b>call+us</b>"), "failed");
  assert.equal(linkErrorFromHash("#error=access_denied"), "failed");
});
