import { createHash, timingSafeEqual } from "node:crypto";
import { runSupplierEmails } from "@/lib/merch/supplier-email";

/**
 * POST /api/merch/supplier-emails: the merchandise shop's daily supplier email (src/lib/merch/supplier-email.ts).
 * The Worker's cron calls it in-process once a day (worker/index.mjs, `scheduled`), exactly as /api/calendar/sweep is
 * called. Bearer-authenticated with the service-role key; the proxy lets this one path through signed out and this
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
  try {
    const results = await runSupplierEmails();
    const bad = results.some((r) => r.outcome !== "sent");
    return Response.json({ results }, { status: bad ? 207 : 200, headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error(`merch-supplier-emails: ${(err as Error)?.message ?? err}`);
    return Response.json({ error: "Run failed." }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
