import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_SIGNED_IN_PATH, safeNextPath } from "@/lib/auth/next-path";
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

  const next = safeNextPath(searchParams.get("next"));
  return NextResponse.redirect(`${origin}${next ?? DEFAULT_SIGNED_IN_PATH}`);
}
