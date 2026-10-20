/**
 * The two addresses the system answers on — settings, never literals.
 *
 * APP_HOST    the staff app (sign-in, residents, medical, Settings…).
 * PUBLIC_HOST the shelter's public website (/, /adopt, /r/…, the photo route).
 *
 * Both are set per environment in wrangler.jsonc `vars` (hostnames, no scheme)
 * and reach the Pi through scripts/pi/write-env.mjs and the build through
 * scripts/deploy.mjs. Equal or unset means one address serves everything — the
 * state of `next dev`, test, and production until the public site moves. Moving
 * the staff app to its Cooper address later is a new hostname in APP_HOST, not
 * a code change (docs/domain-checklist.md lists the places outside the code).
 *
 * Imported by src/proxy.ts (which address serves which path), by
 * src/lib/auth/same-origin.ts (upload routes) and next.config.ts
 * (`serverActions.allowedOrigins`); scripts/check-site-hosts.mjs checks that
 * every `httpHostHeader` in scripts/pi/cloudflared-config.yml is covered by
 * the settings. A list that disagrees with the address bar makes every Server
 * Action and upload refuse while every page still loads (the 2026-09-30 and
 * 2026-10-01 outages).
 *
 * Plain TypeScript with no imports: next.config.ts and Node scripts read it.
 */

const clean = (v: string | undefined): string | null => {
  const h = (v ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return h || null;
};

export function appHost(env: Record<string, string | undefined> = process.env): string | null {
  return clean(env.APP_HOST);
}

export function publicHost(env: Record<string, string | undefined> = process.env): string | null {
  return clean(env.PUBLIC_HOST);
}

/** The configured hosts, plus `www.` of each: the apex and www answer together. */
export function siteHosts(env: Record<string, string | undefined> = process.env): string[] {
  const hosts = [appHost(env), publicHost(env)].filter((h): h is string => !!h);
  return [...new Set(hosts.flatMap((h) => (h.startsWith("www.") ? [h] : [h, `www.${h}`])))];
}

/** `allowedOrigins` patterns for next.config.ts. */
export function siteAllowedOrigins(env: Record<string, string | undefined> = process.env): string[] {
  return siteHosts(env);
}

/** Whether `hostname` (no port) is one of the configured addresses. */
export function isSiteHostname(hostname: string, env: Record<string, string | undefined> = process.env): boolean {
  return siteHosts(env).includes(hostname.toLowerCase());
}

/** `https://host/path` for a configured address, or null when it is not set. */
export function appUrl(path = "/", env: Record<string, string | undefined> = process.env): string | null {
  const h = appHost(env);
  return h ? `https://${h}${path}` : null;
}

export function publicUrl(path = "/", env: Record<string, string | undefined> = process.env): string | null {
  const h = publicHost(env);
  return h ? `https://${h}${path}` : null;
}

/** Whether the two addresses differ, i.e. the system is split. */
export function isSplit(env: Record<string, string | undefined> = process.env): boolean {
  const a = appHost(env);
  const p = publicHost(env);
  return !!a && !!p && a !== p;
}

/** The host a request was reached on, port removed. `x-lanna-public-host` is set by the Worker and survives cloudflared, which rewrites Host and x-forwarded-host. */
export function requestHost(get: (name: string) => string | null): string | null {
  const raw = get("x-lanna-public-host") ?? get("x-forwarded-host") ?? get("host");
  return raw ? raw.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "") : null;
}

/**
 * Paths the app address serves itself although they are public pages: Google's
 * consent screen links the app domain's home page and /privacy.
 */
const APP_KEEPS = ["/", "/privacy"];

/** Public-site pages and assets (path prefixes, segment boundary). Passed in so this file imports nothing. */
export type SitePathRules = {
  isPublicPage: (pathname: string) => boolean;
};

/**
 * Which address should serve this GET/HEAD navigation: the host to send the
 * visitor to, or null to serve it here. Public pages belong on the public
 * address; everything else on the app address. /api/* and the photo route are
 * answered wherever they are asked (public pages load their own images and
 * staff pages theirs); Server Actions are POSTs and never redirected.
 */
export function hostRedirect(
  host: string | null,
  pathname: string,
  rules: SitePathRules,
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (!isSplit(env) || !host) return null;
  const app = appHost(env)!;
  const pub = publicHost(env)!;
  if (pathname.startsWith("/api/")) return null;
  const isPublic = rules.isPublicPage(pathname) || pathname === "/robots.txt" || pathname === "/sitemap.xml" || pathname.startsWith("/lca-logo");
  if (host === pub || host === `www.${pub}`) {
    // Sign-in and everything behind it is the app's.
    return isPublic ? null : app;
  }
  if (host === app || host === `www.${app}`) {
    if (!rules.isPublicPage(pathname)) return null;
    return APP_KEEPS.includes(pathname) ? null : pub;
  }
  return null;
}
