import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];

/**
 * Path prefixes that stay reachable without a session, on top of
 * PUBLIC_PATHS. /api/photos/ is the image proxy (src/app/api/photos/[fileId]
 * /route.ts) — it must not be auth-gated, since (a) that's no more open than
 * today's direct Drive "anyone with the link" URLs it replaces, which this
 * proxy sits in front of, and (b) the public adoption listing under /adopt
 * renders photos for signed-out visitors and would otherwise 307-redirect
 * every <img> request to /login. /adopt itself is the public,
 * read-only "browse as guest" listing (Section 6 "Public/Anonymous" RBAC
 * tier) — scoped server-side to public_resident_profiles, never the
 * staff query path.
 */
const PUBLIC_PATH_PREFIXES = ["/api/photos/", "/adopt"];

/**
 * Refreshes the Supabase auth cookie on every request (required so server
 * components always see a valid session) and redirects signed-out users
 * away from everything except the public paths/prefixes above.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath =
    PUBLIC_PATHS.includes(request.nextUrl.pathname) ||
    PUBLIC_PATH_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/residents";
    return NextResponse.redirect(url);
  }

  return response;
}
