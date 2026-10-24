import test from "node:test";
import assert from "node:assert/strict";
import { buildCardGrants, includedBy } from "./card-grants.ts";

const grants = buildCardGrants(
  [
    { card: "residents", activity: "resident.record", level: 2 },
    { card: "view_residents", activity: "resident.record", level: 1 },
    { card: "residents", activity: "not.an.activity", level: 2 },
    { card: "not_a_card", activity: "resident.record", level: 1 },
  ],
  [
    { card: "residents", included_card: "view_residents" },
    { card: "medical_records", included_card: "residents" },
    { card: "nope", included_card: "residents" },
  ],
);

test("levels 1 and 2 read as read and edit, and rows this build does not know are left out", () => {
  assert.deepEqual(grants.own.get("residents"), [{ activity: "resident.record", level: "edit" }]);
  assert.deepEqual(grants.own.get("view_residents"), [{ activity: "resident.record", level: "read" }]);
  assert.equal(grants.own.has("not_a_card"), false);
});

test("includes are followed transitively and never include the card itself", () => {
  assert.deepEqual(includedBy(grants, "medical_records").sort(), ["residents", "view_residents"]);
  assert.deepEqual(includedBy(grants, "view_residents"), []);
});
