#!/usr/bin/env node
/**
 * Pre-flight for the hostnames. Run it BEFORE any deploy that touches
 * wrangler.jsonc `vars`/`routes` or scripts/pi/cloudflared-config.yml (the
 * cutover to lannacareforanimals.org above all): a list that disagrees with the
 * address bar makes every Server Action and upload refuse while every page
 * still loads (the 2026-09-30 and 2026-10-01 outages).
 *
 * Rules are in scripts/lib/site-hosts-problems.mjs. Besides running them on the
 * real files, this script runs them on deliberately broken copies and fails if a
 * rule does not fire, so a green run means the rules work, not just that nothing
 * tripped. Also checks next.config.ts takes allowedOrigins from the settings.
 *
 *   node scripts/check-site-hosts.mjs
 */
import { exitWith } from "./lib/exit.mjs";
import { readFileSync } from "node:fs";
import { siteAllowedOrigins } from "../src/lib/site-hosts.ts";
import { readWranglerConfig } from "./lib/wrangler.mjs";
import { hostProblems } from "./lib/site-hosts-problems.mjs";

let failed = 0;
const say = (ok, msg) => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
};

const config = readWranglerConfig();
const yml = readFileSync(new URL("./pi/cloudflared-config.yml", import.meta.url), "utf8");
for (const r of hostProblems(config, yml)) say(r.ok, r.msg);

const cfg = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
say(/allowedOrigins:\s*siteAllowedOrigins\(\)/.test(cfg), "next.config.ts allowedOrigins comes from siteAllowedOrigins()");
for (const [name, block] of Object.entries(config.env ?? {})) {
  const v = block.vars ?? {};
  const o = siteAllowedOrigins({ APP_HOST: v.APP_HOST, PUBLIC_HOST: v.PUBLIC_HOST });
  say(o.length > 0, `${name}: allowedOrigins = ${JSON.stringify(o)}`);
}

// Self-proof: each broken copy must make at least one rule fail.
console.log("\nrules fire on broken copies:");
const clone = () => JSON.parse(JSON.stringify(config));
const NEW = "lannacareforanimals.org";
// Written after the 2026-11-06 cutover: the file on disk is the cutover state, so each broken
// copy undoes or spoils one part of it.
const broken = {
  "an environment missing PUBLIC_HOST": (c) => { delete c.env.uat.vars.PUBLIC_HOST; },
  "two environments claiming one route": (c) => { c.env.uat.routes = [{ pattern: NEW, custom_domain: true }]; },
  "a route outside its environment's hosts": (c) => { c.env.production.routes.push({ pattern: "lannacare.org", custom_domain: true }); },
  "production on the new host but still locked": (c) => { c.env.production.vars.PUBLIC_SITE = "locked"; },
};
for (const [what, mutate] of Object.entries(broken)) {
  const c = clone();
  mutate(c);
  say(hostProblems(c, yml).some((r) => !r.ok), `caught: ${what}`);
}
{
  // The tunnel forgotten: its old header is still "covered" (UAT owns lannacare.org now), which is
  // why coverage by ANY environment is not enough.
  const stale = yml.replace(/(hostname: pi\.lannacare\.org[\s\S]*?httpHostHeader:\s*)lannacareforanimals\.org/, "$1lannacare.org");
  say(stale !== yml && hostProblems(config, stale).some((r) => !r.ok && /pi\.lannacare\.org presents lannacare\.org/.test(r.msg)), "caught: tunnel still presents lannacare.org to production");
  const rest = hostProblems(config, yml).filter((r) => !r.ok);
  say(rest.length === 0, `the complete cutover state (wrangler.jsonc + tunnel) passes every rule${rest.length ? `: ${rest.map((r) => r.msg).join("; ")}` : ""}`);
}

console.log(failed ? `\n${failed} wrong` : "\nall right");
await exitWith(failed ? 1 : 0);
