/**
 * Paths the Worker must never render itself.
 *
 * The Worker falls back to rendering a request when the Pi does not answer
 * (worker/index.mjs, step 3). For most paths that is the right degraded mode.
 * For these it is not: the work is too heavy for a Worker's CPU limit, so the
 * "fallback" only turns a slow answer into Cloudflare error 1102.
 *
 *   /manual/pdf — serves the full manual from a file built at deploy time on the Pi
 *   (.manual-pdf/, outside public/), and renders a personalised copy live. Neither can
 *   happen on a Worker: it has no such file store and the render exceeds its limits
 *   (docs/decisions/2026-11-05-manual-pdf-prebuilt.md).
 *
 * A request here that the Pi cannot answer gets a plain 503, and is not given a
 * time limit: the Worker has nowhere else to send it, so cutting it short would only
 * turn a wait into a refusal.
 *
 * Plain data, no imports: worker/origin.mjs loads this under Node's type stripping.
 */
export const PI_ONLY_PATHS: readonly string[] = ["/manual/pdf"];

export function isPiOnlyPath(pathname: string): boolean {
  return PI_ONLY_PATHS.includes(pathname);
}
