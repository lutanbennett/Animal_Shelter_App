// My tasks, Operations and Management on a card home (menu-removal orphans 1 of 6): drawn for a role that may open them,
// never for one that may not, never twice, and My tasks carries the open-task count.
import test from "node:test";
import assert from "node:assert/strict";
import { homeTilesFor } from "./tiles.ts";
import { bundleOfCards, CARDS } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import en from "../i18n/dictionaries/en.ts";

const role = (permissions) =>
  parsePermissions({
    role: { key: "custom_x", name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    scopes: { residents: "all", clinical: "any", contacts: "all", photos: "all", sees_login_emails: false },
    permissions,
  });
const hrefs = (tiles) => tiles.map((x) => x.href);

test("the My tasks card grants recurring.do_own and nothing else", () => {
  assert.deepEqual([...bundleOfCards(["my_tasks"])], [["recurring.do_own", "edit"]]);
  assert.equal(CARDS.my_tasks.opens, "/my");
});

test("a role without recurring.do_own gets no My tasks tile", () => {
  const perms = role({ "resident.record": 1 });
  assert.ok(!hrefs(homeTilesFor(perms, en, 0, ["view_residents"])).includes("/my"));
});

test("a role holding recurring.do_own gets one My tasks tile, with the count", () => {
  const perms = role({ "resident.record": 1, "recurring.do_own": 2 });
  const tiles = homeTilesFor(perms, en, 0, ["view_residents"], { my: 3 });
  assert.equal(tiles.filter((x) => x.href === "/my").length, 1);
  assert.equal(tiles.find((x) => x.href === "/my").badge, en.my.navBadge(3));
  // Given as a card it is still one tile.
  assert.equal(homeTilesFor(perms, en, 0, ["view_residents", "my_tasks"]).filter((x) => x.href === "/my").length, 1);
});

test("Operations and Management appear only for a role that opens a page in them", () => {
  assert.ok(!hrefs(homeTilesFor(role({ "resident.record": 1 }), en, 0, ["view_residents"])).includes("/management"));
  const mgmt = role({ "resident.record": 1, "recurring.manage": 2, "recurring.do_any": 2, "recurring.do_own": 2 });
  assert.ok(hrefs(homeTilesFor(mgmt, en, 0, ["recurring_jobs"])).includes("/management"));
});
