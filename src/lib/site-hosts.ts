/**
 * The three addresses the system answers on — settings, never literals.
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

export function platformHost(env: Record<string, string | undefined> = process.env): string | null {
  return clean(env.PLATFORM_HOST);
}

export function publicHost(env: Record<string, string | undefined> = process.env): string | null {
  return clean(env.PUBLIC_HOST);
}

/**
 * The environment variables that name an address this system answers on, and
 * therefore exactly the ones `siteHosts()` below reads.
 *
 * **It is a list because two other places must carry these values to where
 * `siteHosts()` can see them, and both were easy to forget.** `allowedOrigins`
 * is baked at BUILD time, while `wrangler.jsonc` `vars` are RUNTIME values, so
 * a host declared only in wrangler.jsonc never reaches the bundle at all:
 *
 *  - `scripts/deploy.mjs` pins each of these into the Worker build's env, and
 *  - `scripts/lib/runtime-config.mjs` declares each one `source: "wrangler"`,
 *    which is how `scripts/pi/write-env.mjs` copies it to the Pi.
 *
 * `PLATFORM_HOST` was added here and to wrangler.jsonc and missed in BOTH of
 * those (`#plhbd`), so every Server Action on `cooperjaidee.org` was refused
 * while every page rendered — the failure `docs/domain-checklist.md` section F
 * predicts, and tells you to prove by SAVING rather than by loading.
 * `site-hosts.test.mjs` now fails if a name here is missing from either place.
 */
export const SITE_HOST_VARS = ["APP_HOST", "PUBLIC_HOST", "PLATFORM_HOST"] as const;

/** The configured hosts, plus `www.` of each: the apex and www answer together. */
export function siteHosts(env: Record<string, string | undefined> = process.env): string[] {
  const hosts = [appHost(env), publicHost(env), platformHost(env)].filter((h): h is string => !!h);
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

/**
 * Where "Staff login" on a public page points: the app address's /login when the
 * addresses are split (an absolute link, so no redirect hop on every click),
 * otherwise the relative path, which is already the right address.
 */
export function staffLoginHref(env: Record<string, string | undefined> = process.env): string {
  return (isSplit(env) && appUrl("/login", env)) || "/login";
}

/** Whether `hostname` is the platform front door (apex or www). */
export function isPlatformHostname(hostname: string, env: Record<string, string | undefined> = process.env): boolean {
  const p = platformHost(env);
  return !!p && (hostname.toLowerCase() === p || hostname.toLowerCase() === `www.${p}`);
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

/**
 * What the platform front door serves: the console, sign-in and the second step, plus what they load.
 * Everything else is a shelter's page and would come up empty with no shelter header.
 */
const PLATFORM_KEEPS = ["/platform", "/login", "/auth/", "/api/", "/admin/security/verify", "/lca-logo.jpg", "/lca-logo-160.jpg", "/lca-logo.png", "/lca-logo-transparent.png", "/robots.txt", "/sitemap.xml", "/th/platform/about", "/privacy"];

/**
 * On the platform host, the path a navigation should be sent to instead, or null to serve it here.
 * Any shelter page goes to the console. Only for GET/HEAD; a Server Action is a POST.
 */
export function platformRedirect(
  host: string | null,
  pathname: string,
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (!host || !isPlatformHostname(host, env)) return null;
  const kept = PLATFORM_KEEPS.some((k) => (k.endsWith("/") ? pathname.startsWith(k) : pathname === k || pathname.startsWith(`${k}/`)));
  if (pathname === "/") return "/platform/about"; // #apxld: the product page, not the console
  return kept ? null : "/platform";
}
