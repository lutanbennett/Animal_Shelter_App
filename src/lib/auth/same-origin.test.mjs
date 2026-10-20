import test from "node:test";
import assert from "node:assert/strict";
import { refuseCrossSite } from "./same-origin.ts";

// The addresses are settings (src/lib/site-hosts.ts); these are made-up ones.
process.env.APP_HOST = "app.example.org";
process.env.PUBLIC_HOST = "example.net";

const req = (headers) => new Request("http://localhost:3000/api/upload", { method: "POST", headers });
const refused = (headers) => refuseCrossSite(req(headers)) !== null;

test("Sec-Fetch-Site: cross-site is refused whatever else is true", () => {
  assert.equal(refused({ "sec-fetch-site": "cross-site" }), true);
  assert.equal(refused({ "sec-fetch-site": "cross-site", origin: "https://app.example.org", host: "app.example.org" }), true);
});

test("a refusal is a 403 with a JSON error", async () => {
  const res = refuseCrossSite(req({ "sec-fetch-site": "cross-site" }));
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { error: "Cross-site request refused." });
});

test("same-origin, same-site and none pass", () => {
  for (const v of ["same-origin", "same-site", "none"]) assert.equal(refused({ "sec-fetch-site": v }), false, v);
});

test("an Origin on either configured address passes, with or without www", () => {
  for (const o of ["https://app.example.org", "https://www.app.example.org", "https://example.net", "https://www.example.net", "https://app.example.org:443"]) {
    assert.equal(refused({ origin: o, host: "elsewhere" }), false, o);
  }
});

test("look-alike and other-site Origins are refused", () => {
  for (const o of [
    "https://evil.com", "https://app.example.org.evil.com", "https://evil-app.example.org", "https://evilapp.example.org",
    "https://a.b.app.example.org", "https://app.example.org@evil.com", "https://app.example.com", "http://evil.com:3000",
  ]) assert.equal(refused({ origin: o, host: "app.example.org" }), true, o);
});

test("an Origin equal to the Host header passes (localhost under next dev)", () => {
  assert.equal(refused({ origin: "http://localhost:3000", host: "localhost:3000" }), false);
  assert.equal(refused({ origin: "http://localhost:3001", host: "localhost:3000" }), true);
  assert.equal(refused({ origin: "http://localhost:3000" }), true, "no Host to match, not our domain");
});

test("Origin: null and an unparseable Origin are refused", () => {
  assert.equal(refused({ origin: "null" }), true);
  assert.equal(refused({ origin: "not a url", host: "app.example.org" }), true);
});

test("a request with neither header is not a browser cross-site post and passes", () => {
  assert.equal(refused({}), false);
});
