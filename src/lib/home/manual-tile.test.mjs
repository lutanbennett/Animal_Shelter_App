// The user manual's home tile (#ce6ec, Lutan 2026-11-08: a tile, not a card). Every home carries it, whatever the home is
// built from and whether or not counts are passed, exactly once, and no card opens the manual, so nothing can veto it.
import test from "node:test";
import assert from "node:assert/strict";
import { MANUAL_HREF, PASSWORD_HREF, RELEASES_HREF, hasJobTiles, homeGroupsForRoles, homeTilesFor, homeTilesForRoles } from "./tiles.ts";
import { CARDS, bundleOfCards } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import en from "../i18n/dictionaries/en.ts";
import th from "../i18n/dictionaries/th.ts";

const as = (permissions, roles = ["custom_x"]) =>
  parsePermissions({
    role: { key: roles[0], name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null },
    roles,
    is_admin: false,
    permissions,
  });
const manuals = (tiles) => tiles.filter((x) => x.href === MANUAL_HREF).length;

test("no card opens the manual: it is a tile, not something a role can lack", () => {
  assert.ok(Object.values(CARDS).every((c) => c.opens !== MANUAL_HREF));
});

test("a home built from cards has it, with and without counts", () => {
  const perms = as({ "resident.record": 1 });
  assert.equal(manuals(homeTilesFor(perms, en, 0, ["view_residents"])), 1);
  assert.equal(manuals(homeTilesFor(perms, en, 0, ["view_residents"], { my: 2, photosWaiting: 1 })), 1);
});

test("a derived home (no cards) has it, and so does a role holding nothing", () => {
  assert.equal(manuals(homeTilesFor(as({ "resident.record": 1 }), en)), 1);
  const none = homeTilesFor(as({}), en);
  assert.deepEqual(none.map((x) => x.href), [MANUAL_HREF, RELEASES_HREF, PASSWORD_HREF]);
  assert.equal(hasJobTiles(none), false, "a home with only the manual still reads as a role with no jobs");
});

test("it closes the home (with the two below), labelled from the dictionary in both languages", () => {
  const tiles = homeTilesFor(as({ "resident.record": 1 }), th, 0, ["view_residents"]);
  assert.deepEqual(tiles.at(-3), { ...tiles.at(-3), href: MANUAL_HREF, label: th.nav.manual });
  assert.equal(homeTilesFor(as({}), en).at(-3).label, en.nav.manual);
});

test("a login with two roles has it once when merged and in every group when grouped", () => {
  const cells = Object.fromEntries([...bundleOfCards(["add_photos", "contacts"])].map(([a, l]) => [a, l === "edit" ? 2 : 1]));
  const perms = as(cells, ["main", "cover"]);
  const byRole = { main: ["add_photos"], cover: ["add_photos", "contacts"] };
  assert.equal(manuals(homeTilesForRoles(perms, en, undefined, byRole)), 1);
  const groups = homeGroupsForRoles(perms, en, undefined, byRole);
  assert.ok(groups.length > 1);
  for (const g of groups) assert.equal(manuals(g.tiles), 1, g.roleKey);
});
