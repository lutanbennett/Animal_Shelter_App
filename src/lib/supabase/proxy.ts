import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  PASSWORD_CHANGE_PATH,
  mustChangePassword,
  signedInWithPassword,
} from "@/lib/auth/password-change";
import { DEFAULT_SIGNED_IN_PATH, safeNextPath } from "@/lib/auth/next-path";
import { isPublicPath as isPublicPathname } from "@/lib/public-paths";

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

  const isPublicPath = isPublicPathname(request.nextUrl.pathname);

  // Signed out: to /login, remembering where they were going so the
  // sign-in lands them back there — someone scanning an enclosure's QR
  // code (/e/…) or a resident's card (/r/…) should end up on that page,
  // not the residents list. src/lib/auth/next-path.ts.
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // "/" is the public home page for everyone — a signed-in staff member
  // sees it as a visitor does, with "Open the app" in its header.
  if (user && request.nextUrl.pathname === "/login") {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(
      new URL(next ?? DEFAULT_SIGNED_IN_PATH, request.nextUrl.origin),
    );
  }

  // An account on a temporary password (src/lib/auth/password-change.ts)
  // goes nowhere but the change-password page until it has its own — when
  // it signed in with that password. A Google sign-in used no password and
  // carries on. Public paths and the photo proxy are left alone so the
  // page itself, and images on it, still load.
  if (
    user &&
    !isPublicPath &&
    request.nextUrl.pathname !== PASSWORD_CHANGE_PATH &&
    mustChangePassword(user)
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (signedInWithPassword(session?.access_token)) {
      const url = request.nextUrl.clone();
      url.pathname = PASSWORD_CHANGE_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
