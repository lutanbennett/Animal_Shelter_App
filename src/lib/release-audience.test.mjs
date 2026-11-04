// A release note tagged by card is for whoever holds one of its cards; every other case widens. No role name is used
// for a card note, because a shelter may call its roles anything.
import test from "node:test";
import assert from "node:assert/strict";
import { isNoteForReader, isNoteListed } from "./release-audience.ts";
import { bundleJson } from "./permissions/cards.ts";
import { parsePermissions } from "./permissions/can.ts";

const login = (roleKey, isAdmin, ...cards) =>
  parsePermissions({
    role: { key: roleKey, name: "Anything", name_th: null, home_path: null },
    is_admin: isAdmin,
    permissions: Object.fromEntries(bundleJson(cards).map((b) => [b.activity, b.level])),
  });
const weigher = login("any_name_a_shelter_picks", false, "record_weight");
const nobody = login("any_name_a_shelter_picks", false);
const admin = login("admin", true);

test("a card note is for a holder and not for someone without the card", () => {
  const note = { text: "x", cards: ["record_weight"] };
  assert.equal(isNoteForReader(note, weigher), true);
  assert.equal(isNoteForReader(note, login("r", false, "add_medical_photos")), false);
  assert.equal(isNoteForReader(note, nobody), false);
});

test("Admin sees every card note, holding no card", () => {
  assert.equal(isNoteForReader({ text: "x", cards: ["record_weight"] }, admin), true);
});

test("a card note whose cards nobody recognises is shown, not hidden", () => {
  assert.equal(isNoteForReader({ text: "x", cards: ["a_card_since_removed"] }, nobody), true);
  assert.equal(isNoteForReader({ text: "x", cards: [] }, nobody), true);
});

test("an untagged note is everyone's, and so is any note for a non-app reader", () => {
  assert.equal(isNoteForReader("plain", nobody), true);
  assert.equal(isNoteForReader({ text: "x", cards: ["record_weight"] }, null), true);
});

test("an admin note is for Admin and nobody else, holding no card, under every view", () => {
  const note = { text: "x", admin: true };
  assert.equal(isNoteForReader(note, admin), true);
  assert.equal(isNoteListed(note, admin), true);
  for (const p of [weigher, nobody, null, undefined]) {
    assert.equal(isNoteForReader(note, p), false);
    assert.equal(isNoteListed(note, p), false);
  }
  // every other shape is always listed
  assert.equal(isNoteListed("plain", nobody), true);
  assert.equal(isNoteListed({ text: "x", cards: ["record_weight"] }, nobody), true);
});

test("converted history: untagged is everyone's, and no role name is read anywhere", () => {
  // Role-tagged history was converted to admin: true (admin-only) or untagged; a login's role key changes nothing.
  for (const key of ["doctor", "volunteer", "kennel_lead", "any_name_a_shelter_picks"]) {
    assert.equal(isNoteForReader("history line", login(key, false)), true);
    assert.equal(isNoteForReader({ text: "x", admin: true }, login(key, false)), false);
  }
});
