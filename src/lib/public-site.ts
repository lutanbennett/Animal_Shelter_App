/**
 * Whether this deployment's public website is open, locked or off.
 *
 * - **open** (unset — `next dev`, and the live site after the public launch):
 *   everyone sees the website.
 * - **locked** (`PUBLIC_SITE: "locked"`): strangers out, staff may preview.
 *   A signed-out visitor gets the sign-in landing page and every other
 *   website address redirects to /login; a signed-in login still sees the
 *   website, so staff can check it before go-live. Set on uat and
 *   production in wrangler.jsonc.
 * - **off** (`PUBLIC_SITE: "off"`): nobody sees the website on this
 *   deployment. Everything "locked" does for a signed-out visitor, and a
 *   signed-in login is sent into the app (or to /no-access when its cards
 *   open nothing) instead of to a website page. Set on the test Worker only,
 *   for an outside tester (#br3f3,
 *   docs/decisions/2026-11-09-website-off-on-test.md).
 *
 * OpenNext copies Worker vars onto process.env at request time, the same way
 * the Drive and service-role secrets arrive.
 *
 * Not derived from getAppEnv(): the live staff address reports "production" until
 * the cutover sets UAT_PROJECT_REF, so an environment check would not fire
 * where it is needed today (docs/decisions.md, 2026-09-25).
 *
 * Read per request, never at module scope: on the Worker the var is only on
 * process.env once a request is being handled.
 */
export type PublicSiteState = "open" | "locked" | "off";

export function publicSiteState(): PublicSiteState {
  const value = process.env.PUBLIC_SITE;
  if (value === "off") return "off";
  if (value === "locked") return "locked";
  return "open";
}

/**
 * Strangers are kept out: true for "locked" and for "off", which is locked
 * and more. Everything that keys on this (the signed-out path list,
 * robots.txt, the sitemap, the noindex header, the landing page) behaves the
 * same in both.
 */
export function isPublicSiteLocked(): boolean {
  return publicSiteState() !== "open";
}

/** Nobody — signed in or not — is shown a website page on this deployment. */
export function isPublicSiteOff(): boolean {
  return publicSiteState() === "off";
}
