import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * The scheduled alert run (src/app/api/status/alerts/route.ts) has no
 * session — the Worker's cron calls it with the service-role key as a
 * bearer, which the route checks. Exactly this path, POST only; everything
 * else goes through the session gate as before.
 */
const STATUS_ALERTS_PATH = "/api/status/alerts";

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === STATUS_ALERTS_PATH && request.method === "POST") return NextResponse.next();
  return updateSession(request);
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
