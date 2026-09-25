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
 * /donate site_pages / site_content (0059), /friends public_shelter_friends
 * (0076), and /privacy is static text
 * (the notice Google's consent screen links to). /r/ is the address on a
 * resident's RFID card: a visitor sees the resident's public card there
 * (public_resident_cards, 0068) and a signed-in user is sent on to the
 * hub (src/app/r/[code]/page.tsx). /e/ is the address on an enclosure's
 * QR code and works the same way: a visitor sees the enclosure and who
 * lives there (public_enclosures, 0079), a signed-in user is sent on to
 * the enclosure page (src/app/e/[id]/page.tsx). /robots.txt is
 * src/app/robots.ts, which a crawler fetches signed out.
 */
export const PUBLIC_PATHS = ["/", "/login", "/login/forgot", "/auth/callback", "/robots.txt"];

export const PUBLIC_PATH_PREFIXES = [
  "/api/photos/",
  "/adopt",
  "/our-work",
  "/foster",
  "/volunteer",
  "/donate",
  "/friends",
  "/privacy",
  "/r/",
  "/e/",
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
export const LOCKED_PUBLIC_PATHS = ["/", "/login", "/login/forgot", "/auth/callback", "/robots.txt"];

export const LOCKED_PUBLIC_PATH_PREFIXES = ["/privacy"];

export function isPublicPath(pathname: string, locked = false): boolean {
  if (locked) {
    return (
      LOCKED_PUBLIC_PATHS.includes(pathname) ||
      LOCKED_PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    );
  }
  return (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/** The public *pages* (not /login or the photo proxy): no app chrome. */
export function isPublicPage(pathname: string): boolean {
  return (
    pathname === "/" ||
    ["/adopt", "/our-work", "/foster", "/volunteer", "/donate", "/friends", "/privacy", "/r", "/e"].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) ,
    )
  );
}
