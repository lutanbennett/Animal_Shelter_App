import { NextResponse, type NextRequest } from "next/server";
import { signedInLandingPath } from "@/lib/auth/app-access";
import { safeNextPath } from "@/lib/auth/next-path";
import { PASSWORD_CHANGE_PATH } from "@/lib/auth/password-change";
import { createClient } from "@/lib/supabase/server";

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
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code || searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=google`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=google`);
  }

  const { data: role } = await supabase.rpc("current_user_role");
  if (!role) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_role`);
  }

  // A public viewer lands on the home page (src/lib/auth/app-access.ts) —
  // but a password-recovery link's ?next= is the change-password page,
  // which every account may use, so that is honoured for anyone.
  const next = safeNextPath(searchParams.get("next"));
  const landing = next?.startsWith(PASSWORD_CHANGE_PATH) ? next : signedInLandingPath(role, next);
  return NextResponse.redirect(`${origin}${landing}`);
}
