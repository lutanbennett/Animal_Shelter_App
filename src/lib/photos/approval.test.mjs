// Photos to approve: the tile and the page belong to the activity photos.resident_publish, never to a role's key, and
// a login that may not publish is given neither (docs/decisions/2026-10-17-photo-approval-queue.md).
import test from "node:test";
import assert from "node:assert/strict";
import { homeTilesFor } from "../home/tiles.ts";
import { parsePermissions } from "../permissions/can.ts";
import { routeFor, canOpen } from "../permissions/routes.ts";
import en from "../i18n/dictionaries/en.ts";
import th from "../i18n/dictionaries/th.ts";

const role = (permissions, key = "any_role") =>
  parsePermissions({
    role: { key, name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    scopes: { residents: "all", clinical: "any", contacts: "all", photos: "all", sees_login_emails: false },
    permissions,
  });

test("the page opens for the activity and for nothing else", () => {
  const route = routeFor("/photos/approve");
  assert.ok(route);
  assert.equal(canOpen(role({ "photos.resident_publish": 2 }), route), true);
  assert.equal(canOpen(role({ "photos.shelter_add": 2, "photos.resident_add": 2 }), route), false);
  assert.equal(canOpen(role({}), route), false);
});

test("a login that may publish gets the tile with the count, whatever its role is called", () => {
  const perms = role({ "photos.resident_publish": 2 }, "a_role_nobody_has_heard_of");
  const tiles = homeTilesFor(perms, en, undefined, undefined, { photosWaiting: 3 });
  const tile = tiles.find((x) => x.href === "/photos/approve");
  assert.ok(tile);
  assert.equal(tile.label, "Photos to approve");
  assert.equal(tile.badge, "3 waiting");
});

test("with nothing waiting the tile is still there, with no number", () => {
  const tiles = homeTilesFor(role({ "photos.resident_publish": 2 }), en, undefined, undefined, { photosWaiting: 0 });
  const tile = tiles.find((x) => x.href === "/photos/approve");
  assert.ok(tile);
  assert.equal(tile.badge, undefined);
});

test("a login that may not publish gets no tile, even if a count is passed", () => {
  const perms = role({ "photos.shelter_add": 2 });
  assert.equal(homeTilesFor(perms, en, undefined, undefined, { photosWaiting: undefined }).some((x) => x.href === "/photos/approve"), false);
});

test("both dictionaries carry every string, with Thai counting too", () => {
  assert.deepEqual(Object.keys(th.photoApproval).sort(), Object.keys(en.photoApproval).sort());
  assert.equal(th.photoApproval.tileWaiting(3), "รอ 3 รูป");
});
