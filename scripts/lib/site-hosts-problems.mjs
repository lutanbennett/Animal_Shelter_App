// Pre-flight rules for the hostnames in wrangler.jsonc and the Pi's
// cloudflared config, as a pure function so scripts/check-site-hosts.mjs can run
// it on the real files AND on deliberately broken copies (proving each rule fires).
// Why these rules: docs/decisions/2026-11-04-cutover-preflight.md.
import { isSiteHostname } from "../../src/lib/site-hosts.ts";
import { lockedPublicSiteProblem, routeHosts } from "./wrangler.mjs";

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
export function hostProblems(config, ingressYml) {
  const out = [];
  const say = (ok, msg) => out.push({ ok, msg });
  const envs = config.env ?? {};
  const envHosts = (b) => ({ APP_HOST: b.vars?.APP_HOST, PUBLIC_HOST: b.vars?.PUBLIC_HOST });

  for (const [name, b] of Object.entries(envs)) {
    say(!!b.vars?.APP_HOST && !!b.vars?.PUBLIC_HOST, `${name} sets APP_HOST and PUBLIC_HOST`);
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

  // The live site must not open on the sign-in page.
  const uatHost = envs.uat?.vars?.APP_HOST;
  const lock = uatHost ? lockedPublicSiteProblem(config, "production", uatHost) : null;
  say(!lock, "production is not locked while routed away from UAT's address");
  return out;
}
