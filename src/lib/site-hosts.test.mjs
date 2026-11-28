import test from "node:test";
import assert from "node:assert/strict";
import { hostRedirect, isPlatformHostname, jobLinkOrigin, platformRedirect, isSplit, requestHost, siteAllowedOrigins, SITE_HOST_VARS } from "./site-hosts.ts";
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

const plat = { ...split, PLATFORM_HOST: "cooper.example.com" };

test("the platform host is a third address in the allowed origins, with www", () => {
  assert.deepEqual(siteAllowedOrigins(plat).sort(), ["app.example.org", "cooper.example.com", "site.example.net", "www.app.example.org", "www.cooper.example.com", "www.site.example.net"]);
  assert.equal(isPlatformHostname("www.cooper.example.com", plat), true);
  assert.equal(isPlatformHostname("app.example.org", plat), false);
  assert.equal(isPlatformHostname("cooper.example.com", split), false);
});

test("the platform host serves the console and sign-in only; any shelter page goes to the console", () => {
  for (const p of ["/platform", "/login", "/auth/callback", "/admin/security/verify", "/api/version", "/lca-logo.jpg"]) assert.equal(platformRedirect("cooper.example.com", p, plat), null, p);
  for (const p of ["/residents", "/my", "/admin", "/admin/product-admin", "/adopt"]) assert.equal(platformRedirect("cooper.example.com", p, plat), "/platform", p);
  assert.equal(platformRedirect("cooper.example.com", "/", plat), "/platform/about"); // #apxld: the apex goes to the product page
  assert.equal(platformRedirect("cooper.example.com", "/platform/about", plat), null);
  assert.equal(platformRedirect("app.example.org", "/residents", plat), null);
  assert.equal(platformRedirect("cooper.example.com", "/residents", split), null);
});

// The tests above prove siteHosts()/siteAllowedOrigins() handle a platform host
// correctly — and they ALL PASSED while production was broken (#plhbd), because
// they hand the env straight to the function. What nothing covered was whether
// the value ever REACHES it: `allowedOrigins` is baked at BUILD time, while
// wrangler.jsonc `vars` are RUNTIME values, so a host has to be carried across
// in two places. Both were missed. These two tests cover the carrying.
test("every address variable is copied to the Pi (scripts/pi/write-env.mjs reads PI_WRANGLER_VARS)", async () => {
  const { PI_WRANGLER_VARS } = await import("../../scripts/lib/runtime-config.mjs");
  for (const name of SITE_HOST_VARS) {
    assert.ok(
      PI_WRANGLER_VARS.includes(name),
      `${name} is in SITE_HOST_VARS but has no \`source: "wrangler"\` entry in scripts/lib/runtime-config.mjs, ` +
        `so scripts/pi/write-env.mjs will not copy it and the Pi's build bakes an allowedOrigins without it. ` +
        `Every Server Action on that address is then refused while every page renders.`,
    );
  }
});

test("every address variable is pinned into the Worker build (scripts/deploy.mjs)", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../../scripts/deploy.mjs", import.meta.url), "utf8");
  assert.match(
    src,
    /for \(const key of SITE_HOST_VARS\) buildEnv\[key\] = wranglerVars\[key\]/,
    "scripts/deploy.mjs must pin the addresses by looping over SITE_HOST_VARS. A line per host is how PLATFORM_HOST was missed (#plhbd).",
  );
  for (const name of SITE_HOST_VARS) {
    assert.doesNotMatch(
      src,
      new RegExp(`buildEnv\.${name}\s*=`),
      `scripts/deploy.mjs assigns ${name} by name. Use the SITE_HOST_VARS loop so the next address cannot be forgotten.`,
    );
  }
});

test("job links go to the staff app, not the platform host the cron runs on (#alrth)", () => {
  assert.equal(jobLinkOrigin("https://cooperjaidee.org/api/status/alerts", { APP_HOST: "app.example.org" }), "https://app.example.org");
  assert.equal(jobLinkOrigin("https://cooperjaidee.org/api/status/alerts", {}), "https://cooperjaidee.org");
  assert.equal(jobLinkOrigin("https://undefined/api/calendar/sweep", {}), null);
});
