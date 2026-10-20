import test from "node:test";
import assert from "node:assert/strict";
import { isPublicPath, isPublicPage, isEdgeCachedPage } from "./public-paths.ts";

// The dangerous direction is a path wrongly treated as public, so the "not public"
// lists are the longer ones. All values are written out here, not read from the module.

test("the open site: these are reachable signed out", () => {
  for (const p of [
    "/", "/login", "/login/forgot", "/login/request", "/auth/callback", "/robots.txt", "/sitemap.xml", "/lca-logo.jpg", "/lca-logo-160.jpg", "/api/version",
    "/adopt", "/adopt/12", "/appeals", "/appeals/abc", "/services/desexing", "/our-work", "/our-work/abc", "/foster", "/volunteer", "/donate", "/friends", "/privacy",
    "/r/CODE1", "/e/12", "/api/photos/abc",
  ]) assert.equal(isPublicPath(p), true, p);
});

test("the open site: look-alikes and private areas are NOT public", () => {
  for (const p of [
    "", "adopt", "/adoptive", "/adopt-admin", "/adoption", "/appealsx", "/appeal", "/our-workshop", "/fosterage", "/donate2", "/friends-only", "/privacy-admin",
    "/residents", "/admin", "/management/cashflow", "/api/status/alerts", "/api/photos", "/api/photosx/a", "/r", "/e", "/rx/1", "/ex/1",
    "/login/other", "/login/", "/leaked.png", "/api/x.svg", "/manual/login.png", "/api/version/x", "/robots.txt/x", "/Adopt", "/ADOPT",
    "//adopt", "/%61dopt", "/admin/adopt", "/residents/adopt",
  ]) assert.equal(isPublicPath(p), false, JSON.stringify(p));
});

test("a trailing slash on a page prefix is still that page", () => {
  assert.equal(isPublicPath("/adopt/"), true);
  assert.equal(isPublicPath("/privacy/"), true);
});

test("the locked site: only sign-in, the landing page, robots, the logo, version and /privacy", () => {
  for (const p of ["/", "/login", "/login/forgot", "/login/request", "/auth/callback", "/robots.txt", "/sitemap.xml", "/lca-logo.jpg", "/lca-logo-160.jpg", "/api/version", "/privacy", "/privacy/x"]) {
    assert.equal(isPublicPath(p, true), true, p);
  }
  for (const p of ["/adopt", "/our-work", "/foster", "/volunteer", "/donate", "/friends", "/r/CODE1", "/e/12", "/api/photos/abc", "/privacy-admin", "/privacyx", "/residents", ""]) {
    assert.equal(isPublicPath(p, true), false, JSON.stringify(p));
  }
});

test("public pages carry no app chrome; /login and the photo proxy are not pages", () => {
  for (const p of ["/", "/adopt", "/adopt/1", "/appeals", "/appeals/1", "/privacy", "/r/CODE1", "/e/9", "/donate"]) assert.equal(isPublicPage(p), true, p);
  for (const p of ["/login", "/api/photos/a", "/robots.txt", "/residents", "/adoptive", "/admin", ""]) assert.equal(isPublicPage(p), false, JSON.stringify(p));
});

test("the Worker edge-caches public pages except the live ones (/r, /e, /appeals)", () => {
  for (const p of ["/", "/adopt", "/adopt/1", "/our-work", "/foster", "/volunteer", "/donate", "/friends", "/privacy"]) {
    assert.equal(isEdgeCachedPage(p), true, p);
  }
  for (const p of ["/r/CODE1", "/e/12", "/r", "/e", "/appeals", "/appeals/1", "/login", "/residents", "/api/photos/a", "/adoptive", ""]) {
    assert.equal(isEdgeCachedPage(p), false, JSON.stringify(p));
  }
});
