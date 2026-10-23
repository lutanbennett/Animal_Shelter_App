// The extra cards once hard-coded per role key (RULED_CARDS, ruled 2026-10-21) are gone (Lutan, 2026-10-23): a role key earns
// no tile. Those roles get the tiles only if their cards on Who does what say so; the list Lutan ticks seeds them as data.
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
const cells = { "resident.record": 1, "medical.weight": 2, "medical.diet": 1, "photos.resident_add": 2, "maintenance.bills": 2 };
const hrefs = (p, cards) => homeTilesFor(p, en, 0, cards).map((x) => x.href);

test("no role key gets a tile its cards do not name", () => {
  for (const key of ["head_of_maintenance", "head_of_medical", "management", "second_in_command"]) {
    assert.deepEqual(hrefs(as(key, cells), ["assistant"]), ["/assistant"], key);
  }
});

test("the same tiles come back when the card is given, and only then", () => {
  const h = hrefs(as("management", cells), ["assistant", "bills", "record_weight"]);
  assert.deepEqual(h, ["/assistant", "/bills", "/medical/weight"]);
});
