// The Add Shelter Photos card: a role given it draws the tile and can open the page; a role without the activity gets
// neither. The card grants photos.resident_add and nothing else (so never the Medical folder by itself).
import test from "node:test";
import assert from "node:assert/strict";
import { cardTilesFor } from "./tiles.ts";
import { bundleOfCards } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import { routeFor, canOpen } from "../permissions/routes.ts";
import en from "../i18n/dictionaries/en.ts";

const role = (permissions) =>
  parsePermissions({
    role: { key: "volunteer_like", name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    scopes: { residents: "all", clinical: "any", contacts: "all", photos: "all", sees_login_emails: false },
    permissions,
  });

test("a role holding the card gets the tile and may open the page", () => {
  const bundle = bundleOfCards(["add_photos"]);
  assert.deepEqual([...bundle.keys()], ["photos.resident_add"]);
  const perms = role(Object.fromEntries([...bundle].map(([a, l]) => [a, l === "edit" ? 2 : 1])));
  const tiles = cardTilesFor(["add_photos"], perms, en);
  assert.deepEqual(tiles.map((x) => [x.href, x.label]), [["/photos/add", "Add Shelter Photos"]]);
  assert.ok(canOpen(perms, routeFor("/photos/add")));
});

test("a role without the activity gets no tile and is refused the page", () => {
  const perms = role({});
  assert.deepEqual(cardTilesFor(["add_photos"], perms, en), []);
  assert.equal(canOpen(perms, routeFor("/photos/add")), false);
});
