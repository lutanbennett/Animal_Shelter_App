// The six pages ruled on 2026-10-21 (menu-removal orphans 2, 3, 5 and 6): the named roles are shown the tile without the
// Director ticking a card; any other role is not; and a tile is drawn only when the role's cells cover the card, so nothing is granted.
import test from "node:test";
import assert from "node:assert/strict";
import { homeTilesFor } from "./tiles.ts";
import { parsePermissions } from "../permissions/can.ts";
import en from "../i18n/dictionaries/en.ts";

const as = (key, permissions) =>
  parsePermissions({
    role: { key, name: key, name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    scopes: { residents: "all", clinical: "any", contacts: "all", photos: "all", sees_login_emails: false },
    permissions,
  });
const hrefs = (p, cards = ["assistant"]) => homeTilesFor(p, en, 0, cards).map((x) => x.href);

test("head of maintenance and head of medical get View residents", () => {
  for (const key of ["head_of_maintenance", "head_of_medical"]) {
    assert.ok(hrefs(as(key, { "resident.record": 1 })).includes("/residents"), key);
  }
  assert.ok(!hrefs(as("volunteer", { "resident.record": 1 })).includes("/residents"));
});

test("management and the 2IC get the three medical job tiles when their cells cover them", () => {
  const cells = { "resident.record": 1, "medical.weight": 2, "medical.diet": 1, "photos.resident_add": 2 };
  for (const key of ["management", "second_in_command"]) {
    const h = hrefs(as(key, cells));
    for (const p of ["/medical/weight", "/medical/diets", "/medical/photos"]) assert.ok(h.includes(p), key + " " + p);
  }
  // No cells, no tile: the rule draws a tile, it never grants.
  const none = hrefs(as("management", { "resident.record": 1 }));
  for (const p of ["/medical/weight", "/medical/diets", "/medical/photos"]) assert.ok(!none.includes(p), p);
});

test("Bills is Management's only", () => {
  const cells = { "resident.record": 1, "maintenance.bills": 2 };
  assert.ok(hrefs(as("management", cells)).includes("/bills"));
  assert.ok(!hrefs(as("second_in_command", cells)).includes("/bills"));
});

test("a held card is not drawn twice", () => {
  const cells = { "resident.record": 1 };
  const n = homeTilesFor(as("head_of_medical", cells), en, 0, ["view_residents"]).filter((x) => x.href === "/residents").length;
  assert.equal(n, 1);
});
