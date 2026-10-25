// A role's home is exactly its cards (and groups): nothing is added by code (Lutan, 2026-10-23). Adding a page under /operations or
// /management, or giving a role cells that open one, must never add a tile. Operations, Management and My tasks are cards.
import test from "node:test";
import assert from "node:assert/strict";
import { homeTilesFor } from "./tiles.ts";
import { bundleOfCards, CARDS } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import en from "../i18n/dictionaries/en.ts";

const role = (permissions, key = "custom_x") =>
  parsePermissions({
    role: { key, name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    permissions,
  });
const hrefs = (tiles) => tiles.map((x) => x.href);
// Cells that open pages in Operations, Management and My tasks all at once.
const wide = { "resident.record": 1, "recurring.manage": 2, "recurring.do_any": 2, "recurring.do_own": 2, "medical.prescriptions": 1, "medical.diet": 1, "contact.directory": 1 };

test("the My tasks card grants recurring.do_own and nothing else", () => {
  assert.deepEqual([...bundleOfCards(["my_tasks"])], [["recurring.do_own", "edit"]]);
  assert.equal(CARDS.my_tasks.opens, "/my");
});

test("the landing cards grant nothing", () => {
  assert.deepEqual([...bundleOfCards(["operations_landing", "management_landing"])], []);
});

test("a role's home is exactly its cards, however wide its cells are", () => {
  const perms = role(wide);
  assert.deepEqual(hrefs(homeTilesFor(perms, en, 0, ["view_residents"])), ["/residents"]);
});

test("a ruled role key gets no card it was not given", () => {
  for (const key of ["management", "second_in_command", "head_of_medical", "head_of_maintenance"]) {
    assert.deepEqual(hrefs(homeTilesFor(role(wide, key), en, 0, ["view_residents"])), ["/residents"], key);
  }
});

test("holding recurring.do_own draws My tasks only when the card is given", () => {
  const perms = role(wide);
  assert.ok(!hrefs(homeTilesFor(perms, en, 0, ["view_residents"])).includes("/my"));
  const tiles = homeTilesFor(perms, en, 0, ["view_residents", "my_tasks"], { my: 3 });
  assert.equal(tiles.filter((x) => x.href === "/my").length, 1);
  assert.equal(tiles.find((x) => x.href === "/my").badge, en.my.navBadge(3));
});

test("the Operations and Management cards draw a tile only for a role that opens a page there", () => {
  const cards = ["view_residents", "operations_landing", "management_landing"];
  assert.deepEqual(hrefs(homeTilesFor(role(wide), en, 0, cards)), ["/residents", "/operations", "/management"]);
  assert.deepEqual(hrefs(homeTilesFor(role({ "resident.record": 1 }), en, 0, cards)), ["/residents"]);
});

test("taking the card away takes the tile away", () => {
  assert.ok(!hrefs(homeTilesFor(role(wide), en, 0, ["view_residents"])).includes("/operations"));
});
