// A release note tagged by card is for whoever holds one of its cards; every other case widens. No role name is used
// for a card note, because a shelter may call its roles anything.
import test from "node:test";
import assert from "node:assert/strict";
import { isNoteForReader } from "./release-audience.ts";
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

test("role-tagged history is unchanged, retired staff tag included", () => {
  assert.equal(isNoteForReader({ text: "x", roles: ["doctor"] }, login("doctor", false)), true);
  assert.equal(isNoteForReader({ text: "x", roles: ["doctor"] }, login("volunteer", false)), false);
  assert.equal(isNoteForReader({ text: "x", roles: ["staff"] }, login("volunteer", false)), false);
  assert.equal(isNoteForReader({ text: "x", roles: ["staff"] }, login("staff", false)), true);
  // a role the tags never heard of is widened, never read as another role
  assert.equal(isNoteForReader({ text: "x", roles: ["doctor"] }, login("kennel_lead", false)), true);
});
