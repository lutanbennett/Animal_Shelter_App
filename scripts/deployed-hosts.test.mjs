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

import { missingCallbacks } from "./lib/deployed-hosts.mjs";

test("callback allow-list: names the www. forms an exact list lacks", () => {
  const a = addressesAnsweredOn({ APP_HOST: "a.org" });
  assert.deepEqual(missingCallbacks(a, "https://a.org/auth/callback"), ["www.a.org"]);
  assert.deepEqual(missingCallbacks(a, "https://a.org/auth/callback, https://www.a.org/auth/callback"), []);
});

test("callback allow-list: a glob entry admits, a query-bearing or other-host entry does not", () => {
  assert.deepEqual(missingCallbacks(["a.org"], "https://a.org/**"), []);
  assert.deepEqual(missingCallbacks(["a.org"], "https://b.org/**,https://a.org/other"), ["a.org"]);
  assert.deepEqual(missingCallbacks(["a.org"], ""), ["a.org"]);
});

import { choosePrimaries } from "./lib/deployed-hosts.mjs";
test("choosePrimaries picks PUBLIC_HOST only, never a tie-break, never a shelter already flagged", () => {
  const rows = [
    { shelter_id: "a", key: "lanna", host: "cooperjaidee.org", is_primary: false },
    { shelter_id: "a", key: "lanna", host: "www.lannacareforanimals.org", is_primary: false },
    { shelter_id: "a", key: "lanna", host: "lannacareforanimals.org", is_primary: false },
    { shelter_id: "b", key: "x", host: "x.example", is_primary: true },
    { shelter_id: "c", key: "y", host: "y.example", is_primary: false },
  ];
  const r = choosePrimaries(rows, "lannacareforanimals.org");
  assert.deepEqual(r.set, [{ shelter_id: "a", key: "lanna", host: "lannacareforanimals.org" }]);
  assert.deepEqual(r.undecided.map((u) => u.key), ["y"]);
});
