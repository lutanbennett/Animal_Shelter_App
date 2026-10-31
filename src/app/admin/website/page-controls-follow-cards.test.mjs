// Guard for "a button is shown only if the login's cards let it do that action" (CLAUDE.md), on
// Settings → Website → Pages and the page edit page it opens.
//
// Narrow on purpose, like the earlier slices: it asserts the gates are PRESENT and that each one
// names the activity its own action asks. It cannot detect a NEW ungated control (no render harness
// in the repo), which is why the screen's controls are listed in
// docs/decisions/2026-10-31-website-pages-tidied.md as well.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const actions = read("./actions.ts");
const cards = read("./PageCards.tsx");
const editPage = read("./pages/[slug]/page.tsx");
const form = read("./SitePageForm.tsx");
const photo = read("./PagePhotoCard.tsx");

test("the page save, the Show / Hide switch and the photo controls all ask website.content", () => {
  // can() defaults to the edit level, so a bare can(perms, "website.content") is the edit check —
  // the same call the controls make.
  for (const fn of [
    "updateSitePage",
    "setPublicPageHidden",
    "uploadPagePhoto",
    "removePagePhoto",
    "savePagePhotoAlt",
  ]) {
    const body = actions.slice(actions.indexOf(`export async function ${fn}(`));
    assert.ok(
      body.slice(0, 600).includes('can(await loadPermissions(), "website.content")'),
      `${fn} must ask website.content`,
    );
  }
});

test("the cards draw Edit and the switch only behind that activity", () => {
  assert.match(cards, /\{canEdit && !page\.neverHidden && \(/, "the page switch sits behind canEdit");
  assert.match(cards, /\{canEdit && page\.editor && \(/, "Edit sits behind canEdit");
  assert.match(cards, /\{canEdit && \(\n\s+<ActionButton/, "the section switch sits behind canEdit");
  assert.ok(
    editPage.includes('const canContent = can(perms, "website.content")'),
    "the edit page reads the same activity",
  );
  assert.ok(editPage.includes("canEdit={canContent}"), "and hands it to the editor and the photo");
  assert.equal(editPage.split("canEdit={canContent}").length - 1, 2, "both the editor and the photo");
});

test("the shared editor and photo card offer nothing when a caller forgets the prop", () => {
  assert.match(form, /canEdit = false,/, "SitePageForm defaults canEdit to false");
  assert.match(photo, /canEdit = false,/, "PagePhotoCard defaults canEdit to false");
  assert.match(form, /\{canEdit && \(\n\s+<ActionButton type="submit"/, "Save sits behind canEdit");
  assert.match(photo, /\{canEdit && \(\n\s+<div className="flex flex-wrap/, "upload and remove sit behind canEdit");
  assert.match(photo, /\{canEdit && photo\.fileId && \(/, "the description form sits behind canEdit");
});

test("nothing on this screen is decided by a role", () => {
  for (const [name, src] of [["PageCards", cards], ["the edit page", editPage], ["PagePhotoCard", photo]]) {
    assert.ok(!/role\.key|roles\.|isAdmin|"volunteer"|"management"|"doctor"/.test(src), `${name} names no role`);
  }
});
