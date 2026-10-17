// Add Shelter Photos: the card grants photos.shelter_add and the who-and-where read and NOTHING else (never
// photos.resident_publish, which is what puts a photo on the website), and "Shelter only" is a property of the login:
// photoCategoriesFor() gives Management all four folders, the Head of Medical Medical, a volunteer Shelter alone.
// The three rows are the ones PR #697 broke (docs/decisions/2026-10-17-add-shelter-photos-card.md).
import test from "node:test";
import assert from "node:assert/strict";
import { cardTilesFor } from "./tiles.ts";
import { bundleOfCards } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import { routeFor, canOpen } from "../permissions/routes.ts";
import { photoCategoriesFor } from "../google/drive-client.ts";
import en from "../i18n/dictionaries/en.ts";

const role = (permissions, clinical = "any") =>
  parsePermissions({
    role: { key: "volunteer_like", name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    scopes: { residents: "all", clinical, contacts: "all", photos: "all", sees_login_emails: false },
    permissions,
  });

test("the card's bundle is shelter_add and the who-and-where read, and never the right to publish", () => {
  const bundle = bundleOfCards(["add_photos"]);
  assert.deepEqual([...bundle.keys()].sort(), ["photos.shelter_add", "resident.record"]);
  assert.equal(bundle.has("photos.resident_publish"), false);
  assert.equal(bundle.has("photos.resident_add"), false);
});

test("a role holding the card gets the tile and may open the page", () => {
  const bundle = bundleOfCards(["add_photos"]);
  const perms = role(Object.fromEntries([...bundle].map(([a, l]) => [a, l === "edit" ? 2 : 1])));
  const tiles = cardTilesFor(["add_photos"], perms, en);
  assert.deepEqual(tiles.map((x) => [x.href, x.label]), [["/photos/add", "Add Shelter Photos"]]);
  assert.ok(canOpen(perms, routeFor("/photos/add")));
});

test("a role without either activity gets no tile and is refused the page", () => {
  const perms = role({});
  assert.deepEqual(cardTilesFor(["add_photos"], perms, en), []);
  assert.equal(canOpen(perms, routeFor("/photos/add")), false);
});

test("folders follow the login: Management keeps four, Head of Medical keeps Medical, a volunteer gets Shelter only", () => {
  const management = role({ "photos.resident_add": 2, "photos.resident_publish": 2 });
  assert.deepEqual([...photoCategoriesFor(management)], ["Shelter", "Medical", "Foster", "Adoption"]);

  const headOfMedical = role({ "photos.resident_add": 2 });
  assert.deepEqual([...photoCategoriesFor(headOfMedical)], ["Medical"]);

  const volunteer = role({ "photos.shelter_add": 2 });
  assert.deepEqual([...photoCategoriesFor(volunteer)], ["Shelter"]);

  // Holding the card never narrows a login that may publish.
  const managementWithCard = role({ "photos.resident_add": 2, "photos.resident_publish": 2, "photos.shelter_add": 2 });
  assert.equal(photoCategoriesFor(managementWithCard).length, 4);
  // Nothing at all: the old answer, so no page is silently opened.
  assert.deepEqual([...photoCategoriesFor(role({}))], ["Medical"]);
});
