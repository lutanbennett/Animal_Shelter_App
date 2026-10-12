import test from "node:test";
import assert from "node:assert/strict";
import { can, parsePermissions } from "./can.ts";

const person = (cells, isAdmin = false) => ({
  role: { key: "x", name: "X", nameTh: null, opensApp: true, homePath: null },
  isAdmin,
  scopes: { residents: "all", clinical: "any", contacts: "full", photos: "all", seesLoginEmails: false },
  cells,
});

test("no permissions at all is no, never yes and never a throw", () => {
  assert.equal(can(null, "resident.register"), false);
  assert.equal(can(undefined, "resident.register"), false);
});

test("a missing cell is no", () => {
  assert.equal(can(person({}), "resident.register"), false);
  assert.equal(can(person({}), "resident.record", "read"), false);
});

test("a yes/no activity needs cell 2", () => {
  assert.equal(can(person({ "resident.register": 2 }), "resident.register"), true);
  assert.equal(can(person({ "resident.register": 1 }), "resident.register"), false);
});

test("read access never grants edit; edit grants read", () => {
  const reader = person({ "resident.record": 1 });
  assert.equal(can(reader, "resident.record", "read"), true);
  assert.equal(can(reader, "resident.record", "edit"), false);
  assert.equal(can(reader, "resident.record"), false, "the default level is edit");
  const editor = person({ "resident.record": 2 });
  assert.equal(can(editor, "resident.record", "read"), true);
  assert.equal(can(editor, "resident.record", "edit"), true);
});

test("an unknown activity key is no, even for Admin", () => {
  assert.equal(can(person({}, true), "resident.nonsense"), false);
  assert.equal(can(person({ "resident.nonsense": 2 }), "resident.nonsense"), false);
  assert.equal(can(person({}, true), ""), false);
  assert.equal(can(person({}, true), "__proto__"), false);
});

test("an unknown level is no, even for Admin", () => {
  assert.equal(can(person({ "resident.record": 2 }), "resident.record", "write"), false);
  assert.equal(can(person({}, true), "resident.record", "write"), false);
  assert.equal(can(person({ "resident.record": 2 }), "resident.record", ""), false);
});

test("Admin is yes for every known activity at every level, with no cells", () => {
  const admin = person({}, true);
  assert.equal(can(admin, "resident.register"), true);
  assert.equal(can(admin, "resident.record", "read"), true);
  assert.equal(can(admin, "resident.record", "edit"), true);
});

test("parsePermissions: anything that is not the expected object is null", () => {
  for (const bad of [null, undefined, "", "x", 0, 1, true, {}, { role: null }, { role: {} }, { role: { key: "a" } }, { role: { key: 1, name: "n" } }]) {
    assert.equal(parsePermissions(bad), null, JSON.stringify(bad));
  }
});

test("parsePermissions: only exactly 1 or 2 on a known key survives", () => {
  const p = parsePermissions({
    role: { key: "vet", name: "Vet" },
    permissions: {
      "resident.record": 2,
      "resident.register": 1,
      "resident.microchip": 0,
      "placement.move": 3,
      "placement.hospital": "2",
      "placement.rehome": true,
      "placement.death": null,
      "made.up.key": 2,
    },
  });
  assert.deepEqual(p.cells, { "resident.record": 2, "resident.register": 1 });
});

test("parsePermissions: is_admin is true only for literal true", () => {
  const base = { role: { key: "a", name: "A" } };
  assert.equal(parsePermissions({ ...base, is_admin: true }).isAdmin, true);
  for (const v of ["true", 1, "yes", null, undefined]) {
    assert.equal(parsePermissions({ ...base, is_admin: v }).isAdmin, false, String(v));
  }
});

test("parsePermissions: sees_login_emails and opens_app are true only for literal true", () => {
  const p = parsePermissions({ role: { key: "a", name: "A", opens_app: "true" }, scopes: { sees_login_emails: 1 } });
  assert.equal(p.role.opensApp, false);
  assert.equal(p.scopes.seesLoginEmails, false);
});
