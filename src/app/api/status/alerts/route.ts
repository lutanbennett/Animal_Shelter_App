import { createHash, timingSafeEqual } from "node:crypto";
import { processTestRequests, runStatusAlerts } from "@/lib/status/alerts";

/**
 * POST /api/status/alerts — one scheduled alert run (src/lib/status/alerts.ts).
 *
 * The Worker's cron trigger calls this in-process (worker/index.mjs,
 * `scheduled`), so on a deployed site it runs on the Worker, with the mail
 * binding. Bearer-authenticated with the service-role key, as the release
 * relay is: the cron has it, nobody without it can make the app send mail.
 * The proxy lets this one path through signed out (src/proxy.ts); this
 * check is what guards it.
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

export async function POST(request: Request) {
  if (!authorised(request)) {
    return Response.json({ error: "Not authorised." }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  const origin = new URL(request.url).origin;
  const result = await runStatusAlerts("cron", origin);
  // Tests asked for from a Pi-drawn page (0226); after the run, so they can never delay it.
  const tests = await processTestRequests(origin);
  if (tests.note) console.error(`status-alerts: test requests: ${tests.note}`);
  return Response.json({ ...result, testsSent: tests.handled }, { status: result.remembered ? 200 : 503, headers: { "cache-control": "no-store" } });
}
