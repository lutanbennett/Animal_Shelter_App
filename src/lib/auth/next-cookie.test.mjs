import test from "node:test";
import assert from "node:assert/strict";
import { callbackUrl, nextCookieOptions, resolveNext } from "./next-cookie.ts";

test("the callback URL has no query string, whatever the destination", () => {
  for (const origin of ["https://cooperjaidee.org", "http://localhost:3003"]) {
    const url = new URL(callbackUrl(origin));
    assert.equal(url.search, "");
    assert.equal(url.pathname, "/auth/callback");
  }
});

test("the cookie is httpOnly, short-lived, callback-scoped; secure only on https", () => {
  const https = nextCookieOptions("https://x.org");
  assert.equal(https.httpOnly, true);
  assert.equal(https.secure, true);
  assert.equal(https.path, "/auth/callback");
  assert.ok(https.maxAge <= 600);
  assert.equal(nextCookieOptions("http://localhost:3003").secure, false);
});

test("the cookie is preferred, the query is a fallback", () => {
  assert.equal(resolveNext("/residents", "/other"), "/residents");
  assert.equal(resolveNext(null, "/other"), "/other");
  assert.equal(resolveNext(undefined, undefined), null);
});

test("safeNextPath is applied on read: a hostile cookie is refused, not trusted", () => {
  assert.equal(resolveNext("//evil.com", null), null);
  assert.equal(resolveNext("https://evil.com", null), null);
  assert.equal(resolveNext(String.fromCharCode(47, 92) + "evil.com", null), null);
  assert.equal(resolveNext("//evil.com", "/ok"), "/ok");
});
