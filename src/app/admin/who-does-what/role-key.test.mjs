import { test } from "node:test";
import assert from "node:assert/strict";
import { roleKeyFromName, RESERVED_ROLE_KEYS } from "./role-key.ts";

test("a name becomes a key the roles table accepts", () => {
  assert.equal(roleKeyFromName("Night Carer"), "night_carer");
  assert.equal(roleKeyFromName("  Vet & Nurse (part-time) "), "vet_nurse_part_time");
  assert.equal(roleKeyFromName("2nd Shift"), "role_2nd_shift");
  for (const n of ["Night Carer", "2nd Shift", "A"]) assert.match(roleKeyFromName(n), /^[a-z][a-z0-9_]*$/);
});
test("a name with no English letter or digit gives no key", () => {
  assert.equal(roleKeyFromName("ผู้ช่วย"), "");
  assert.equal(roleKeyFromName("   "), "");
});
test("reserved keys are named", () => {
  assert.equal(roleKeyFromName("Admin"), "admin");
  assert.ok(RESERVED_ROLE_KEYS.includes("admin"));
});
