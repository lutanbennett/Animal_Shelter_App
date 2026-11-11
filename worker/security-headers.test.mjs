import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CSP, SECURITY_HEADERS, withSecurityHeaders } from "./security-headers.mjs";

const directive = (name) => CSP.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

test("connect-src permits Drive's resumable upload host, by name and not by wildcard", () => {
  const hosts = directive("connect-src").split(" ");
  assert.ok(hosts.includes("https://www.googleapis.com"));
  assert.ok(!hosts.some((h) => h === "*" || h === "https:" || h.includes("*.googleapis")));
});

test("the host of Drive's upload endpoint (the session URL the browser PUTs to) is allowed by connect-src", () => {
  const src = readFileSync(new URL("../src/lib/google/drive.ts", import.meta.url), "utf8");
  const m = /DRIVE_UPLOAD_API = "(https:\/\/[^/"]+)/.exec(src);
  assert.ok(m, "DRIVE_UPLOAD_API not found in drive.ts");
  assert.ok(directive("connect-src").split(" ").includes(m[1]), `${m[1]} is where videos are sent but is missing from connect-src`);
});

test("HSTS is one year, without includeSubDomains or preload, on a real response", () => {
  const res = withSecurityHeaders(new Response("ok"));
  assert.equal(res.headers.get("strict-transport-security"), "max-age=31536000");
  assert.equal(SECURITY_HEADERS["strict-transport-security"], "max-age=31536000");
});
