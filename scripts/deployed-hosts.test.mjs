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

test("#wwwcb: an invented www. form that is not routed is not an address; a routed one still is", () => {
  const v = { APP_HOST: "uat.org", PUBLIC_HOST: "uat.org" };
  assert.deepEqual(addressesAnsweredOn(v, ["uat.org"]), ["uat.org"]);
  const prod = { APP_HOST: "a.org", PLATFORM_HOST: "p.org" };
  assert.deepEqual(addressesAnsweredOn(prod, ["a.org", "www.a.org", "p.org", "www.p.org"]), ["a.org", "www.a.org", "p.org", "www.p.org"]);
});

test("#wwwcb: a routed www. form with no row or no callback still fails", () => {
  const a = addressesAnsweredOn({ APP_HOST: "a.org" }, ["a.org", "www.a.org"]);
  assert.deepEqual(missingHosts(a, ["a.org"]), ["www.a.org"]);
  assert.deepEqual(missingCallbacks(a, "https://a.org/auth/callback"), ["www.a.org"]);
});

test("#wwwcb: a literally configured host is kept even if no route names it", () => {
  assert.deepEqual(addressesAnsweredOn({ APP_HOST: "a.org" }, ["other.org"]), ["a.org"]);
});

import { googleClientProject } from "./lib/deployed-hosts.mjs";
test("#gidty: a Google client id names its project, and an unknown one is reported, not thrown", () => {
  assert.equal(googleClientProject("559913308840-abc.apps.googleusercontent.com"), "CooperJaidee's Google project");
  assert.equal(googleClientProject("1036347359893-xyz.apps.googleusercontent.com"), "the shelter's Google project");
  assert.equal(googleClientProject("42-q.apps.googleusercontent.com"), "unrecognised project 42");
  assert.equal(googleClientProject(""), "no client id set");
  assert.equal(googleClientProject(null), "no client id set");
  assert.equal(googleClientProject("nonsense"), "unrecognised client id shape");
});
