import { NextResponse, type NextRequest } from "next/server";
import { loadSessionRole } from "@/lib/auth/app-access";
import { canOpen, routeFor } from "@/lib/permissions/routes";
import { loadPermissions } from "@/lib/permissions/load";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-origin";
import { loadResidentCard } from "@/lib/residents/card";
import { loadOneResident } from "@/lib/medical/residents";
import { residentTagPath } from "@/lib/tags/links";
import { CARD_WAIT_COOKIE, CARD_WAIT_JOBS, parseCardWait } from "@/lib/residents/card-wait";

/**
 * Where a card tapped with the waiting marker goes (src/lib/residents/card-wait.ts). /r/<code> sends a
 * signed-in person here when the marker is present. The marker is cleared on EVERY outcome, so one
 * left lying about never redirects a later, innocent tap. The job is opened only if the marker is
 * live, this person is signed in with app access and may open that job NOW, the card names a resident
 * and the job's own picker would offer them (not deceased, not adopted, visible to this login).
 * Anything else goes back to the plain card, which behaves as it always has.
 */
export async function GET(request: NextRequest) {
  const origin = (await getSiteOrigin())?.origin ?? request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const done = (path: string) => {
    const res = NextResponse.redirect(`${origin}${path}`);
    res.cookies.delete(CARD_WAIT_COOKIE);
    return res;
  };
  const plain = done(residentTagPath(code));
  if (!code) return done("/");

  const job = parseCardWait(request.cookies.get(CARD_WAIT_COOKIE)?.value, Date.now());
  if (!job) return plain;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (await loadSessionRole(supabase))?.opensApp !== true) return plain;

  const path = CARD_WAIT_JOBS[job];
  const route = routeFor(path);
  if (!route || !canOpen(await loadPermissions(), route)) return plain;

  const card = await loadResidentCard(supabase, code);
  if (!card || card.status !== "Resident") return plain;
  const { resident } = await loadOneResident(supabase, card.id);
  if (!resident || resident.status === "Deceased" || resident.status === "Adopted") return plain;

  return done(`${path}?resident=${resident.id}`);
}
