import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  PASSWORD_CHANGE_PATH,
  mustChangePassword,
  signedInWithPassword,
} from "@/lib/auth/password-change";
import { hasAppAccess, loadCurrentRole, signedInLandingPath } from "@/lib/auth/app-access";
import { safeNextPath } from "@/lib/auth/next-path";
import { isPublicPath as isPublicPathname } from "@/lib/public-paths";
import { isPublicSiteLocked } from "@/lib/public-site";

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

  const locked = isPublicSiteLocked();
  const isPublicPath = isPublicPathname(request.nextUrl.pathname, locked);

  // Signed out: to /login, remembering where they were going so the
  // sign-in lands them back there, not on the residents list.
  // src/lib/auth/next-path.ts. (Enclosure QR codes, /e/…, and resident
  // cards, /r/…, are public pages and only come through here while the
  // public site is locked — then the scan resumes after sign-in.)
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", next);
    return noindex(NextResponse.redirect(url), locked);
  }

  // "/" is the public home page for everyone — a signed-in staff member
  // sees it as a visitor does, with "Open the app" in its header.
  if (user && request.nextUrl.pathname === "/login") {
    const role = await loadCurrentRole(supabase);
    // A session that opens nothing (archived since it signed in, or never
    // given a role) is ended here, so /login offers a fresh sign-in.
    if (!role) {
      await supabase.auth.signOut();
      return noindex(response, locked);
    }
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return noindex(
      NextResponse.redirect(new URL(signedInLandingPath(role, next), request.nextUrl.origin)),
      locked,
    );
  }

  // An account on a temporary password (src/lib/auth/password-change.ts)
  // goes nowhere but the change-password page until it has its own — when
  // it signed in with that password. A Google sign-in used no password and
  // carries on. Public paths and the photo proxy are left alone so the
  // page itself, and images on it, still load. (The open-site list, locked
  // or not: the lock is about strangers, not about this.)
  if (
    user &&
    !isPublicPathname(request.nextUrl.pathname) &&
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
      return noindex(NextResponse.redirect(url), locked);
    }
  }

  // The app itself is for staff roles only (src/lib/auth/app-access.ts).
  // A public viewer is sent to the home page — it is signed in, so the
  // public site is open to it even while locked. A session with no role at
  // all (archived after it signed in; sign-in refuses one without) is
  // signed out and told why. The change-password page stays reachable to
  // anyone on a temporary password. One role lookup per app request; the
  // public pages, where visitors and public viewers are, skip it.
  if (
    user &&
    !isPublicPathname(request.nextUrl.pathname) &&
    request.nextUrl.pathname !== PASSWORD_CHANGE_PATH
  ) {
    const role = await loadCurrentRole(supabase);
    if (!hasAppAccess(role)) {
      const url = request.nextUrl.clone();
      url.search = "";
      if (role) {
        url.pathname = "/";
      } else {
        await supabase.auth.signOut();
        url.pathname = "/login";
        url.searchParams.set("error", "no_role");
      }
      return noindex(withCookies(NextResponse.redirect(url), response), locked);
    }
  }

  return noindex(response, locked);
}

/**
 * A redirect built after the Supabase client has set cookies (a refreshed
 * token, or the cleared ones from signOut) must carry them, or the browser
 * keeps the old session.
 */
function withCookies(redirect: NextResponse, from: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

/**
 * While the public site is locked nothing on this host is for search
 * engines — pages, redirects, the landing page. Set here rather than per
 * page so nothing can be missed; robots.txt (src/app/robots.ts) says the
 * same to crawlers that read it first.
 */
function noindex(response: NextResponse, locked: boolean): NextResponse {
  if (locked) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
