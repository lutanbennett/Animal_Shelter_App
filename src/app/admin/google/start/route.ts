import { NextResponse, type NextRequest } from "next/server";
import { loadPermissions } from "@/lib/permissions/load";
import { getSiteOrigin } from "@/lib/site-origin";
import { connectClient } from "@/lib/google/shelter-google-connect";
import { CONNECT_COOKIE, consentUrl, isConnectKind } from "@/lib/google/shelter-google-connect-decide";

/**
 * First leg of a shelter connecting its own Google Drive or Calendar (#drvcl): Admin only (perms.isAdmin, the Admin bypass in can.ts;
 * no card, docs/decisions/2026-11-22-shelter-google-connect-screen.md). Sends the browser to Google's consent screen with a random
 * state kept in a short-lived cookie, so the return can be matched to this press. Writes nothing.
 */
export async function GET(request: NextRequest) {
  const origin = (await getSiteOrigin())?.origin ?? request.nextUrl.origin;
  const perms = await loadPermissions();
  if (!perms?.isAdmin) return NextResponse.redirect(`${origin}/admin`);
  const kind = request.nextUrl.searchParams.get("kind");
  if (!isConnectKind(kind)) return NextResponse.redirect(`${origin}/admin`);
  const client = connectClient();
  if (!client) return NextResponse.redirect(`${origin}/admin?google=${kind}-not_set_up`);

  const state = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const res = NextResponse.redirect(consentUrl({ clientId: client.clientId, origin, kind, state }));
  res.cookies.set({ name: CONNECT_COOKIE, value: `${state}.${kind}`, httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax", path: "/admin/google", maxAge: 600 });
  return res;
}
