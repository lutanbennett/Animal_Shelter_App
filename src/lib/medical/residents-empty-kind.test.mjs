import test from "node:test";
import assert from "node:assert/strict";
import { residentsEmptyKind } from "./residents.ts";

const login = (cells) => ({ role: { key: "x", name: "x" }, roles: ["x"], isAdmin: false, cells });

test("residents on the list: nothing to explain", () => {
  assert.equal(residentsEmptyKind(login({}), 3, null), null);
});
test("empty, and a card lets the login read who residents are: none on file", () => {
  assert.equal(residentsEmptyKind(login({ "resident.who_and_where": 1 }), 0, null), "none");
  assert.equal(residentsEmptyKind(login({ "resident.record": 1 }), 0, null), "none");
});
test("empty and no such card: the login cannot see them", () => {
  assert.equal(residentsEmptyKind(login({ "photos.shelter_add": 2 }), 0, null), "cannot");
  assert.equal(residentsEmptyKind(null, 0, null), "cannot");
});
test("empty because the read failed is never claimed as none on file", () => {
  assert.equal(residentsEmptyKind(login({ "resident.record": 2 }), 0, "boom"), "cannot");
});
test("Admin, with the list empty, is none on file", () => {
  assert.equal(residentsEmptyKind({ ...login({}), isAdmin: true }, 0, null), "none");
});
