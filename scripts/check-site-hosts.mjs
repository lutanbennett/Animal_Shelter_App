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
import { hostProblems, pinProblems } from "./lib/site-hosts-problems.mjs";
import { SITE_HOST_VARS } from "../src/lib/site-hosts.ts";
import { PI_WRANGLER_VARS, WORKER_ROUTED_VARS } from "./lib/runtime-config.mjs";

let failed = 0;
const say = (ok, msg) => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
};

const config = readWranglerConfig();
const yml = readFileSync(new URL("./pi/cloudflared-config.yml", import.meta.url), "utf8");
for (const r of hostProblems(config, yml)) say(r.ok, r.msg);

const deploySrc = readFileSync(new URL("./deploy.mjs", import.meta.url), "utf8");
const ctx = { siteHostVars: [...SITE_HOST_VARS], piWranglerVars: PI_WRANGLER_VARS, deploySrc };
for (const r of pinProblems(config, ctx)) say(r.ok, r.msg);

const cfg = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
say(/allowedOrigins:\s*siteAllowedOrigins\(\)/.test(cfg), "next.config.ts allowedOrigins comes from siteAllowedOrigins()");
for (const [name, block] of Object.entries(config.env ?? {})) {
  const v = block.vars ?? {};
  const o = siteAllowedOrigins({ APP_HOST: v.APP_HOST, PUBLIC_HOST: v.PUBLIC_HOST, PLATFORM_HOST: v.PLATFORM_HOST });
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
  "an environment with routes but no SUPABASE_URL": (c) => { delete c.env.uat.vars.SUPABASE_URL; },
  "two environments sharing one database": (c) => { c.env.uat.vars.SUPABASE_URL = c.env.production.vars.SUPABASE_URL; },
};
for (const [what, mutate] of Object.entries(broken)) {
  const c = clone();
  mutate(c);
  say(hostProblems(c, yml).some((r) => !r.ok), `caught: ${what}`);
}
{
  // The tunnel forgotten: production's tunnel presenting the old address, which must be caught
  // whether or not another environment covers it (UAT owned lannacare.org until 2026-11-08).
  const stale = yml.replace(/(hostname: pi\.lannacare\.org[\s\S]*?httpHostHeader:\s*)lannacareforanimals\.org/, "$1lannacare.org");
  say(stale !== yml && hostProblems(config, stale).some((r) => !r.ok && /pi\.lannacare\.org presents lannacare\.org/.test(r.msg)), "caught: tunnel still presents lannacare.org to production");
  const rest = hostProblems(config, yml).filter((r) => !r.ok);
  say(rest.length === 0, `the complete cutover state (wrangler.jsonc + tunnel) passes every rule${rest.length ? `: ${rest.map((r) => r.msg).join("; ")}` : ""}`);
}

{
  // The fault itself (#plhbd): a fourth host added to wrangler.jsonc, and to SITE_HOST_VARS, but not carried across.
  const fourth = clone();
  fourth.env.production.vars.EXTRA_HOST = "extra.example.org";
  const caught = (c, x) => pinProblems(c, x).some((r) => !r.ok);
  say(caught(fourth, { ...ctx, siteHostVars: [...ctx.siteHostVars, "EXTRA_HOST"] }), "caught: a fourth host in SITE_HOST_VARS that the Pi does not copy");
  say(caught(fourth, ctx), "caught: a fourth host in wrangler.jsonc that SITE_HOST_VARS does not list");
  say(caught(config, { ...ctx, piWranglerVars: ctx.piWranglerVars.filter((k) => k !== "PLATFORM_HOST") }), "caught: PLATFORM_HOST not copied onto the Pi");
  say(caught(config, { ...ctx, deploySrc: deploySrc.replace(/for\s*\(\s*const\s+\w+\s+of\s+SITE_HOST_VARS\s*\)/, "for (const key of [])") }), "caught: deploy.mjs no longer loops over SITE_HOST_VARS");
}

{
  // The registry drives the rule (#uatsb): each fixture must fail with the RIGHT message, not merely fail.
  const failing = (c, routed) => hostProblems(c, yml, routed).filter((r) => !r.ok).map((r) => r.msg);
  say(WORKER_ROUTED_VARS.some((v) => v.name === "SUPABASE_URL" && v.distinct), "the registry marks SUPABASE_URL routed-required and distinct");
  const missing = clone();
  delete missing.env.uat.vars.SUPABASE_URL;
  say(failing(missing).some((m) => /^uat sets SUPABASE_URL, which .* needs$/.test(m)), "caught, by name: uat routed but SUPABASE_URL missing");
  const shared = clone();
  shared.env.uat.vars.SUPABASE_URL = shared.env.production.vars.SUPABASE_URL;
  say(failing(shared).some((m) => /SUPABASE_URL is its own \(shared with /.test(m)), "caught, by name: uat and production share one SUPABASE_URL");
  // A setting added to the registry later is held to the same rule with no new code here.
  const next = [...WORKER_ROUTED_VARS, { name: "FUTURE_SETTING", distinct: false, needs: "a future consumer" }];
  say(failing(config, next).some((m) => /FUTURE_SETTING/.test(m)), "caught: a newly registered routed setting that no environment sets");
  // Legitimate absence is not a failure: an environment with no routes owes nothing, and PLATFORM_HOST is optional.
  const unrouted = clone();
  unrouted.env.uat.routes = [];
  delete unrouted.env.uat.vars.SUPABASE_URL;
  say(!failing(unrouted).some((m) => /^uat sets SUPABASE_URL/.test(m)), "not blamed: an environment with no routes and no SUPABASE_URL");
  // test and uat gained one in #pltst; an environment without the product's front door is still legitimate.
  const noPlatform = clone();
  delete noPlatform.env.uat.vars.PLATFORM_HOST;
  noPlatform.env.uat.routes = noPlatform.env.uat.routes.filter((r) => r.pattern !== config.env.uat.vars.PLATFORM_HOST);
  say(!failing(noPlatform).some((m) => /PLATFORM_HOST/.test(m)), "not blamed: an environment with no PLATFORM_HOST");
}

console.log(failed ? `\n${failed} wrong` : "\nall right");
await exitWith(failed ? 1 : 0);
