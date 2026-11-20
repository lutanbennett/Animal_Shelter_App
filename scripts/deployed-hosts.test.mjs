import { test } from "node:test";
import assert from "node:assert/strict";
import { addressesAnsweredOn, missingHosts } from "./lib/deployed-hosts.mjs";

test("includes the www. form of every configured host, once each", () => {
  const a = addressesAnsweredOn({ APP_HOST: "Test.Example.org", PUBLIC_HOST: "test.example.org", PLATFORM_HOST: "p.org" });
  assert.deepEqual(a, ["test.example.org", "www.test.example.org", "p.org", "www.p.org"]);
});

test("names every address with no row, and none that has one", () => {
  const a = addressesAnsweredOn({ APP_HOST: "a.org", PUBLIC_HOST: "b.org" });
  assert.deepEqual(missingHosts(a, ["a.org", "b.org"]), ["www.a.org", "www.b.org"]);
  assert.deepEqual(missingHosts(a, ["A.org", "www.a.org", "b.org", "www.b.org"]), []);
});

test("nothing configured gives nothing to check", () => {
  assert.deepEqual(addressesAnsweredOn({}), []);
});
