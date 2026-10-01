#!/usr/bin/env node
/**
 * Checks isPublicPath in src/lib/public-paths.ts: prefixes match at a
 * segment boundary ("/adopt" and "/adopt/12", not "/adoptive"), the open
 * site and the locked site each have their own list, and the proxy's
 * matcher no longer skips image extensions.
 *
 *   node scripts/check-public-paths.mjs
 */
import { readFileSync } from "node:fs";
import { isPublicPath } from "../src/lib/public-paths.ts";

const open = [
  "/", "/login", "/login/forgot", "/login/request", "/auth/callback", "/robots.txt", "/lca-logo.jpg",
  "/adopt", "/adopt/12", "/our-work", "/our-work/abc", "/foster", "/volunteer", "/donate", "/friends",
  "/privacy", "/r/CODE1", "/e/12", "/api/photos/abc",
];
const openNot = [
  "/adoptive", "/adopt-admin", "/our-workshop", "/fosterage", "/donate2", "/friends-only", "/privacy-admin",
  "/residents", "/admin", "/management/cashflow", "/api/status/alerts", "/api/photos", "/r", "/e",
  "/login/other", "/leaked.png", "/api/x.svg", "/manual/login.png",
];
const locked = ["/", "/login", "/login/forgot", "/login/request", "/auth/callback", "/robots.txt", "/lca-logo.jpg", "/privacy", "/privacy/x"];
const lockedNot = ["/adopt", "/r/CODE1", "/e/12", "/api/photos/abc", "/privacy-admin", "/privacyx", "/residents"];

let failed = 0;
const check = (path, isLocked, expected) => {
  const got = isPublicPath(path, isLocked);
  if (got !== expected) failed++;
  console.log(`${got === expected ? "ok  " : "FAIL"} ${isLocked ? "locked" : "open  "} ${path} -> ${got}`);
};
for (const p of open) check(p, false, true);
for (const p of openNot) check(p, false, false);
for (const p of locked) check(p, true, true);
for (const p of lockedNot) check(p, true, false);

const proxy = readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");
const skipsImages = /matcher:[^\]]*\\.\(\?:/.test(proxy);
if (skipsImages) failed++;
console.log(`${skipsImages ? "FAIL" : "ok  "} proxy matcher does not skip image extensions`);

console.log(failed ? `\n${failed} wrong` : "\nall right");
process.exit(failed ? 1 : 0);
