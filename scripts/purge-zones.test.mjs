import { test } from "node:test";
import assert from "node:assert/strict";
import { PURGE_ZONES, purgeTargets, unmappedHosts } from "./lib/purge-zones.mjs";
import { readWranglerConfig, routeHosts } from "./lib/wrangler.mjs";

test("production purges both zones and names all four hosts", () => {
  const t = purgeTargets("production", { CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS: "a", CLOUDFLARE_ZONE_ID_COOPERJAIDEE: "b" });
  assert.deepEqual(t.map((z) => z.zone), ["a", "b"]);
  assert.deepEqual(t.flatMap((z) => z.hosts).sort(), [
    "cooperjaidee.org", "lannacareforanimals.org", "www.cooperjaidee.org", "www.lannacareforanimals.org",
  ]);
});

test("an absent zone variable is kept as a null zone, not dropped", () => {
  const t = purgeTargets("production", { CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS: "a" });
  assert.equal(t.length, 2);
  assert.equal(t[1].zoneVar, "CLOUDFLARE_ZONE_ID_COOPERJAIDEE");
  assert.equal(t[1].zone, null);
});

test("test and uat share the lannacare.org zone, own host checked first", () => {
  assert.equal(purgeTargets("test", { CLOUDFLARE_ZONE_ID: "z" })[0].hosts[0], "test.lannacare.org");
  assert.equal(purgeTargets("uat", { CLOUDFLARE_ZONE_ID: "z" })[0].hosts[0], "uat.lannacare.org");
});

test("every host wrangler.jsonc binds is covered by a purge zone", () => {
  const config = readWranglerConfig();
  for (const envName of Object.keys(PURGE_ZONES)) {
    assert.deepEqual(unmappedHosts(envName, routeHosts(config, envName)), [], envName);
  }
});

test("a fifth host is reported as unmapped", () => {
  assert.deepEqual(unmappedHosts("production", ["cooperjaidee.org", "new.example.org"]), ["new.example.org"]);
});
