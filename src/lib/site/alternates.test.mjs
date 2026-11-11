import test from "node:test";
import assert from "node:assert/strict";
import { publicAlternates, ogAlternateLocale } from "./alternates.ts";

test("English render: canonical is bare, th twin is /th/", () => {
  assert.deepEqual(publicAlternates("/adopt/12", "en"), {
    canonical: "/adopt/12",
    languages: { en: "/adopt/12", th: "/th/adopt/12", "x-default": "/adopt/12" },
  });
});
test("Thai render: canonical is the /th/ address; home is /th", () => {
  assert.equal(publicAlternates("/adopt", "th").canonical, "/th/adopt");
  assert.equal(publicAlternates("/", "th").canonical, "/th");
  assert.equal(publicAlternates("/", "th").languages.th, "/th");
  assert.equal(publicAlternates("/", "th").languages["x-default"], "/");
});
test("og alternate locale is the other one", () => {
  assert.equal(ogAlternateLocale("th"), "en_GB");
  assert.equal(ogAlternateLocale("en"), "th_TH");
});
