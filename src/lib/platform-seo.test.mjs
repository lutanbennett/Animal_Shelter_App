import test from "node:test";
import assert from "node:assert/strict";
import { isPlatformSearchOpen, isSearchClosed } from "./public-site.ts";
import { platformRobots, platformSitemap } from "./platform-seo.ts";
import { isPublicPath, thPathRest } from "./public-paths.ts";
import { platformRedirect } from "./site-hosts.ts";

const env = { PLATFORM_HOST: "cooperjaidee.example" };
const origin = new URL("https://cooperjaidee.example");
const ALL = ["/platform/about","/platform/features/residents","/platform/features/medical","/platform/features/adoptions","/platform/features/volunteers","/platform/features/website","/platform/features/money","/platform/cooper","/th/platform/about","/th/platform/features/residents","/th/platform/features/medical","/th/platform/features/adoptions","/th/platform/features/volunteers","/th/platform/features/website","/th/platform/features/money","/th/platform/cooper"];

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
  assert.deepEqual(open.rules.allow, ["/$", ...ALL]);
  assert.equal(open.rules.disallow, "/");
  assert.equal(open.sitemap, "https://cooperjaidee.example/sitemap.xml");
});

test("sitemap: empty while closed; open lists every product page, each with its own language links", () => {
  assert.deepEqual(platformSitemap(origin, false), []);
  const map = platformSitemap(origin, true);
  assert.deepEqual(map.map((e) => e.url), ALL.map((p) => "https://cooperjaidee.example" + p));
  const money = map.find((e) => e.url.endsWith("/th/platform/features/money"));
  assert.equal(money.alternates.languages.en, "https://cooperjaidee.example/platform/features/money");
  assert.equal(money.alternates.languages.th, "https://cooperjaidee.example/th/platform/features/money");
});

test("Cooper's page is left out of the sitemap until it has content (#cpstr), and listed once it has", () => {
  const without = platformSitemap(origin, true, false).map((e) => e.url);
  assert.equal(without.some((u) => u.endsWith("/platform/cooper")), false);
  assert.equal(without.length, ALL.length - 2);
  assert.equal(platformSitemap(origin, true, true).filter((e) => e.url.endsWith("/platform/cooper")).length, 2);
  assert.deepEqual(platformSitemap(origin, false, true), []);
});

test("the switch closes every product page at once, and opens only product pages", () => {
  const closed = platformRobots(origin, false);
  assert.equal(closed.rules.allow, undefined);
  assert.deepEqual(platformSitemap(origin, false), []);
  for (const p of platformRobots(origin, true).rules.allow.slice(1)) assert.match(p, /^(\/th)?\/platform\/(about|cooper|features\/[a-z-]+)$/);
});

test("public path lists carry the feature pages, and the Thai address rewrites", () => {
  for (const locked of [false, true]) {
    assert.equal(isPublicPath("/platform/features/money", locked), true);
    assert.equal(isPublicPath("/platform/about", locked), true);
    assert.equal(isPublicPath("/platform", locked), false);
    assert.equal(isPublicPath("/platform/shelters", locked), false);
  }
  assert.equal(thPathRest("/th/platform/features/money"), "/platform/features/money");
  assert.equal(thPathRest("/th/platform/shelters"), null);
});

test("the platform host serves its sitemap and the Thai product page instead of redirecting", () => {
  assert.equal(platformRedirect("cooperjaidee.example", "/sitemap.xml", env), null);
  assert.equal(platformRedirect("cooperjaidee.example", "/th/platform/about", env), null);
  assert.equal(platformRedirect("cooperjaidee.example", "/th/platform/features/money", env), null);
  assert.equal(platformRedirect("cooperjaidee.example", "/platform/features/money", env), null);
  assert.equal(platformRedirect("cooperjaidee.example", "/th/platform/shelters", env), "/platform");
  assert.equal(platformRedirect("cooperjaidee.example", "/residents", env), "/platform");
});

test("every product page, in both languages, is listed when the switch is open and none while it is closed", () => {
  const closed = platformSitemap(origin, false);
  assert.deepEqual(closed, []);
  assert.equal(platformRobots(origin, false).rules.allow, undefined);
  const open = platformSitemap(origin, true);
  for (const p of ALL) {
    assert.ok(open.some((e) => e.url === "https://cooperjaidee.example" + p), p);
    const en = p.replace(/^\/th/, "");
    const e = open.find((x) => x.url.endsWith(p));
    assert.equal(e.alternates.languages.en, "https://cooperjaidee.example" + en, p);
    assert.equal(e.alternates.languages.th, "https://cooperjaidee.example/th" + en, p);
    assert.equal(platformRedirect("cooperjaidee.example", p, env), null, p);
    assert.equal(isPublicPath(en, true), true, p);
  }
});
