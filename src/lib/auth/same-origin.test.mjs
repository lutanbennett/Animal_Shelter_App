import test from "node:test";
import assert from "node:assert/strict";
import { refuseCrossSite } from "./same-origin.ts";

const req = (headers) => new Request("http://localhost:3000/api/upload", { method: "POST", headers });
const refused = (headers) => refuseCrossSite(req(headers)) !== null;

test("Sec-Fetch-Site: cross-site is refused whatever else is true", () => {
  assert.equal(refused({ "sec-fetch-site": "cross-site" }), true);
  assert.equal(refused({ "sec-fetch-site": "cross-site", origin: "https://lannacare.org", host: "lannacare.org" }), true);
});

test("a refusal is a 403 with a JSON error", async () => {
  const res = refuseCrossSite(req({ "sec-fetch-site": "cross-site" }));
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { error: "Cross-site request refused." });
});

test("same-origin, same-site and none pass", () => {
  for (const v of ["same-origin", "same-site", "none"]) assert.equal(refused({ "sec-fetch-site": v }), false, v);
});

test("an Origin on our own domain passes, including one label below", () => {
  for (const o of ["https://lannacare.org", "https://test.lannacare.org", "https://pi.lannacare.org", "https://lannacare.org:443"]) {
    assert.equal(refused({ origin: o, host: "elsewhere" }), false, o);
  }
});

test("look-alike and other-site Origins are refused", () => {
  for (const o of [
    "https://evil.com", "https://lannacare.org.evil.com", "https://evil-lannacare.org", "https://evillannacare.org",
    "https://a.b.lannacare.org", "https://lannacare.org@evil.com", "https://lannacare.com", "http://evil.com:3000",
  ]) assert.equal(refused({ origin: o, host: "lannacare.org" }), true, o);
});

test("an Origin equal to the Host header passes (localhost under next dev)", () => {
  assert.equal(refused({ origin: "http://localhost:3000", host: "localhost:3000" }), false);
  assert.equal(refused({ origin: "http://localhost:3001", host: "localhost:3000" }), true);
  assert.equal(refused({ origin: "http://localhost:3000" }), true, "no Host to match, not our domain");
});

test("Origin: null and an unparseable Origin are refused", () => {
  assert.equal(refused({ origin: "null" }), true);
  assert.equal(refused({ origin: "not a url", host: "lannacare.org" }), true);
});

test("a request with neither header is not a browser cross-site post and passes", () => {
  assert.equal(refused({}), false);
});
