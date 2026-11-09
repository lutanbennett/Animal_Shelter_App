import test from "node:test";
import assert from "node:assert/strict";
import { isPublicSiteLocked, isPublicSiteOff, publicSiteState } from "./public-site.ts";
import { signedInLandingPath } from "./auth/app-access.ts";

// PUBLIC_SITE has three states (#br3f3, docs/decisions/2026-11-09-website-off-on-test.md).
function withPublicSite(value, fn) {
  const before = process.env.PUBLIC_SITE;
  if (value === undefined) delete process.env.PUBLIC_SITE;
  else process.env.PUBLIC_SITE = value;
  try {
    fn();
  } finally {
    if (before === undefined) delete process.env.PUBLIC_SITE;
    else process.env.PUBLIC_SITE = before;
  }
}

test("unset, empty or unknown is open: nothing locked, nothing off", () => {
  for (const v of [undefined, "", "open", "LOCKED", "Off", "yes"]) {
    withPublicSite(v, () => {
      assert.equal(publicSiteState(), "open", String(v));
      assert.equal(isPublicSiteLocked(), false, String(v));
      assert.equal(isPublicSiteOff(), false, String(v));
    });
  }
});

test("locked keeps strangers out but is not off, so staff may still preview", () => {
  withPublicSite("locked", () => {
    assert.equal(publicSiteState(), "locked");
    assert.equal(isPublicSiteLocked(), true);
    assert.equal(isPublicSiteOff(), false);
  });
});

test("off is locked and more", () => {
  withPublicSite("off", () => {
    assert.equal(publicSiteState(), "off");
    assert.equal(isPublicSiteLocked(), true);
    assert.equal(isPublicSiteOff(), true);
  });
});

const APP = { key: "anything", entersApp: true };
const NO_APP = { key: "anything", entersApp: false };

test("a sign-in that opens the app lands in the app in every state", () => {
  for (const v of [undefined, "locked", "off"]) {
    withPublicSite(v, () => {
      assert.equal(signedInLandingPath(APP, null), "/home", String(v));
      assert.equal(signedInLandingPath(APP, "/residents"), "/residents", String(v));
    });
  }
});

test("while the website is off, a login whose cards open nothing never lands on a website page", () => {
  withPublicSite("off", () => {
    for (const next of [null, "/", "/adopt", "/r/CODE1", "/privacy", "/residents"]) {
      assert.equal(signedInLandingPath(NO_APP, next), "/no-access", String(next));
    }
    assert.equal(signedInLandingPath(null, null), "/no-access");
  });
});

test("locked and open are unchanged: that login still lands on the website", () => {
  for (const v of [undefined, "locked"]) {
    withPublicSite(v, () => {
      assert.equal(signedInLandingPath(NO_APP, null), "/", String(v));
      assert.equal(signedInLandingPath(NO_APP, "/r/CODE1"), "/r/CODE1", String(v));
    });
  }
});
