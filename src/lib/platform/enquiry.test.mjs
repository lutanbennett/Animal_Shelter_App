import test from "node:test";
import assert from "node:assert/strict";
import { answerForInsert, cleanEnquiry, makeThrottle, ENQUIRY_THANKS } from "./enquiry.ts";

const ok = { shelterName: " A ", contactName: "B", email: " a@b.co ", phone: "", location: "", message: "" };

test("success and duplicate give the same visible answer", () => {
  assert.deepEqual(answerForInsert(null).answer, answerForInsert("23505").answer);
  assert.equal(answerForInsert("23505").answer, ENQUIRY_THANKS);
  assert.equal(answerForInsert("23514").answer, ENQUIRY_THANKS);
  assert.equal(answerForInsert("XX000").answer, ENQUIRY_THANKS);
  assert.equal(answerForInsert("23505").log, "none");
  assert.equal(answerForInsert("23514").log, "drift");
});

test("validation trims and names only the visitor's own field", () => {
  const r = cleanEnquiry(ok);
  assert.equal(r.ok, true);
  assert.equal(r.row.email, "a@b.co");
  assert.deepEqual(cleanEnquiry({ ...ok, shelterName: "  " }), { ok: false, problem: "shelterName" });
  assert.deepEqual(cleanEnquiry({ ...ok, email: "nope" }), { ok: false, problem: "email" });
  assert.deepEqual(cleanEnquiry({ ...ok, message: "x".repeat(4001) }), { ok: false, problem: "message" });
  assert.deepEqual(cleanEnquiry({ ...ok, phone: "1".repeat(61) }), { ok: false, problem: "phone" });
});

test("the throttle refuses the sixth try in a window and forgives afterwards", () => {
  let t = 0;
  const allow = makeThrottle(5, 1000, () => t);
  for (let i = 0; i < 5; i++) assert.equal(allow("ip"), true);
  assert.equal(allow("ip"), false);
  assert.equal(allow("other"), true);
  t = 2000;
  assert.equal(allow("ip"), true);
});
