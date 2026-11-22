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

/**
 * PER SHELTER (#wbsof, docs/decisions/2026-11-20-public-site-per-shelter.md). A request's state is the MORE CLOSED of
 * two: the deployment floor above (PUBLIC_SITE, one value for the whole Worker) and the shelter's own setting
 * (shelters.public_site, looked up by the Worker with the host and forwarded as PUBLIC_SITE_HEADER). A shelter can only
 * make its own site more closed than the floor, never less: off on the test Worker means every shelter is off,
 * whatever its column says. Reading the header is in public-site-request.ts; this file stays pure.
 */
export const PUBLIC_SITE_HEADER = "x-public-site";

const RANK: Record<PublicSiteState, number> = { open: 0, locked: 1, off: 2 };

function parse(value: string | null | undefined): PublicSiteState | null {
  return value === "off" || value === "locked" || value === "open" ? value : null;
}

/** The deployment-wide floor: PUBLIC_SITE, "open" when unset. */
export function deploymentSiteState(floor: string | undefined = process.env.PUBLIC_SITE): PublicSiteState {
  return parse(floor) ?? "open";
}

/** The state for one shelter's value. Nothing or garbage from the shelter means only the floor applies. */
export function publicSiteStateFor(
  shelterValue: string | null | undefined,
  floorValue: string | undefined = process.env.PUBLIC_SITE,
): PublicSiteState {
  const floor = deploymentSiteState(floorValue);
  const own = parse(shelterValue);
  return own && RANK[own] > RANK[floor] ? own : floor;
}

/**
 * Strangers are kept out: true for "locked" and for "off", which is locked
 * and more. Everything that keys on this (the signed-out path list,
 * robots.txt, the sitemap, the noindex header, the landing page) behaves the
 * same in both.
 */
export function isPublicSiteLocked(state: PublicSiteState): boolean {
  return state !== "open";
}

/** Nobody — signed in or not — is shown a website page on this shelter. */
export function isPublicSiteOff(state: PublicSiteState): boolean {
  return state === "off";
}

/**
 * The PRODUCT site's own search switch (#cjseo, docs/decisions/2026-11-22-cooperjaidee-product-page.md). The platform
 * host (cooperjaidee.org) is a different site from any shelter's, but it is served by the same Worker, so it used to
 * borrow the shelter's lock: unlocking a shelter at go-live would have opened the product site as a side effect.
 * It now has a switch of its own, the Worker var PLATFORM_SEARCH. **Anything but the exact word "open" is closed**,
 * so unset, empty and a typo all mean closed. Only the product page is ever for search engines; the rest of /platform
 * stays noindex by its own metadata whichever way this sits.
 */
export function isPlatformSearchOpen(value: string | undefined = process.env.PLATFORM_SEARCH): boolean {
  return value === "open";
}

/**
 * Whether search engines are told to keep out of a request. On the platform host ONLY the platform switch counts (the
 * shelter's lock says nothing about the product site, in either direction); on every other host it is the shelter's
 * lock, exactly as before.
 */
export function isSearchClosed(
  onPlatformHost: boolean,
  shelterLocked: boolean,
  platformValue: string | undefined = process.env.PLATFORM_SEARCH,
): boolean {
  return onPlatformHost ? !isPlatformSearchOpen(platformValue) : shelterLocked;
}
