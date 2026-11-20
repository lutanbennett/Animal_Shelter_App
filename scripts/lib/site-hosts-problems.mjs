// Pre-flight rules for the hostnames in wrangler.jsonc and the Pi's
// cloudflared config, as a pure function so scripts/check-site-hosts.mjs can run
// it on the real files AND on deliberately broken copies (proving each rule fires).
// Why these rules: docs/decisions/2026-11-04-cutover-preflight.md.
import { isSiteHostname } from "../../src/lib/site-hosts.ts";
import { routeHosts } from "./wrangler.mjs";
import { WORKER_ROUTED_VARS } from "./runtime-config.mjs";

/** Reads `- hostname:` / `httpHostHeader:` pairs out of the cloudflared ingress list. */
export function ingressRules(yml) {
  const rules = [];
  for (const line of yml.split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const h = line.match(/^\s*-\s*hostname:\s*(\S+)/);
    if (h) rules.push({ hostname: h[1], header: null });
    const hh = line.match(/^\s*httpHostHeader:\s*(\S+)/);
    if (hh && rules.length) rules[rules.length - 1].header = hh[1];
  }
  return rules;
}

/** Returns [{ ok, msg }] — every rule reports, so a pass is visible as well as a fail. */
export function hostProblems(config, ingressYml, routedVars = WORKER_ROUTED_VARS) {
  const out = [];
  const say = (ok, msg) => out.push({ ok, msg });
  const envs = config.env ?? {};
  const envHosts = (b) => ({ APP_HOST: b.vars?.APP_HOST, PUBLIC_HOST: b.vars?.PUBLIC_HOST, PLATFORM_HOST: b.vars?.PLATFORM_HOST });

  for (const [name, b] of Object.entries(envs)) {
    say(!!b.vars?.APP_HOST && !!b.vars?.PUBLIC_HOST, `${name} sets APP_HOST and PUBLIC_HOST`);
  }

  // Settings the Worker's own code needs on every request, declared in scripts/lib/runtime-config.mjs
  // with `routed: "required"` (today SUPABASE_URL). The Worker asks the database which shelter a
  // request host belongs to (worker/shelter.mjs resolveShelterSite) and gives up on its FIRST line
  // when SUPABASE_URL is unset: no header is sent, no shelter means no rows, and EVERY sign-in is
  // refused while every page still renders. UAT shipped that way and two database-level checks
  // passed throughout (#uatsb, 2026-11-20). A value added for one consumer quietly acquires a
  // second, so the rule comes from the registry, not from a list of names kept here.
  // Only an environment that answers on a route can be reached, so only those are held to it:
  // that is what separates "this environment does not have that setting" (no routes, or a setting
  // the registry does not mark routed-required, like PLATFORM_HOST on test and uat) from
  // "this environment is missing a setting it needs". Values marked `distinct` must also differ
  // between environments: copying a neighbour's would point a site at another's database.
  for (const { name: key, distinct, needs } of routedVars) {
    const seen = new Map();
    for (const [name, b] of Object.entries(envs)) {
      if (!routeHosts(config, name).length) continue;
      const value = b.vars?.[key];
      say(!!value, `${name} sets ${key}, which ${needs} needs`);
      if (!value || !distinct) continue;
      const other = seen.get(value);
      say(!other, `${name}: its ${key} is its own${other ? ` (shared with ${other})` : ""}`);
      if (!other) seen.set(value, name);
    }
  }

  // Two Workers cannot own one custom domain.
  const owner = new Map();
  let clash = false;
  for (const name of Object.keys(envs)) {
    for (const h of routeHosts(config, name)) {
      if (owner.has(h)) {
        clash = true;
        say(false, `${h} is a route of both ${owner.get(h)} and ${name}`);
      } else owner.set(h, name);
    }
  }
  if (!clash) say(true, "no custom-domain route is claimed by two environments");

  // A route the environment's own settings do not cover answers pages but refuses every action.
  for (const [name, b] of Object.entries(envs)) {
    const routes = routeHosts(config, name);
    if (!routes.length) continue;
    const bad = routes.filter((h) => !isSiteHostname(h, envHosts(b)));
    say(bad.length === 0, `${name}: every route host is one of its own APP_HOST/PUBLIC_HOST${bad.length ? ` (not: ${bad.join(", ")})` : ""}`);
    const missing = [b.vars?.APP_HOST, b.vars?.PUBLIC_HOST].filter((h) => h && !routes.includes(h));
    say(missing.length === 0, `${name}: its APP_HOST and PUBLIC_HOST are routed${missing.length ? ` (not routed: ${missing.join(", ")})` : ""}`);
  }

  // Each tunnel hostname serves ONE environment (the one whose ORIGIN_HOST it is); the Host it
  // presents must be that environment's own address, not merely somebody's.
  const rules = ingressRules(ingressYml);
  say(rules.length > 0, `cloudflared-config.yml has ${rules.length} ingress hostname(s)`);
  for (const r of rules) {
    const serves = Object.entries(envs).filter(([, b]) => b.vars?.ORIGIN_HOST === r.hostname).map(([n]) => n);
    say(serves.length === 1, `tunnel ${r.hostname} is the ORIGIN_HOST of exactly one environment${serves.length ? ` (${serves.join(", ")})` : ""}`);
    say(!!r.header, `tunnel ${r.hostname} sets httpHostHeader`);
    for (const n of serves) {
      say(!!r.header && isSiteHostname(r.header, envHosts(envs[n])), `tunnel ${r.hostname} presents ${r.header} — ${n}'s own address`);
    }
  }
  // An environment that names an origin must have a tunnel for it.
  for (const [name, b] of Object.entries(envs)) {
    const o = b.vars?.ORIGIN_HOST;
    if (o) say(rules.some((r) => r.hostname === o), `${name}: ORIGIN_HOST ${o} has a tunnel ingress`);
  }

  return out;
}

/**
 * The build-pinning invariant (#plhbd): every host an environment DECLARES in wrangler.jsonc `vars`
 * is carried into that environment's build and onto the Pi. wrangler `vars` are RUNTIME values, so a
 * host nobody carries across never reaches the bundle's serverActions.allowedOrigins, and every
 * button on it is refused while every page renders. NOT "every environment declares all hosts":
 * test and uat have no PLATFORM_HOST, and that is correct.
 *
 * ctx = { siteHostVars: SITE_HOST_VARS, piWranglerVars: PI_WRANGLER_VARS, deploySrc: text of scripts/deploy.mjs }
 */
export function pinProblems(config, ctx) {
  const out = [];
  const say = (ok, msg) => out.push({ ok, msg });
  const hostVars = new Set(ctx.siteHostVars);
  // ORIGIN_HOST names the Pi's tunnel, not an address people browse to; it is checked above.
  const looksLikeSiteHost = (k) => /_HOST$/.test(k) && k !== "ORIGIN_HOST";

  const unlisted = new Set();
  const notOnPi = new Set();
  for (const [name, b] of Object.entries(config.env ?? {})) {
    for (const key of Object.keys(b.vars ?? {})) {
      if (looksLikeSiteHost(key) && !hostVars.has(key)) unlisted.add(`${name}.${key}`);
      if (hostVars.has(key) && !ctx.piWranglerVars.includes(key)) notOnPi.add(key);
    }
  }
  say(unlisted.size === 0, `every *_HOST in wrangler.jsonc vars is in SITE_HOST_VARS, so the build pins it${unlisted.size ? ` (not listed: ${[...unlisted].join(", ")})` : ""}`);
  say(notOnPi.size === 0, `every declared site host is copied onto the Pi (runtime-config.mjs, source wrangler)${notOnPi.size ? ` (not copied: ${[...notOnPi].join(", ")})` : ""}`);
  say(/for\s*\(\s*const\s+\w+\s+of\s+SITE_HOST_VARS\s*\)\s*buildEnv\[/.test(ctx.deploySrc), "scripts/deploy.mjs pins the build by looping over SITE_HOST_VARS, not by naming hosts one by one");
  return out;
}
