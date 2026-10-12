import { createHash, timingSafeEqual } from "node:crypto";

/**
 * The Pi's own check that a request came through the Worker, beside the
 * Cloudflare WAF rule (docs/pi-hosting.md), not instead of it.
 *
 * It applies only where both are set: ORIGIN_KEY (written into the Pi's
 * .env.production.local by scripts/pi/write-env.mjs) and PHOTO_CACHE_DIR (the
 * same file; the Pi's marker, as src/lib/status/runtime.ts uses it). The Worker
 * holds ORIGIN_KEY as a secret and workerd copies secrets into process.env, but
 * it has no PHOTO_CACHE_DIR, and a visitor's request to the Worker carries no
 * x-origin-key — so without the second condition this would lock out the site.
 * `next dev` has neither.
 *
 * Returns true when the request must be refused.
 */
export function originKeyRefuses(
  provided: string | null,
  env: { ORIGIN_KEY?: string; PHOTO_CACHE_DIR?: string },
): boolean {
  const key = env.ORIGIN_KEY;
  if (!key || !env.PHOTO_CACHE_DIR) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return !timingSafeEqual(digest(provided ?? ""), digest(key));
}
