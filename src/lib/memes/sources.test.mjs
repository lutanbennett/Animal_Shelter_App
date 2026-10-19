import test from "node:test";
import assert from "node:assert/strict";
import { sourcesFor, checkSourceAttachments, isSourceKind } from "./sources.ts";

const perms = (cells, isAdmin = false) => ({ isAdmin, cells, roles: [], role: { key: "x" }, scopes: {} });

// Written first: the new sources must never widen what a person can see, and Medical must never become one.

test("a source is offered only to a login that may open its page", () => {
  assert.deepEqual(sourcesFor(perms({})), ["resident", "upload"]);
  assert.deepEqual(sourcesFor(perms({ "community.outings": 1 })), ["resident", "outing", "upload"]);
  assert.deepEqual(sourcesFor(perms({ "maintenance.jobs": 1 })), ["resident", "maintenance", "upload"]);
  assert.deepEqual(sourcesFor(perms({ "projects.folders": 1 })), ["resident", "project", "upload"]);
  assert.deepEqual(sourcesFor(perms({ "website.content": 2 })), ["resident", "website", "upload"]);
});

test("website photos need Edit on the website, not just Read", () => {
  assert.ok(!sourcesFor(perms({ "website.content": 1 })).includes("website"));
});

test("an admin is offered every source", () => {
  assert.equal(sourcesFor(perms({}, true)).length, 6);
});

test("a file that is also a Medical photo is refused, from any source", () => {
  for (const kind of ["outing", "maintenance", "project", "website"]) {
    assert.deepEqual(checkSourceAttachments(kind, [{ owner_type: "resident", sub_folder: "Medical" }]), { ok: false });
    assert.deepEqual(checkSourceAttachments(kind, [{ owner_type: "resident", sub_folder: " medical " }]), { ok: false });
  }
});

test("a file that is also a blood test, procedure or visit attachment is refused", () => {
  for (const t of ["blood_test", "procedure", "clinic_visit", "maintenance_bill"]) {
    assert.deepEqual(checkSourceAttachments("project", [{ owner_type: "project", sub_folder: null }, { owner_type: t, sub_folder: null }]), { ok: false });
  }
});

test("an outreach or website photo is refused if it is also any attachment", () => {
  assert.deepEqual(checkSourceAttachments("outing", [{ owner_type: "project", sub_folder: null }]), { ok: false });
  assert.deepEqual(checkSourceAttachments("website", [{ owner_type: "resident", sub_folder: "Shelter" }]), { ok: false });
});

test("a plain maintenance or project photo, or a file with no attachment rows, passes", () => {
  assert.deepEqual(checkSourceAttachments("maintenance", [{ owner_type: "maintenance", sub_folder: null }]), { ok: true });
  assert.deepEqual(checkSourceAttachments("project", [{ owner_type: "project", sub_folder: null }]), { ok: true });
  assert.deepEqual(checkSourceAttachments("outing", []), { ok: true });
});

test("only the six kinds are recognised", () => {
  assert.ok(isSourceKind("outing"));
  assert.ok(!isSourceKind("medical"));
  assert.ok(!isSourceKind(null));
});
