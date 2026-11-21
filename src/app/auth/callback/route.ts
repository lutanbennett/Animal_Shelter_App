import { NextResponse, type NextRequest } from "next/server";
import { loadSessionRole, signedInLandingPath } from "@/lib/auth/app-access";
import { getPublicSiteState } from "@/lib/public-site-request";
import { NEXT_COOKIE, NEXT_COOKIE_PATH, resolveNext } from "@/lib/auth/next-cookie";
import { CHOOSER_PATH, isChooserPath } from "@/lib/auth/chooser-path";
import { PASSWORD_CHANGE_PATH } from "@/lib/auth/password-change";
import { ADOPTER_PATH, loadAdopterScope } from "@/lib/adopter/scope";
import { actingShelterId } from "@/lib/supabase/acting-shelter";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-origin";

/**
 * OAuth return leg for "Continue with Google" (see signInWithGoogle in
 * src/app/login/actions.ts). Supabase redirects here with ?code=...; we
 * swap it for a session, then refuse anyone who has no user_roles row —
 * otherwise a stranger's Google account would land on /residents with a
 * session that every RLS policy rejects. Signing them out leaves the
 * auth.users row in place, so an admin can grant them a role from
 * /admin/security and they can simply try again.
 *
 * ?next= is where to land afterwards: the page a signed-out visitor was
 * bounced from (src/lib/auth/next-path.ts — the proxy sets it, the login
 * page threads it through signInWithGoogle), or /account/password?reset=1
 * on a password recovery link (requestPasswordReset). Only a same-origin
 * path is honoured, so the parameter can't send anyone off-site.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Not request.nextUrl.origin: on the Pi that is http://localhost:3000,
  // because cloudflared forwards to 127.0.0.1 and these redirects are built
  // as strings, so Next emits them verbatim instead of normalising them to a
  // same-origin relative Location. A signed-in visitor was sent to
  // https://localhost:3000/my and went nowhere. getSiteOrigin() reads
  // NEXT_PUBLIC_SITE_URL, which scripts/pi/write-env.mjs pins to the Worker's
  // own route for the environment.
  const origin = (await getSiteOrigin())?.origin ?? request.nextUrl.origin;
  const code = searchParams.get("code");

  if (!code || searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=google`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=google`);
  }

  const role = await loadSessionRole(supabase);
  // An adopter holds no staff card; a verified email that is a live contact is sent to the page for sending news (#l5gxn).
  if (!role?.entersApp && (await loadAdopterScope(supabase))) {
    return NextResponse.redirect(`${origin}${ADOPTER_PATH}`);
  }
  // The shelter chooser (#apxld): a login with roles only at shelters may land there from the host that has none.
  if (!role && !(await actingShelterId())) {
    const wanted = resolveNext(request.cookies.get(NEXT_COOKIE)?.value, searchParams.get("next"));
    if (isChooserPath(wanted)) {
      const done = NextResponse.redirect(`${origin}${CHOOSER_PATH}`);
      done.cookies.delete({ name: NEXT_COOKIE, path: NEXT_COOKIE_PATH });
      return done;
    }
  }
  if (!role) {
    await supabase.auth.signOut();
    // No shelter on the request: this host is not registered, so say the site is not set up, not that the account has no role (#hostx).
    const reason = (await actingShelterId()) ? "no_role" : "no_site";
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

  // A public viewer lands on the home page (src/lib/auth/app-access.ts) —
  // but a password-recovery link's ?next= is the change-password page,
  // which every account may use, so that is honoured for anyone.
  // Cookie first, then a legacy ?next= (see next-cookie.ts); safeNextPath runs inside resolveNext on the way in.
  const next = resolveNext(request.cookies.get(NEXT_COOKIE)?.value, searchParams.get("next"));
  const landing = next?.startsWith(PASSWORD_CHANGE_PATH) ? next : signedInLandingPath(role, next, await getPublicSiteState());
  const done = NextResponse.redirect(`${origin}${landing}`);
  done.cookies.delete({ name: NEXT_COOKIE, path: NEXT_COOKIE_PATH });
  return done;
}
