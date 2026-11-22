import { NextResponse, type NextRequest } from "next/server";
import { loadPermissions } from "@/lib/permissions/load";
import { getSiteOrigin } from "@/lib/site-origin";
import { completeConnect } from "@/lib/google/shelter-google-connect";
import { CONNECT_COOKIE, readStateCookie } from "@/lib/google/shelter-google-connect-decide";

/**
 * Return leg of the Google connect (#drvcl). Admin only; refuses unless the state matches the cookie the first leg set. The result goes
 * back to Settings as ?google=<kind>-<ok|reason>, which the page turns into words in both languages.
 */
export async function GET(request: NextRequest) {
  const origin = (await getSiteOrigin())?.origin ?? request.nextUrl.origin;
  const perms = await loadPermissions();
  if (!perms?.isAdmin) return NextResponse.redirect(`${origin}/admin`);
  const p = request.nextUrl.searchParams;
  const kind = readStateCookie(request.cookies.get(CONNECT_COOKIE)?.value, p.get("state"));
  const done = (result: string) => {
    const r = NextResponse.redirect(`${origin}/admin?google=${result}`);
    r.cookies.delete({ name: CONNECT_COOKIE, path: "/admin/google" });
    return r;
  };
  if (!kind) return done("state");
  const code = p.get("code");
  if (p.get("error") || !code) return done(`${kind}-cancelled`);
  const out = await completeConnect(kind, code, origin);
  return done(`${kind}-${out.ok ? "ok" : out.reason}`);
}
