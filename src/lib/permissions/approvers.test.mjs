import test from "node:test";
import assert from "node:assert/strict";
import { approverNames, needsApprover } from "./approvers.ts";

const cell = (roleKey, o = {}) => ({ roleKey, roleName: roleKey, archived: false, activity: "photos.approve", level: 2, ...o });

test("a live non-Admin role holding the activity approves", () => {
  assert.deepEqual(approverNames([cell("management")]), ["management"]);
});
test("a retired role does not, whatever its key", () => {
  assert.deepEqual(approverNames([cell("staff", { archived: true }), cell("renamed_old", { archived: true })]), []);
  assert.deepEqual(approverNames([cell("staff", { archived: true }), cell("management")]), ["management"]);
});
test("Admin, a level of 0, another activity and a repeat do not add one", () => {
  assert.deepEqual(approverNames([cell("admin"), cell("a", { level: 0 }), cell("b", { activity: "photos.resident_add" }), cell("m"), cell("m")]), ["m"]);
});
test("only Add resident photos needs an approver", () => {
  assert.equal(needsApprover("add_photos"), true);
  assert.equal(needsApprover("approve_photos"), false);
  assert.equal(needsApprover("residents"), false);
});
