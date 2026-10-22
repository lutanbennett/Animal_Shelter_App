// The icon library is drawn from the same list the home is: every tile a home can show has an icon, and a role that
// cannot open a page has none (Lutan, 2026-10-21: Bills was missing because the library listed the route registry only).
import test from "node:test";
import assert from "node:assert/strict";
import { iconCatalogue } from "./catalogue.ts";
import { cardTile, homeTilesFor } from "../home/tiles.ts";
import { CARDS, bundleOfCards } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import en from "../i18n/dictionaries/en.ts";

const as = (key, permissions) =>
  parsePermissions({
    role: { key, name: key, name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    scopes: { residents: "all", clinical: "any", contacts: "all", photos: "all", sees_login_emails: false },
    permissions,
  });
const paths = (p) => iconCatalogue(en, p).map((i) => i.path);

test("every card's page has an icon for a role whose cells cover that card", () => {
  for (const key of Object.keys(CARDS)) {
    const cells = {};
    for (const [activity, level] of bundleOfCards([key])) cells[activity] = level === "read" ? 1 : 2;
    const perms = as("management", cells);
    const tile = cardTile(key, perms, en);
    if (!tile) continue; // the page does not open for this role, so there is no tile to match
    assert.ok(paths(perms).includes(tile.href), `${key}: ${tile.href} has no icon in the library`);
  }
});

test("every tile a home draws has an icon", () => {
  const cells = { "resident.record": 1, "maintenance.bills": 2, "recurring.do_own": 2, "assistant.ask": 2, "assistant.record": 2 };
  const keys = ["management", "volunteer", "second_in_command"];
  for (const k of keys) {
    const perms = as(k, cells);
    const icons = paths(perms);
    for (const tile of homeTilesFor(perms, en, 0, Object.keys(CARDS))) assert.ok(icons.includes(tile.href), `${k}: ${tile.href}`);
  }
});

test("Bills, Residents, Assistant and My tasks are in the library when the role can open them, and Bills is not when it cannot", () => {
  const withBills = as("management", { "resident.record": 1, "maintenance.bills": 2, "assistant.ask": 2, "assistant.record": 2, "recurring.do_own": 2 });
  const got = paths(withBills);
  for (const p of ["/bills", "/residents", "/assistant", "/my"]) assert.ok(got.includes(p), p);
  assert.ok(!paths(as("second_in_command", { "resident.record": 1 })).includes("/bills"));
});

test("the full set (no permissions) holds the four outside-registry pages", () => {
  const all = iconCatalogue(en).map((i) => i.path);
  for (const p of ["/bills", "/residents", "/assistant", "/my"]) assert.ok(all.includes(p), p);
});
