import { createHash, timingSafeEqual } from "node:crypto";
import { pollCalendarChanges } from "@/lib/clinics/calendar-poll";
import { syncPendingVisits } from "@/lib/clinics/calendar-sync";

/**
 * POST /api/calendar/sweep: the safety net for the shelter calendar. The Worker's cron calls it
 * in-process every 15 minutes (worker/index.mjs, `scheduled`) and it sends every visit that is out of
 * date or never sent (src/lib/clinics/calendar-sync.ts), so a Google outage heals by itself.
 * Bearer-authenticated with the service-role key, exactly as /api/status/alerts is; the proxy lets this
 * one path through signed out and this check is what guards it.
 */
export const dynamic = "force-dynamic";

const digest = (s: string) => createHash("sha256").update(s).digest();

function authorised(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !key) return false;
  return timingSafeEqual(digest(token), digest(key));
}

/**
 * Where the links in an event point. The deploy pins NEXT_PUBLIC_SITE_URL, so that wins: the cron's own
 * request has no real host (a first test run wrote https://undefined into the links). With neither, no links.
 */
function siteOrigin(request: Request): string | null {
  for (const candidate of [process.env.NEXT_PUBLIC_SITE_URL, request.url]) {
    try {
      const url = new URL(candidate ?? "");
      if (url.hostname && url.hostname !== "undefined") return url.origin;
    } catch {
      // not a URL: try the next
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return Response.json({ error: "Not authorised." }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  const origin = siteOrigin(request);
  // Poll first: a move or delete in the calendar is applied before the sweep rebuilds events from the app.
  const polled = await pollCalendarChanges(origin);
  const result = { ...(await syncPendingVisits(origin)), polled };
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}
