import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { originKeyRefuses } from "@/lib/origin-key";
import { initialLocaleCookie, localeCookieName } from "@/lib/i18n/locales";

/**
 * The scheduled alert run (src/app/api/status/alerts/route.ts) has no
 * session — the Worker's cron calls it with the service-role key as a
 * bearer, which the route checks. Exactly this path, POST only; everything
 * else goes through the session gate as before.
 */
const STATUS_ALERTS_PATH = "/api/status/alerts";

export default async function proxy(request: NextRequest) {
  // Pi only (see src/lib/origin-key.ts): refuse what did not come through the Worker.
  if (originKeyRefuses(request.headers.get("x-origin-key"), {
    ORIGIN_KEY: process.env.ORIGIN_KEY,
    PHOTO_CACHE_DIR: process.env.PHOTO_CACHE_DIR,
  })) {
    return new NextResponse("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  }
  if (request.nextUrl.pathname === STATUS_ALERTS_PATH && request.method === "POST") return NextResponse.next();
  // A first visit from a Thai phone: no `locale` cookie yet, Thai first in
  // Accept-Language. Set the cookie (on the request, so this render sees it,
  // and on the response, so the browser keeps it); the toggle overwrites it
  // afterwards. A response that sets a cookie is never edge-cached
  // (worker/index.mjs), so this cannot leak a Thai page to anyone else.
  const start =
    request.method === "GET" && !request.nextUrl.pathname.startsWith("/api/")
      ? initialLocaleCookie(request.cookies.get(localeCookieName)?.value, request.headers.get("accept-language"))
      : null;
  if (start) request.cookies.set(localeCookieName, start);
  const response = await updateSession(request);
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
