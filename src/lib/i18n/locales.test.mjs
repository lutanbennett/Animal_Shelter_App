import test from "node:test";
import assert from "node:assert/strict";
import { localeFromAcceptLanguage, initialLocaleCookie } from "./locales.ts";

test("Thai only when it is the first preference", () => {
  assert.equal(localeFromAcceptLanguage("th"), "th");
  assert.equal(localeFromAcceptLanguage("th-TH,th;q=0.9,en;q=0.8"), "th");
  assert.equal(localeFromAcceptLanguage("TH-th"), "th");
  assert.equal(localeFromAcceptLanguage("en-GB,en;q=0.9,th;q=0.8"), "en");
  assert.equal(localeFromAcceptLanguage("en"), "en");
  assert.equal(localeFromAcceptLanguage("tha"), "en");
  assert.equal(localeFromAcceptLanguage("fr"), "en");
  assert.equal(localeFromAcceptLanguage(""), "en");
  assert.equal(localeFromAcceptLanguage(null), "en");
});

test("a first visit from a Thai phone starts the cookie at th", () => {
  assert.equal(initialLocaleCookie(undefined, "th-TH,th;q=0.9"), "th");
  assert.equal(initialLocaleCookie("garbage", "th"), "th");
});

test("the toggle wins: any valid cookie, including en on a Thai phone, is left alone", () => {
  assert.equal(initialLocaleCookie("en", "th-TH,th;q=0.9"), null);
  assert.equal(initialLocaleCookie("th", "en"), null);
});

test("an English or unknown phone gets no cookie", () => {
  assert.equal(initialLocaleCookie(undefined, "en-US"), null);
  assert.equal(initialLocaleCookie(undefined, undefined), null);
});
