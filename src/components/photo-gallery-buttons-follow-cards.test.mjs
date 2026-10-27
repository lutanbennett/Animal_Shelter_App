// Guard for "a button is shown only if the login's cards let it do that action" (CLAUDE.md), on the resident photo gallery.
// Narrow on purpose: it reads the source, so it asserts each gate is PRESENT and fails loudly if a pattern is not
// found (never passes by matching nothing). Rendering the gallery per login is checked by hand in the test plan.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const gallery = read("./PhotoGallery.tsx");

test("the gallery offers nothing that manages a photo unless told the login may", () => {
  assert.match(gallery, /canManage = false,/, "canManage must default to false");
  assert.match(gallery, /\) : !canManage \? null : \(/, "Delete and set-as-profile must sit behind canManage");
  assert.match(gallery, /const offeredMoves = canManage \?/, "move-to-folder options must come from offeredMoves");
  assert.match(gallery, /\{!readOnly && offeredMoves\.length > 0 && \(/);
  assert.match(gallery, /offeredMoves\.map\(/, "the picker must list offeredMoves, not every folder");
  assert.doesNotMatch(gallery, /moveOptions\.map\(/);
});

test("every page that draws the gallery passes the card test the actions make", () => {
  for (const p of [
    "../app/residents/[id]/[section]/sections/photos.tsx",
    "../app/residents/[id]/[section]/sections/adoption-updates.tsx",
  ]) {
    const src = read(p);
    assert.match(src, /canManage=\{canMarkPosted\}/, `${p} must pass canManage`);
    assert.match(src, /const canMarkPosted = can\(perms, "photos\.resident_manage"\);/, `${p}: canMarkPosted must be photos.resident_manage`);
    assert.match(src, /canFileToMedical=\{can\(perms, "photos\.resident_add"\)\}/);
  }
});

test("booking a vet visit from the hub asks the activity the booking page asks", () => {
  const section = read("../app/residents/[id]/[section]/sections/clinic-visits.tsx");
  assert.match(section, /can\(perms, "visit\.book"\)/);
  assert.match(read("../app/clinic-visits/new/page.tsx"), /requirePermission\("visit\.book"\)/);
});
