import { test } from "node:test";
import assert from "node:assert/strict";
import { taggedNoteTexts, untaggedAdminNotes } from "./lib/release-note-tags.mjs";

// check-test-plan.mjs warned that an `admin: true` note was untagged (#kvg7d): it knew the tag
// shapes `cards` and `roles` only. Admin holds no card, so `admin: true` is a third state.
const ADMIN = "Settings → System status now shows the build.";
const block = (tail) => `\n  { text: "${ADMIN}", ${tail} },\n`;

test("an admin: true note naming an admin-only place is addressed", () => {
  assert.deepEqual(untaggedAdminNotes([ADMIN], block("admin: true")), []);
  assert.ok(taggedNoteTexts(block("admin: true")).has(ADMIN));
});

test("the existing tag shapes still count", () => {
  assert.deepEqual(untaggedAdminNotes([ADMIN], block('cards: ["x"]')), []);
  assert.deepEqual(untaggedAdminNotes([ADMIN], block('roles: ["admin"]')), []);
});

test("a plainly worded admin note is still warned about", () => {
  assert.deepEqual(untaggedAdminNotes([ADMIN], `\n  "${ADMIN}",\n`), [ADMIN]);
  assert.deepEqual(untaggedAdminNotes([ADMIN], `\n  { text: "${ADMIN}" },\n`), [ADMIN]);
});

test("admin: false (or a lookalike key) is not the third state", () => {
  assert.deepEqual(untaggedAdminNotes([ADMIN], block("admin: false")), [ADMIN]);
  assert.deepEqual(untaggedAdminNotes([ADMIN], block("administrator: true")), [ADMIN]);
});

test("the tag belongs to its own note, not a neighbour's", () => {
  const other = "Something else.";
  const b = `\n  { text: "${other}", admin: true },\n  "${ADMIN}",\n`;
  assert.deepEqual(untaggedAdminNotes([ADMIN], b), [ADMIN]);
});
