#!/usr/bin/env node
/**
 * Every `httpHostHeader` in scripts/pi/cloudflared-config.yml is the Host the
 * app believes it is served on, so it must be one of the addresses set in
 * wrangler.jsonc (APP_HOST / PUBLIC_HOST, read by src/lib/site-hosts.ts) —
 * otherwise Server Actions and uploads are refused on that host while every
 * page still loads (the 2026-09-30 and 2026-10-01 outages). Also checks
 * next.config.ts takes its allowedOrigins from the settings, not a copy, and
 * that every environment sets both.
 *
 *   node scripts/check-site-hosts.mjs
 */
import { readFileSync } from "node:fs";
import { siteAllowedOrigins, isSiteHostname } from "../src/lib/site-hosts.ts";
import { readWranglerConfig } from "./lib/wrangler.mjs";

let failed = 0;
const say = (ok, msg) => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
};

const envs = readWranglerConfig().env ?? {};
const all = {};
for (const [name, block] of Object.entries(envs)) {
  const v = block.vars ?? {};
  say(!!v.APP_HOST && !!v.PUBLIC_HOST, `${name} sets APP_HOST and PUBLIC_HOST`);
  for (const k of ["APP_HOST", "PUBLIC_HOST"]) if (v[k]) all[`${name}.${k}`] = v[k];
}
const covered = (h) => Object.values(all).some((a) => isSiteHostname(h, { APP_HOST: a }));

const yml = readFileSync(new URL("./pi/cloudflared-config.yml", import.meta.url), "utf8");
const headers = [...yml.matchAll(/^\s*httpHostHeader:\s*(\S+)/gm)].map((m) => m[1]);
say(headers.length > 0, `cloudflared-config.yml has ${headers.length} httpHostHeader value(s)`);
for (const h of headers) say(covered(h), `httpHostHeader ${h} is one of the addresses in wrangler.jsonc`);

const cfg = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
say(/allowedOrigins:\s*siteAllowedOrigins\(\)/.test(cfg), "next.config.ts allowedOrigins comes from siteAllowedOrigins()");
for (const [name, block] of Object.entries(envs)) {
  const v = block.vars ?? {};
  const o = siteAllowedOrigins({ APP_HOST: v.APP_HOST, PUBLIC_HOST: v.PUBLIC_HOST });
  say(o.length > 0, `${name}: allowedOrigins = ${JSON.stringify(o)}`);
}

console.log(failed ? `\n${failed} wrong` : "\nall right");
process.exit(failed ? 1 : 0);
