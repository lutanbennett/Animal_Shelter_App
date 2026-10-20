import test from "node:test";
import assert from "node:assert/strict";
import { hostRedirect, isSplit, requestHost, siteAllowedOrigins } from "./site-hosts.ts";
import { isPublicPage } from "./public-paths.ts";

const split = { APP_HOST: "app.example.org", PUBLIC_HOST: "site.example.net" };
const one = { APP_HOST: "one.example.org", PUBLIC_HOST: "one.example.org" };
const go = (host, path, env = split) => hostRedirect(host, path, { isPublicPage }, env);

test("split only when both are set and differ", () => {
  assert.equal(isSplit(split), true);
  assert.equal(isSplit(one), false);
  assert.equal(isSplit({}), false);
});

test("one address serves everything: nothing redirects", () => {
  for (const p of ["/", "/adopt", "/residents", "/r/R-0001", "/login"]) assert.equal(go("one.example.org", p, one), null, p);
  assert.equal(go("localhost", "/residents", {}), null);
});

test("public address serves public pages, tags and the photo route; sends staff pages to the app address", () => {
  for (const p of ["/", "/adopt", "/adopt/12", "/our-work", "/donate", "/r/R-0001", "/e/9", "/robots.txt", "/sitemap.xml", "/api/photos/abc"])
    assert.equal(go("site.example.net", p), null, p);
  for (const p of ["/residents", "/login", "/auth/callback", "/admin/status", "/my"]) assert.equal(go("site.example.net", p), "app.example.org", p);
});

test("app address serves staff pages, its home page and /privacy; sends the rest of the public pages to the public address", () => {
  for (const p of ["/residents", "/login", "/auth/callback", "/", "/privacy", "/api/photos/abc"]) assert.equal(go("app.example.org", p), null, p);
  for (const p of ["/adopt", "/adopt/12", "/our-work", "/r/R-0001", "/e/9"]) assert.equal(go("app.example.org", p), "site.example.net", p);
});

test("www of either address behaves as the address; unknown hosts are left alone", () => {
  assert.equal(go("www.site.example.net", "/residents"), "app.example.org");
  assert.equal(go("www.app.example.org", "/adopt"), "site.example.net");
  assert.equal(go("192.168.1.5", "/residents"), null);
});

test("adding a new staff address is a setting: the same rules apply to it", () => {
  const moved = { APP_HOST: "cooper.example.org", PUBLIC_HOST: "site.example.net" };
  assert.equal(go("cooper.example.org", "/r/R-1", moved), "site.example.net");
  assert.equal(go("site.example.net", "/login", moved), "cooper.example.org");
});

test("requestHost prefers the Worker's header over the rewritten ones, and drops the port", () => {
  const h = { "x-lanna-public-host": "Site.example.net", "x-forwarded-host": "pi.example.org", host: "app.example.org" };
  assert.equal(requestHost((n) => h[n] ?? null), "site.example.net");
  assert.equal(requestHost((n) => ({ host: "localhost:3010" })[n] ?? null), "localhost");
  assert.equal(requestHost(() => null), null);
});

test("allowed origins are the two addresses and www of each", () => {
  assert.deepEqual(siteAllowedOrigins(split).sort(), ["app.example.org", "site.example.net", "www.app.example.org", "www.site.example.net"]);
  assert.deepEqual(siteAllowedOrigins({}), []);
});
