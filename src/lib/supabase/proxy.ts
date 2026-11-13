import { createServerClient } from "@supabase/ssr";
import { authCookieOptions } from "./cookie-options";
import { NextResponse, type NextRequest } from "next/server";
import {
  PASSWORD_CHANGE_PATH,
  mustChangePassword,
  signedInWithPassword,
} from "@/lib/auth/password-change";
import { loadSessionRole, signedInLandingPath } from "@/lib/auth/app-access";
import { DEFAULT_SIGNED_IN_PATH, NO_ACCESS_PATH, safeNextPath } from "@/lib/auth/next-path";
import { isPublicPath as isPublicPathname, isWebsitePageWhenOff } from "@/lib/public-paths";
import { ADOPTER_PATH, loadAdopterScope } from "@/lib/adopter/scope";
import { isPublicSiteLocked, isPublicSiteOff } from "@/lib/public-site";

/**
 * Refreshes the Supabase auth cookie on every request (required so server
 * components always see a valid session) and redirects signed-out users
 * away from everything except the public paths/prefixes above.
 */
export async function updateSession(request: NextRequest, rewriteTo?: URL) {
  // rewriteTo: serve a different path than the one asked for (/th/x -> /x), same gate decisions.
  const pass = () => (rewriteTo ? NextResponse.rewrite(rewriteTo, { request }) : NextResponse.next({ request }));
  let response = pass();

  // Read before getUser(): a refresh the server refuses makes the client
  // clear these cookies, and this is what tells "signed in, now expired"
  // from "never signed in".
  const hadSession = request.cookies.getAll().some((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = pass();
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
  // "off" is locked and more: no website for a signed-in login either
  // (src/lib/public-site.ts, #br3f3).
  const off = isPublicSiteOff();
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
    // A session that was there and no longer is (the 60-day inactivity
    // timeout, a revoked refresh token) is told so, and the redirect carries
    // the cleared cookies so /login does not retry the dead token.
    if (hadSession) url.searchParams.set("error", "expired");
    return noindex(withCookies(NextResponse.redirect(url), response), locked);
  }

  // "/" is the public home page for everyone — a signed-in staff member
  // sees it as a visitor does, with "Open the app" in its header.
  if (user && request.nextUrl.pathname === "/login") {
    const role = await loadSessionRole(supabase);
    // An adopter (verified email = a live contact, no staff card) lands on the page for sending news (#l5gxn).
    if (!role?.entersApp && (await loadAdopterScope(supabase))) {
      return noindex(NextResponse.redirect(new URL(ADOPTER_PATH, request.nextUrl.origin)), locked);
    }
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

  // Website off: "/" is no page for a signed-in login. Sent where a fresh
  // sign-in lands — the app, or /no-access when its cards open nothing —
  // as a plain redirect here, because the page's own redirect
  // (src/app/page.tsx, kept as a backstop) arrives only after the root
  // loading screen has started streaming.
  if (user && off && request.nextUrl.pathname === "/") {
    const role = await loadSessionRole(supabase);
    const url = request.nextUrl.clone();
    url.pathname = signedInLandingPath(role, null);
    url.search = "";
    return noindex(withCookies(NextResponse.redirect(url), response), locked);
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
  //
  // While the website is off a signed-in login gets the locked list too, so
  // a website page comes through here: an app user is sent to the app's
  // home, and a login whose cards open nothing goes to /no-access — never
  // to "/", and /no-access is let through for it, so nothing can loop. An
  // edge redirect from "/" to /home looped exactly that login (#br3f3).
  if (
    user &&
    !isPublicPathname(request.nextUrl.pathname, off) &&
    request.nextUrl.pathname !== PASSWORD_CHANGE_PATH
  ) {
    const role = await loadSessionRole(supabase);
    if (off && role?.entersApp && isWebsitePageWhenOff(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = DEFAULT_SIGNED_IN_PATH;
      url.search = "";
      return noindex(withCookies(NextResponse.redirect(url), response), locked);
    }
    if (off && role && !role.entersApp && request.nextUrl.pathname === NO_ACCESS_PATH) {
      return noindex(response, locked);
    }
    // The one page a login with no staff card may use besides the public site: the adopter's own (#l5gxn). It is let
    // through only for a verified email that is a live contact, and the page and its action ask again.
    if (
      !role?.entersApp &&
      (request.nextUrl.pathname === ADOPTER_PATH || request.nextUrl.pathname.startsWith(ADOPTER_PATH + "/")) &&
      (await loadAdopterScope(supabase))
    ) {
      return noindex(response, locked);
    }
    // Any other route (a staff page typed or bookmarked): an adopter is sent to their own page, kept signed in, and is
    // never signed out as "no role" (the portal spec, docs/decisions/2026-11-13-adopter-portal-schema.md, item 1).
    if (!role?.entersApp && (await loadAdopterScope(supabase))) {
      return noindex(withCookies(NextResponse.redirect(new URL(ADOPTER_PATH, request.nextUrl.origin)), response), locked);
    }
    if (!role?.entersApp) {
      const url = request.nextUrl.clone();
      url.search = "";
      if (role) {
        url.pathname = off ? NO_ACCESS_PATH : "/";
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
