/**
 * GET /api/version — which build is answering, with no sign-in.
 *
 * Exists because /api/releases/current is answered by the Worker before the
 * origin is consulted (worker/index.mjs), so nothing could ask what the Pi,
 * which serves users, is running. This path is deliberately NOT under
 * /api/releases/: the Worker would swallow it. It is not on the Worker's
 * cached page list either, so it is never edge-cached; no-store here keeps
 * a browser or proxy from holding a stale answer through a deploy.
 *
 * The payload is the version and the commit, both stamped into the build
 * (next.config.ts), and nothing else — no BUILD_MIGRATIONS (that is the
 * schema history), no paths, no env. Which copy answered is the
 * `x-lanna-served-by` header the Worker adds, not a field here.
 * scripts/apply-migrations.mjs and scripts/deploy.mjs read it.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { version: process.env.BUILD_VERSION || null, sha: process.env.BUILD_SHA || null },
    { headers: { "cache-control": "no-store" } },
  );
}
