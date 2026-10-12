/**
 * The hostnames the staff app is served on — the one list.
 *
 * Imported by src/lib/auth/same-origin.ts (upload routes) and next.config.ts
 * (`serverActions.allowedOrigins`); scripts/check-site-hosts.mjs checks that
 * every `httpHostHeader` in scripts/pi/cloudflared-config.yml is covered by it.
 * When the app moves host (README, "What the cutover changes here"), this file
 * changes with `httpHostHeader` in that config; a list that disagrees with the
 * address bar makes every Server Action and upload refuse while every page
 * still loads (the 2026-09-30 and 2026-10-01 outages).
 *
 * Plain strings only: next.config.ts and a Node script both read this file.
 */

/** Registrable domains: each admits itself and any single-label subdomain. */
export const SITE_DOMAINS = ["lannacare.org"];

/** `allowedOrigins` patterns: `*` is exactly one label, so the apex needs its own entry. */
export const SITE_ALLOWED_ORIGINS = SITE_DOMAINS.flatMap((d) => [d, `*.${d}`]);

/** Whether `hostname` (no port) is a site domain or one label below it. */
export function isSiteHostname(hostname: string): boolean {
  return SITE_DOMAINS.some((d) => {
    if (hostname === d) return true;
    const suffix = `.${d}`;
    return hostname.endsWith(suffix) && !hostname.slice(0, -suffix.length).includes(".");
  });
}
