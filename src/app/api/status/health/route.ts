import { getAppEnv } from "@/lib/app-env";
import { getHealthReport, readDatabaseHealth } from "@/lib/status/health";
import { buildHealthFeed, makeLimiter, tokenMatches } from "@/lib/status/health-feed";

/**
 * GET /api/status/health — the read-only feed Home Assistant polls
 * (docs/home-assistant-monitoring.md, backlog #mzu7v).
 *
 * Guarded by its OWN bearer token, STATUS_READ_TOKEN, which can read this and
 * nothing else and is rotated alone. It is never the service-role key. The
 * proxy lets the path through signed out (src/proxy.ts); this check is what
 * guards it. Answers are no-store and carry states, times and a few numbers,
 * never error text (src/lib/status/health-feed.ts).
 */
export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store" };
/** Bad tokens: 10 a minute is a person mistyping, more is guessing. Good ones: a poll every few minutes needs far fewer than 30. */
const allowFailure = makeLimiter(10, 60_000);
const allowRead = makeLimiter(30, 60_000);

export async function GET(request: Request) {
  const ok = tokenMatches(request.headers.get("authorization"), process.env.STATUS_READ_TOKEN);
  if (!(ok ? allowRead() : allowFailure())) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: { ...headers, "retry-after": "60" } });
  }
  if (!ok) return Response.json({ error: "Not authorised." }, { status: 401, headers });

  try {
    const [report, db] = await Promise.all([
      getHealthReport(),
      readDatabaseHealth(),
    ]);
    return Response.json(
      buildHealthFeed({ report, databaseHealth: db, environment: getAppEnv(), now: new Date() }),
      { headers },
    );
  } catch {
    return Response.json({ error: "Health could not be read." }, { status: 503, headers });
  }
}
