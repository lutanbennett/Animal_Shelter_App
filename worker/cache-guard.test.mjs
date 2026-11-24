import test from "node:test";
import assert from "node:assert/strict";
import { siteIsOpenForCache } from "./cache-guard.mjs";

const req = (shelter) => new Request("https://site.example/", shelter ? { headers: { "x-public-site": shelter } } : {});

test("floor locked + shelter open is not cacheable", () => {
  assert.equal(siteIsOpenForCache(req("open"), { PUBLIC_SITE: "locked" }), false);
  assert.equal(siteIsOpenForCache(req(), { PUBLIC_SITE: "locked" }), false);
});
test("floor off is not cacheable", () => {
  assert.equal(siteIsOpenForCache(req("open"), { PUBLIC_SITE: "off" }), false);
});
test("floor open + shelter locked or off is not cacheable", () => {
  assert.equal(siteIsOpenForCache(req("locked"), { PUBLIC_SITE: "open" }), false);
  assert.equal(siteIsOpenForCache(req("off"), { PUBLIC_SITE: "open" }), false);
});
test("both open, or floor unset and no shelter header, is cacheable", () => {
  assert.equal(siteIsOpenForCache(req("open"), { PUBLIC_SITE: "open" }), true);
  assert.equal(siteIsOpenForCache(req(), {}), true);
});
