import test from "node:test";
import assert from "node:assert/strict";
import { isPlatformSearchOpen, isSearchClosed } from "./public-site.ts";
import { platformRobots, platformSitemap } from "./platform-seo.ts";
import { platformRedirect } from "./site-hosts.ts";

const env = { PLATFORM_HOST: "cooperjaidee.example" };
const origin = new URL("https://cooperjaidee.example");

test("the product site is closed unless the switch is exactly 'open'", () => {
  for (const v of [undefined, "", "closed", "OPEN", "true", "locked"]) assert.equal(isPlatformSearchOpen(v), false, String(v));
  assert.equal(isPlatformSearchOpen("open"), true);
});

test("on the platform host only the platform switch counts, both ways", () => {
  // shelter locked, platform open: product open. Shelter open, platform closed: product closed.
  assert.equal(isSearchClosed(true, true, "open"), false);
  assert.equal(isSearchClosed(true, false, undefined), true);
  assert.equal(isSearchClosed(true, false, "open"), false);
});

test("on a shelter host the platform switch changes nothing", () => {
  assert.equal(isSearchClosed(false, true, "open"), true);
  assert.equal(isSearchClosed(false, false, undefined), false);
});

test("robots.txt: closed forbids everything, open allows only the product page", () => {
  assert.deepEqual(platformRobots(origin, false), { rules: { userAgent: "*", disallow: "/" } });
  const open = platformRobots(origin, true);
  assert.deepEqual(open.rules.allow, ["/$", "/platform/about", "/th/platform/about"]);
  assert.equal(open.rules.disallow, "/");
  assert.equal(open.sitemap, "https://cooperjaidee.example/sitemap.xml");
});

test("sitemap: empty while closed; open lists only the two product pages", () => {
  assert.deepEqual(platformSitemap(origin, false), []);
  const urls = platformSitemap(origin, true).map((e) => e.url);
  assert.deepEqual(urls, ["https://cooperjaidee.example/platform/about", "https://cooperjaidee.example/th/platform/about"]);
});

test("the platform host serves its sitemap and the Thai product page instead of redirecting", () => {
  assert.equal(platformRedirect("cooperjaidee.example", "/sitemap.xml", env), null);
  assert.equal(platformRedirect("cooperjaidee.example", "/th/platform/about", env), null);
  assert.equal(platformRedirect("cooperjaidee.example", "/residents", env), "/platform");
});
