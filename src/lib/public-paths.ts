/**
 * The public tier of the site — reachable signed out, and rendered
 * without the app's header and sidebar signed in (a signed-in staff
 * member sees the same page a visitor does, plus an "Open the app"
 * button in the public header). Shared by the proxy (auth gate) and
 * the layout's PublicPathGate, so the two can't drift.
 *
 * /api/photos/ is the image proxy (src/app/api/photos/[fileId]/route.ts)
 * — it must not be auth-gated, since (a) that's no more open than the
 * direct Drive "anyone with the link" URLs it replaces and (b) the public
 * pages render photos for signed-out visitors and would otherwise
 * 307-redirect every <img> request to /login. /adopt reads
 * public_resident_profiles (Section 6 "Public/Anonymous" RBAC tier),
 * /our-work the public_projects views (0042), /foster, /volunteer,
 * /donate site_pages / site_content (0059, 0099), /friends public_shelter_friends
 * (0076), and /privacy is static text
 * (the notice Google's consent screen links to). /r/ is the address on a
 * resident's RFID card: a visitor sees the resident's public card there
 * (public_resident_cards, 0068) and a signed-in user is sent on to the
 * hub (src/app/r/[code]/page.tsx). /e/ is the address on an enclosure's
 * QR code and works the same way: a visitor sees the enclosure and who
 * lives there (public_enclosures, 0079), a signed-in user is sent on to
 * the enclosure page (src/app/e/[id]/page.tsx). /robots.txt is
 * src/app/robots.ts, which a crawler fetches signed out, and /sitemap.xml
 * (src/app/sitemap.ts) is what it names — an empty list while the site is
 * locked, so it is reachable in both states like robots.txt. /lca-logo.jpg is the
 * one static file the proxy still sees (its matcher no longer skips image
 * extensions) — the logo on the login page and the public header.
 * /api/version (src/app/api/version/route.ts) is the build's version and
 * commit, nothing else; deploy and migration tooling ask it signed out, on
 * locked environments too. Exact path only. It is not an isPublicPage()
 * page, so the Worker never edge-caches it.
 */
export const PUBLIC_PATHS = ["/", "/login", "/login/forgot", "/login/request", "/auth/callback", "/robots.txt", "/sitemap.xml", "/lca-logo.jpg", "/lca-logo-160.jpg", "/api/version"];

/**
 * The public *pages* — the one list. The proxy (isPublicPath), the layout gate
 * (isPublicPage) and the Worker (worker/index.mjs, which decides what the edge
 * caches) all derive from it; do not write these prefixes out anywhere else.
 */
export const PUBLIC_PAGE_PREFIXES = ["/adopt", "/our-work", "/foster", "/volunteer", "/donate", "/about", "/friends", "/privacy", "/r", "/e"];

/** Pages that exist only per item (/r/CODE, /e/ID): the bare "/r" and "/e" are not public paths. */
const PER_ITEM_PAGE_PREFIXES = ["/r", "/e"];

/**
 * Public pages the Worker must NOT keep in the edge cache. /r/ and /e/ are
 * per-resident and per-enclosure pages read live from public_resident_cards
 * and public_enclosures: a copy kept for ten minutes could show a resident or
 * enclosure that has since been withdrawn, and a card scan wants the current
 * state. They are also low traffic, so caching buys almost nothing. Decided
 * 2026-10-12 (docs/decisions/2026-10-12-r-and-e-not-edge-cached.md); this is
 * what the Worker's old, separate list already did.
 */
export const NOT_EDGE_CACHED_PAGE_PREFIXES = ["/r", "/e"];

/** What the Worker may edge-cache: every public page except the above. */
export const EDGE_CACHED_PAGE_PREFIXES = PUBLIC_PAGE_PREFIXES.filter((p) => !NOT_EDGE_CACHED_PAGE_PREFIXES.includes(p));

export const PUBLIC_PATH_PREFIXES = [
  "/api/photos/",
  ...PUBLIC_PAGE_PREFIXES.map((p) => (PER_ITEM_PAGE_PREFIXES.includes(p) ? `${p}/` : p)),
];

/**
 * What stays reachable signed out while the public site is locked
 * (src/lib/public-site.ts): sign-in and its callback, the landing page at
 * "/" (the home page renders it for a signed-out visitor), robots.txt, and
 * /privacy — Google's OAuth consent screen links to it, and lists the
 * homepage too, which is why "/" is a real page rather than a redirect.
 * No /api/photos/: the landing page shows only the static logo, and every
 * page that renders Drive photos is behind sign-in, so its <img> requests
 * carry the session cookie. No /r/ or /e/ either: a scanned card or QR
 * code lands on /login with ?next= and goes back there after sign-in.
 */
export const LOCKED_PUBLIC_PATHS = ["/", "/login", "/login/forgot", "/login/request", "/auth/callback", "/robots.txt", "/sitemap.xml", "/lca-logo.jpg", "/lca-logo-160.jpg", "/api/version"];

export const LOCKED_PUBLIC_PATH_PREFIXES = ["/privacy"];

/**
 * Whether `pathname` is under `prefix` at a segment boundary: "/adopt" and
 * "/adopt/12" are, "/adoptive" is not. A prefix ending in "/" already
 * names a segment boundary and is matched as written.
 */
function underPrefix(pathname: string, prefix: string): boolean {
  if (prefix.endsWith("/")) return pathname.startsWith(prefix);
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicPath(pathname: string, locked = false): boolean {
  const paths = locked ? LOCKED_PUBLIC_PATHS : PUBLIC_PATHS;
  const prefixes = locked ? LOCKED_PUBLIC_PATH_PREFIXES : PUBLIC_PATH_PREFIXES;
  return paths.includes(pathname) || prefixes.some((prefix) => underPrefix(pathname, prefix));
}

/** The public *pages* (not /login or the photo proxy): no app chrome. */
export function isPublicPage(pathname: string): boolean {
  return pathname === "/" || PUBLIC_PAGE_PREFIXES.some((prefix) => underPrefix(pathname, prefix));
}

/** Whether the Worker may edge-cache this public page. */
export function isEdgeCachedPage(pathname: string): boolean {
  return pathname === "/" || EDGE_CACHED_PAGE_PREFIXES.some((prefix) => underPrefix(pathname, prefix));
}
