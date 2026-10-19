// Approve photos: the card grants EXACTLY three cells and no others. This is the screen where a resident's picture is cleared
// for the public website, so an over-wide bundle would quietly let a role edit the record or publish more than approving.
import test from "node:test";
import assert from "node:assert/strict";
import { cardTilesFor } from "./tiles.ts";
import { bundleOfCards, bundleJson, CARDS, CARD_SATISFIED_BY } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import { routeFor, canOpen } from "../permissions/routes.ts";
import en from "../i18n/dictionaries/en.ts";

const role = (permissions) =>
  parsePermissions({
    role: { key: "approver_like", name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    scopes: { residents: "all", clinical: "any", contacts: "all", photos: "all", sees_login_emails: false },
    permissions,
  });

test("the bundle is exactly publish, manage and the who-and-where read, at those levels", () => {
  const b = bundleOfCards(["approve_photos"]);
  assert.deepEqual(
    [...b].sort(([x], [y]) => x.localeCompare(y)),
    [["photos.approve", "edit"], ["photos.resident_manage", "edit"], ["resident.record", "read"]],
  );
  assert.deepEqual(bundleJson(["approve_photos"]).map((e) => e.level).sort(), [1, 2, 2]);
});

test("nothing that edits a resident, adds a photo or moves an animal rides along", () => {
  const b = bundleOfCards(["approve_photos"]);
  for (const a of ["photos.resident_add", "photos.shelter_add", "placement.move", "placement.rehome", "placement.death", "resident.register", "medical.visits"]) {
    assert.equal(b.has(a), false, a);
  }
  assert.equal(b.get("resident.record"), "read");
});

test("it opens /photos/approve, includes nothing, and is what Add resident photos waits on", () => {
  assert.equal(CARDS.approve_photos.opens, "/photos/approve");
  assert.deepEqual(CARDS.approve_photos.includes, []);
  assert.deepEqual(CARDS.add_photos.requiresCardSomewhere, ["approve_photos"]);
  assert.deepEqual([...CARD_SATISFIED_BY.approve_photos].sort(), ["approve_photos"]);
  assert.equal(bundleOfCards(["residents"]).has("photos.approve"), false);
  for (const [k, c] of Object.entries(CARDS)) assert.equal(k === "approve_photos", bundleOfCards([k]).has("photos.approve"), k + " bundles photos.approve");
});

test("a role holding the card gets its tile and may open the page; a role without the cells gets neither", () => {
  const perms = role(Object.fromEntries([...bundleOfCards(["approve_photos"])].map(([a, l]) => [a, l === "edit" ? 2 : 1])));
  assert.deepEqual(cardTilesFor(["approve_photos"], perms, en).map((x) => [x.href, x.label]), [["/photos/approve", "Approve photos"]]);
  assert.ok(canOpen(perms, routeFor("/photos/approve")));
  assert.deepEqual(cardTilesFor(["approve_photos"], role({}), en), []);
});
