import { createHash, timingSafeEqual } from "node:crypto";
import { runReportPhotoRetention } from "@/lib/animal-reports/photo-retention";

/**
 * POST /api/animal-reports/photo-retention: the daily clean-up of the report-an-animal photo bucket (#6rkux,
 * src/lib/animal-reports/photo-retention.ts). The Worker's cron calls it in-process once a day (worker/index.mjs,
 * `scheduled`), exactly as /api/merch/supplier-emails is. Bearer-authenticated with the service-role key; the proxy lets
 * this one path through signed out and this check is what guards it.
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
    const grace = new URL(request.url).searchParams.get("orphan_grace_minutes");
    const result = await runReportPhotoRetention(new Date(), grace === null ? undefined : Number(grace));
    return Response.json(result, { status: result.errors.length ? 207 : 200, headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error(`report-photo-retention: ${(err as Error)?.message ?? err}`);
    return Response.json({ error: "Run failed." }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
