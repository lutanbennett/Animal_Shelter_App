import test from "node:test";
import assert from "node:assert/strict";
import { deploymentSiteState, isPublicSiteLocked, isPublicSiteOff, publicSiteStateFor } from "./public-site.ts";
import { signedInLandingPath } from "./auth/app-access.ts";

// The deployment floor (PUBLIC_SITE, #br3f3) and the shelter's own state (#wbsof, docs/decisions/2026-11-20-public-site-per-shelter.md):
// a request gets the MORE CLOSED of the two.
const floor = (v) => v;

test("unset, empty or unknown floor is open", () => {
  for (const v of [undefined, "", "open", "LOCKED", "Off", "yes"]) {
    assert.equal(deploymentSiteState(floor(v)), "open", String(v));
    assert.equal(publicSiteStateFor(null, floor(v)), "open", String(v));
  }
});

test("the shelter alone can lock or switch off its own site while the floor is open", () => {
  assert.equal(publicSiteStateFor("locked", floor(undefined)), "locked");
  assert.equal(publicSiteStateFor("off", floor(undefined)), "off");
  assert.equal(publicSiteStateFor("open", floor(undefined)), "open");
});

test("THE FLOOR STAYS A FLOOR: a shelter can never be less closed than the deployment", () => {
  for (const shelter of ["open", "locked", "off", null, undefined, "garbage"]) {
    assert.equal(publicSiteStateFor(shelter, floor("off")), "off", `off floor, shelter ${shelter}`);
  }
  for (const shelter of ["open", null, undefined, "garbage"]) {
    assert.equal(publicSiteStateFor(shelter, floor("locked")), "locked", `locked floor, shelter ${shelter}`);
  }
  assert.equal(publicSiteStateFor("off", floor("locked")), "off", "a shelter may close further than the floor");
});

test("two shelters on one deployment: one open, one off", () => {
  assert.equal(publicSiteStateFor("open", floor(undefined)), "open");
  assert.equal(publicSiteStateFor("off", floor(undefined)), "off");
});

test("locked keeps strangers out but is not off; off is locked and more", () => {
  assert.equal(isPublicSiteLocked("open"), false);
  assert.equal(isPublicSiteLocked("locked"), true);
  assert.equal(isPublicSiteOff("locked"), false);
  assert.equal(isPublicSiteLocked("off"), true);
  assert.equal(isPublicSiteOff("off"), true);
});

const APP = { key: "anything", entersApp: true };
const NO_APP = { key: "anything", entersApp: false };

test("a sign-in that opens the app lands in the app in every state", () => {
  for (const v of ["open", "locked", "off"]) {
    assert.equal(signedInLandingPath(APP, null, v), "/home", v);
    assert.equal(signedInLandingPath(APP, "/residents", v), "/residents", v);
  }
});

test("while the website is off, a login whose cards open nothing never lands on a website page", () => {
  for (const next of [null, "/", "/adopt", "/r/CODE1", "/privacy", "/residents"]) {
    assert.equal(signedInLandingPath(NO_APP, next, "off"), "/no-access", String(next));
  }
  assert.equal(signedInLandingPath(null, null, "off"), "/no-access");
});

test("locked and open are unchanged: that login still lands on the website", () => {
  for (const v of ["open", "locked"]) {
    assert.equal(signedInLandingPath(NO_APP, null, v), "/", v);
    assert.equal(signedInLandingPath(NO_APP, "/r/CODE1", v), "/r/CODE1", v);
  }
});
