// The invoice-kind dropdown is derived from the login's cards (kindsFor), the way photoCategoriesFor does for photos, and a
// kind the code does not know gets the plain form, never a named kind's (docs/decisions/2026-11-03-bills-interface-half.md).
import test from "node:test";
import assert from "node:assert/strict";
import { kindsFor, tailoringOf, keyFromLabel } from "./kinds.ts";
import { canUseBills } from "./access.ts";
import { parsePermissions } from "../permissions/can.ts";

const perms = (permissions, isAdmin = false) =>
  parsePermissions({ role: { key: "x", name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null }, is_admin: isAdmin, permissions });

const k = (key, parentId = null, id = key, archived = false) => ({ id, key, label: key, parentId, sort: 1, archived });
const all = [
  k("vet_appointment"), k("food"), k("medicine"), k("maintenance"), k("materials"), k("cleaning_products"),
  k("utilities"), k("utility_water", "utilities"), k("other"), k("annual_fees"), k("archived_one", null, "a", true),
];
const keys = (p) => kindsFor(p, all).map((x) => x.key);

test("a login holding only bills.general is offered materials, cleaning products, Other and unknown kinds", () => {
  assert.deepEqual(keys(perms({ "bills.general": 2 })), ["materials", "cleaning_products", "other", "annual_fees"]);
});

test("a login holding only bills.utilities is offered Utilities and its types, nothing else", () => {
  assert.deepEqual(keys(perms({ "bills.utilities": 2 })), ["utilities", "utility_water"]);
});

test("a login holding neither new bill card, nor any older one, is offered no kind at all", () => {
  assert.deepEqual(keys(perms({ "bills.sites": 2 })), []);
  assert.deepEqual(keys(perms({})), []);
  assert.deepEqual(keys(null), []);
});

test("bills.sites alone does not open the inbox, and bills.general or bills.utilities do", () => {
  assert.equal(canUseBills(perms({ "bills.sites": 2 })), false);
  assert.equal(canUseBills(perms({ "bills.general": 2 })), true);
  assert.equal(canUseBills(perms({ "bills.utilities": 2 })), true);
});

test("Admin is offered every kind that is not archived", () => {
  assert.equal(keys(perms({}, true)).length, all.length - 1);
});

test("Other and an unknown kind get the plain form; a child inherits its parent's", () => {
  const plain = { route: "general", premises: false, account: false };
  assert.deepEqual(tailoringOf(all.find((x) => x.key === "other"), all), plain);
  assert.deepEqual(tailoringOf(all.find((x) => x.key === "annual_fees"), all), plain);
  assert.equal(tailoringOf(all.find((x) => x.key === "utility_water"), all).route, "utility");
  assert.equal(tailoringOf(all.find((x) => x.key === "utility_water"), all).premises, true);
});

test("a kind added in settings gets a valid key", () => {
  assert.match(keyFromLabel("Domain renewal"), /^[a-z][a-z0-9_]*$/);
  assert.match(keyFromLabel("2026 fees"), /^[a-z][a-z0-9_]*$/);
  assert.match(keyFromLabel("ค่าธรรมเนียม"), /^[a-z][a-z0-9_]*$/);
});
