// A role's home is exactly its cards (and groups): nothing is added by code (Lutan, 2026-10-23). Adding a page under /operations or
// /management, or giving a role cells that open one, must never add a tile. My tasks is a card; Operations and Management are groupings.
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

test("Operations and Management are groupings, not cards (0268)", () => {
  assert.ok(!("operations_landing" in CARDS));
  assert.ok(!("management_landing" in CARDS));
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

