// What the Worker may render itself when the Pi does not answer: the public
// website, and nothing else. (A .mjs under worker/ because src/lib files are
// type-checked without .ts import extensions, and this one must import
// src/lib/public-paths.ts, which is import-free and loads under type stripping.)
//
// Measured 2026-11-12: the app's pages and saves cost the Worker 299-1562 ms of
// CPU each, past the plan's limit, so Cloudflare killed it (error 1102) 113 times
// in a row in the power-pull drill; the website rendered 41 of 41, median 33 ms.
// So the fallback is kept for the website, and everything else gets the small
// static page (origin.mjs piUnavailable).
//
// "The website" is isPublicPath() (pages, sign-in, robots.txt, sitemap.xml, the
// logo, /api/version, the photo and video proxy) plus the /th/ twin of a public
// page. NOT isWebsitePageWhenOff(): that is the signed-in go-live gate and
// returns false for "/". The open list is used even while the site is locked: the
// locked list is a subset. Do not write a second list of paths.
//
// Not established: where the CPU ceiling really is. The website path degrades, it
// is not guaranteed (docs/decisions/2026-11-12-worker-serves-the-website-not-the-app.md).

import { isPublicPath, thPathRest } from "../src/lib/public-paths.ts";
import { isPiOnlyPath } from "../src/lib/pi-only-paths.ts";

export function workerMayRender(pathname) {
  return isPublicPath(pathname) || thPathRest(pathname) !== null;
}

/** The Worker must not render this itself: the explicit Pi-only list, or anything that is not the website. */
export function isRefusedByWorker(pathname) {
  return isPiOnlyPath(pathname) || !workerMayRender(pathname);
}
