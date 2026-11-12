import { isPublicPath, thPathRest } from "./public-paths.ts";

/**
 * What the Worker may render itself when the Pi does not answer -- the rule is
 * "the public website, and nothing else".
 *
 * The Worker falls back to rendering a request when the Pi does not answer
 * (worker/index.mjs, step 3). Measured 2026-11-12: the app's own pages and
 * saves cost the Worker 299-1562 ms of CPU each, past the free plan's limit, so
 * Cloudflare killed it (error 1102) 113 times in a row in the power-pull drill;
 * the website rendered 41 of 41 with a median of 33 ms. So the fallback is kept
 * for the website, and everything else is answered with a small static page
 * (worker/origin.mjs piUnavailable) that costs next to nothing.
 *
 * The website is whatever src/lib/public-paths.ts calls public: isPublicPath()
 * (the pages, sign-in, robots.txt, sitemap.xml, the logo, /api/version and the
 * photo/video proxy) plus the explicit Thai twin of a public page (/th/adopt,
 * which the Worker's own routing already understands). It is NOT
 * isWebsitePageWhenOff(), which is the signed-in go-live gate and deliberately
 * excludes "/". The open list is used even while the site is locked: the locked
 * list is a subset of it, so a locked site refuses nothing extra here.
 * Do not write a second list of paths: two lists that must agree drift apart.
 *
 * Not established: where the ceiling really is. The website path degrades, it is
 * not guaranteed (docs/decisions/2026-11-12-worker-serves-the-website-not-the-app.md).
 *
 * Plain data, no imports beyond public-paths.ts (itself import-free):
 * worker/origin.mjs loads this under Node's type stripping.
 */
export function workerMayRender(pathname: string): boolean {
  return isPublicPath(pathname) || thPathRest(pathname) !== null;
}

/**
 * Paths with no local fallback at all, even if they ever became public, and
 * which are not cut short by the origin timeout either:
 *
 *   /manual/pdf — serves the full manual from a file built at deploy time on the Pi
 *   (.manual-pdf/, outside public/), and renders a personalised copy live. Neither can
 *   happen on a Worker: it has no such file store and the render exceeds its limits
 *   (docs/decisions/2026-11-05-manual-pdf-prebuilt.md).
 *
 * A request here that the Pi cannot answer gets the offline page, and is not given a
 * time limit: the Worker has nowhere else to send it, so cutting it short would only
 * turn a wait into a refusal.
 */
export const PI_ONLY_PATHS: readonly string[] = ["/manual/pdf"];

export function isPiOnlyPath(pathname: string): boolean {
  return PI_ONLY_PATHS.includes(pathname);
}

/** The Worker must not render this itself: the explicit list, or anything that is not the website. */
export function isRefusedByWorker(pathname: string): boolean {
  return isPiOnlyPath(pathname) || !workerMayRender(pathname);
}
