import test from "node:test";
import assert from "node:assert/strict";
import { isPublicPath, isPublicPage, isEdgeCachedPage, thPathRest, localizedHref, otherLanguageHref } from "./public-paths.ts";

// The dangerous direction is a path wrongly treated as public, so the "not public"
// lists are the longer ones. All values are written out here, not read from the module.

test("the open site: these are reachable signed out", () => {
  for (const p of [
    "/", "/login", "/login/forgot", "/login/request", "/auth/callback", "/robots.txt", "/sitemap.xml", "/lca-logo.jpg", "/lca-logo-160.jpg", "/lca-logo.png", "/lca-logo-transparent.png", "/api/version",
    "/adopt", "/adopt/12", "/campaigns", "/campaigns/abc", "/services/sterilisation", "/our-work", "/our-work/abc", "/foster", "/volunteer", "/donate", "/friends", "/privacy",
    "/r/CODE1", "/e/12", "/api/photos/abc", "/api/videos/abc",
  ]) assert.equal(isPublicPath(p), true, p);
});

test("the open site: look-alikes and private areas are NOT public", () => {
  for (const p of [
    "", "adopt", "/adoptive", "/adopt-admin", "/adoption", "/appealsx", "/appeal", "/our-workshop", "/fosterage", "/donate2", "/friends-only", "/privacy-admin",
    "/residents", "/admin", "/management/cashflow", "/api/status/alerts", "/api/photos", "/api/photosx/a", "/api/videos", "/api/videosx/a", "/r", "/e", "/rx/1", "/ex/1",
    "/login/other", "/login/", "/leaked.png", "/api/x.svg", "/manual/login.png", "/api/version/x", "/robots.txt/x", "/Adopt", "/ADOPT",
    "//adopt", "/%61dopt", "/admin/adopt", "/residents/adopt",
  ]) assert.equal(isPublicPath(p), false, JSON.stringify(p));
});

test("a trailing slash on a page prefix is still that page", () => {
  assert.equal(isPublicPath("/adopt/"), true);
  assert.equal(isPublicPath("/privacy/"), true);
});

test("the locked site: only sign-in, the landing page, robots, the logo, version and /privacy", () => {
  for (const p of ["/", "/login", "/login/forgot", "/login/request", "/auth/callback", "/robots.txt", "/sitemap.xml", "/lca-logo.jpg", "/lca-logo-160.jpg", "/lca-logo.png", "/lca-logo-transparent.png", "/api/version", "/privacy", "/privacy/x"]) {
    assert.equal(isPublicPath(p, true), true, p);
  }
  for (const p of ["/adopt", "/our-work", "/foster", "/volunteer", "/donate", "/friends", "/r/CODE1", "/e/12", "/api/photos/abc", "/privacy-admin", "/privacyx", "/residents", ""]) {
    assert.equal(isPublicPath(p, true), false, JSON.stringify(p));
  }
});

test("public pages carry no app chrome; /login and the photo proxy are not pages", () => {
  for (const p of ["/", "/adopt", "/adopt/1", "/campaigns", "/campaigns/1", "/privacy", "/r/CODE1", "/e/9", "/donate"]) assert.equal(isPublicPage(p), true, p);
  for (const p of ["/login", "/api/photos/a", "/robots.txt", "/residents", "/adoptive", "/admin", ""]) assert.equal(isPublicPage(p), false, JSON.stringify(p));
});

test("the Worker edge-caches public pages except the live ones (/r, /e, /campaigns)", () => {
  for (const p of ["/", "/adopt", "/adopt/1", "/our-work", "/foster", "/volunteer", "/donate", "/friends", "/privacy"]) {
    assert.equal(isEdgeCachedPage(p), true, p);
  }
  for (const p of ["/r/CODE1", "/e/12", "/r", "/e", "/campaigns", "/campaigns/1", "/login", "/residents", "/api/photos/a", "/adoptive", ""]) {
    assert.equal(isEdgeCachedPage(p), false, JSON.stringify(p));
  }
});

test("website off: the website pages a signed-in login is turned away from", async () => {
  const { isWebsitePageWhenOff } = await import("./public-paths.ts");
  for (const p of ["/adopt", "/adopt/12", "/campaigns", "/campaigns/1", "/services/x", "/our-work", "/foster", "/volunteer", "/donate", "/about", "/friends", "/shop", "/events"]) {
    assert.equal(isWebsitePageWhenOff(p), true, p);
  }
  // "/" sends itself on; /privacy answers in every state; /r/ and /e/ forward into the app;
  // /no-access, where a login with no app cards lands, must never be one (that would loop).
  for (const p of ["/", "/privacy", "/privacy/x", "/r/CODE1", "/e/12", "/no-access", "/home", "/login", "/residents", "/api/photos/a", "/adoptive", ""]) {
    assert.equal(isWebsitePageWhenOff(p), false, JSON.stringify(p));
  }
});

test("thPathRest: /th/ maps only a public PAGE to its bare twin", () => {
  assert.equal(thPathRest("/th"), "/");
  assert.equal(thPathRest("/th/"), "/");
  assert.equal(thPathRest("/th/adopt"), "/adopt");
  assert.equal(thPathRest("/th/adopt/12"), "/adopt/12");
  assert.equal(thPathRest("/th/r/CODE1"), "/r/CODE1");
  // bare addresses say nothing about language
  for (const p of ["/", "/adopt", "/privacy"]) assert.equal(thPathRest(p), null, p);
  // staff pages, non-page public paths and look-alikes are untouched
  for (const p of ["/th/bills", "/th/medical/diets", "/th/residents", "/th/login", "/th/api/photos/x", "/th/th/adopt", "/thailand", "/th2/adopt", "/thx", "/TH/adopt"]) {
    assert.equal(thPathRest(p), null, p);
  }
});

test("edge cache: a /th/ twin caches exactly when its bare page does", () => {
  for (const p of ["/th", "/th/adopt", "/th/our-work/abc"]) assert.equal(isEdgeCachedPage(thPathRest(p) ?? p), true, p);
  for (const p of ["/th/campaigns", "/th/services", "/th/r/CODE1", "/th/e/1"]) assert.equal(isEdgeCachedPage(thPathRest(p) ?? p), false, p);
});

test("localizedHref: Thai public pages get /th, nothing else does", () => {
  assert.equal(localizedHref("/adopt", "th"), "/th/adopt");
  assert.equal(localizedHref("/", "th"), "/th");
  assert.equal(localizedHref("/adopt/12?x=1#a", "th"), "/th/adopt/12?x=1#a");
  for (const p of ["/adopt", "/", "/bills", "/login"]) assert.equal(localizedHref(p, "en"), p, p);
  for (const p of ["/bills", "/login", "/api/x", "https://x.org/adopt", "//x.org/adopt", "#a", "/th/adopt"]) {
    assert.equal(localizedHref(p, "th"), p, p);
  }
});

test("otherLanguageHref: the toggle goes to the other address; staff pages stay put", () => {
  assert.equal(otherLanguageHref("/th/adopt", "en"), "/adopt");
  assert.equal(otherLanguageHref("/th", "en"), "/");
  assert.equal(otherLanguageHref("/adopt", "th"), "/th/adopt");
  assert.equal(otherLanguageHref("/", "th"), "/th");
  assert.equal(otherLanguageHref("/bills", "th"), null);
  assert.equal(otherLanguageHref("/th/bills", "en"), null);
});

test("the merchandise catalogue is edge-cached but its checkout and order pages never are", () => {
  for (const p of ["/shop", "/shop/merch"]) assert.equal(isEdgeCachedPage(p), true, p);
  for (const p of ["/shop/merch/checkout", "/shop/merch/order/0b6c7a52-1111-4222-8333-444455556666", "/shop/merch/order"]) {
    assert.equal(isEdgeCachedPage(p), false, p);
    assert.equal(isPublicPage(p), true, p);
  }
  assert.equal(isEdgeCachedPage(thPathRest("/th/shop/merch/checkout") ?? ""), false);
});
