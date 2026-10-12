#!/usr/bin/env node
/**
 * Every `httpHostHeader` in scripts/pi/cloudflared-config.yml is the Host the
 * app believes it is served on, so it must be a host src/lib/site-hosts.ts
 * lists — otherwise Server Actions and uploads are refused on that host while
 * every page still loads (the 2026-09-30 and 2026-10-01 outages). Also checks
 * next.config.ts takes its allowedOrigins from the list, not a copy.
 *
 *   node scripts/check-site-hosts.mjs
 */
import { readFileSync } from "node:fs";
import { isSiteHostname, SITE_ALLOWED_ORIGINS } from "../src/lib/site-hosts.ts";

let failed = 0;
const say = (ok, msg) => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
};

const yml = readFileSync(new URL("./pi/cloudflared-config.yml", import.meta.url), "utf8");
const headers = [...yml.matchAll(/^\s*httpHostHeader:\s*(\S+)/gm)].map((m) => m[1]);
say(headers.length > 0, `cloudflared-config.yml has ${headers.length} httpHostHeader value(s)`);
for (const h of headers) say(isSiteHostname(h), `httpHostHeader ${h} is covered by src/lib/site-hosts.ts`);

const cfg = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
say(/allowedOrigins:\s*SITE_ALLOWED_ORIGINS/.test(cfg), "next.config.ts allowedOrigins comes from SITE_ALLOWED_ORIGINS");
say(SITE_ALLOWED_ORIGINS.length > 0, `SITE_ALLOWED_ORIGINS = ${JSON.stringify(SITE_ALLOWED_ORIGINS)}`);

console.log(failed ? `\n${failed} wrong` : "\nall right");
process.exit(failed ? 1 : 0);
