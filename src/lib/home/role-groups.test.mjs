// A login that holds more than one role gets one group per role, main role first; a tile two roles give is in each;
// a login with one role gets exactly the home it had. Layout only: the permissions are the union either way.
import test from "node:test";
import assert from "node:assert/strict";
import { homeGroupsForRoles, homeTilesFor } from "./tiles.ts";
import { bundleOfCards } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import en from "../i18n/dictionaries/en.ts";

const union = (cards, roles) =>
  parsePermissions({
    role: { key: roles[0], name: "x", name_th: null, kind: "custom", opens_app: true, home_path: null },
    roles,
    is_admin: false,
    scopes: { residents: "all", clinical: "any", contacts: "all", photos: "all", sees_login_emails: false },
    permissions: Object.fromEntries([...bundleOfCards(cards)].map(([a, l]) => [a, l === "edit" ? 2 : 1])),
  });

test("two roles: two groups, main first, a shared tile in each", () => {
  const perms = union(["add_photos", "contacts"], ["main", "cover"]);
  const groups = homeGroupsForRoles(perms, en, undefined, { main: ["add_photos"], cover: ["add_photos", "contacts"] });
  assert.deepEqual(groups.map((g) => g.roleKey), ["main", "cover"]);
  assert.deepEqual(groups[0].tiles.map((x) => x.href), ["/photos/add"]);
  assert.ok(groups[1].tiles.some((x) => x.href === "/photos/add"));
  assert.ok(groups[1].tiles.length > 1);
});

test("one role: a single group identical to homeTilesFor", () => {
  const perms = union(["add_photos"], ["main"]);
  const groups = homeGroupsForRoles(perms, en, undefined, { main: ["add_photos"] });
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].tiles, homeTilesFor(perms, en, undefined, ["add_photos"]));
});
