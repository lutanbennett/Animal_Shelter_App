import { test } from "node:test";
import assert from "node:assert/strict";
import { deployedHosts, missingHosts } from "./lib/deployed-hosts.mjs";

test("reads APP_HOST and PUBLIC_HOST, once each, and ignores PLATFORM_HOST", () => {
  const d = deployedHosts({ APP_HOST: "Test.Example.org", PUBLIC_HOST: "test.example.org", PLATFORM_HOST: "p.org" });
  assert.deepEqual(d, [{ var: "APP_HOST", host: "test.example.org" }]);
});

test("names every host with no row, and none that has one", () => {
  const d = deployedHosts({ APP_HOST: "a.org", PUBLIC_HOST: "b.org" });
  assert.deepEqual(missingHosts(d, ["a.org"]).map((m) => m.host), ["b.org"]);
  assert.deepEqual(missingHosts(d, ["A.org", "b.org"]), []);
  assert.equal(missingHosts(d, []).length, 2);
});

test("nothing deployed gives nothing to check", () => {
  assert.deepEqual(deployedHosts({}), []);
});
