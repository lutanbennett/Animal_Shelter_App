import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { originKeyRefuses } from "@/lib/origin-key";
import { initialLocaleCookie, localeCookieName, localePathHeader } from "@/lib/i18n/locales";
import { hostRedirect, requestHost } from "@/lib/site-hosts";
import { isPublicPage, thPathRest } from "@/lib/public-paths";

/**
 * The scheduled alert run (src/app/api/status/alerts/route.ts) has no
 * session — the Worker's cron calls it with the service-role key as a
 * bearer, which the route checks. Exactly this path, POST only; everything
 * else goes through the session gate as before.
 */
const STATUS_ALERTS_PATH = "/api/status/alerts";
/** Same for the calendar sweep (src/app/api/calendar/sweep/route.ts). */
const CALENDAR_SWEEP_PATH = "/api/calendar/sweep";
/** The merchandise shop's daily supplier email (src/app/api/merch/supplier-emails/route.ts): same bearer guard. */
const MERCH_SUPPLIER_EMAILS_PATH = "/api/merch/supplier-emails";
/** The read-only health feed Home Assistant polls (src/app/api/status/health/route.ts): GET only, guarded by its own bearer token. */
const STATUS_HEALTH_PATH = "/api/status/health";

export default async function proxy(request: NextRequest) {
  // Pi only (see src/lib/origin-key.ts): refuse what did not come through the Worker.
  if (originKeyRefuses(request.headers.get("x-origin-key"), {
    ORIGIN_KEY: process.env.ORIGIN_KEY,
    PHOTO_CACHE_DIR: process.env.PHOTO_CACHE_DIR,
  })) {
    return new NextResponse("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  }
  // Never trust a client-sent language header: the proxy alone says what the path names.
  request.headers.delete(localePathHeader);
  // /th/<public page> is the Thai twin of <public page> (#t48xh slice A); null for anything else.
  const thRest = thPathRest(request.nextUrl.pathname);
  // Which address serves what (src/lib/site-hosts.ts): public pages on the public
  // address, the staff app on the app address, each sending the visitor to the other.
  // Navigations only; a Server Action is a POST and is answered where it was sent.
  if (request.method === "GET" || request.method === "HEAD") {
    const to = hostRedirect(
      requestHost((n) => request.headers.get(n)),
      thRest ?? request.nextUrl.pathname,
      { isPublicPage },
    );
    if (to) {
      return NextResponse.redirect(`https://${to}${request.nextUrl.pathname}${request.nextUrl.search}`, 307);
    }
  }
  if ((request.nextUrl.pathname === STATUS_ALERTS_PATH || request.nextUrl.pathname === CALENDAR_SWEEP_PATH || request.nextUrl.pathname === MERCH_SUPPLIER_EMAILS_PATH) && request.method === "POST") {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname === STATUS_HEALTH_PATH && request.method === "GET") {
    return NextResponse.next();
  }
  // A first visit from a Thai phone: no `locale` cookie yet, Thai first in
  // Accept-Language. Set the cookie (on the request, so this render sees it,
  // and on the response, so the browser keeps it); the toggle overwrites it
  // afterwards. A response that sets a cookie is never edge-cached
  // (worker/index.mjs), so this cannot leak a Thai page to anyone else.
  // A /th/ path names its language, so it sets no cookie and stays edge-cacheable.
  const start =
    !thRest &&
    request.method === "GET" && !request.nextUrl.pathname.startsWith("/api/")
      ? initialLocaleCookie(request.cookies.get(localeCookieName)?.value, request.headers.get("accept-language"))
      : null;
  if (start) request.cookies.set(localeCookieName, start);
  let rewriteTo: URL | undefined;
  if (thRest) {
    request.headers.set(localePathHeader, "th");
    request.nextUrl.pathname = thRest;
    rewriteTo = request.nextUrl.clone();
  }
  const response = await updateSession(request, rewriteTo);
  if (start) {
    response.cookies.set(localeCookieName, start, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

/**
 * Only Next's own build output and the favicon skip the gate. Image
 * extensions used to be skipped too, which meant any route whose path
 * ended in .png or .svg bypassed sign-in; the one static file public
 * pages need, /lca-logo.jpg, is on the public list instead.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
