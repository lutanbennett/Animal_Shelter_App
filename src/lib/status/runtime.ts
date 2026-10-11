import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Which machine drew this page. System status is served by the Pi on
 * production, but every binding and Worker var lives on the Worker, so a
 * check that reads one is wrong-when-healthy there. Ask this instead of
 * guessing from a missing value (docs/decisions/2026-10-11-status-tile-truth.md).
 *
 *   worker  getCloudflareContext() works: the Worker's bindings are here
 *   pi      off the Worker with PHOTO_CACHE_DIR set; write-env.mjs gives only
 *           a Pi that line (the Pi's test clone included)
 *   local   anything else, a laptop
 */
export type Runtime = "worker" | "pi" | "local";

export function renderedBy(): Runtime {
  try {
    getCloudflareContext();
    return "worker";
  } catch {
    return process.env.PHOTO_CACHE_DIR ? "pi" : "local";
  }
}
