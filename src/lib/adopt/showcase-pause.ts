import "server-only";
import { headers } from "next/headers";

/**
 * A deliberate pause on `/adopt`'s first load, so the puppy loader
 * (`src/components/PuppyLoader.tsx`, root `src/app/loading.tsx`) gets to
 * play instead of the page usually arriving before its 300 ms delay ever
 * shows it. `SHOWCASE_LOADER_MS` is set per Worker in wrangler.jsonc — `0`
 * or unset means off — and OpenNext copies Worker vars onto process.env at
 * request time, so this is read per request, never at module scope, same
 * as `isPublicSiteLocked()` (src/lib/public-site.ts).
 */
const MAX_SHOWCASE_PAUSE_MS = 3000;

/** Clamped so a typo in wrangler.jsonc can't hang the page. */
export function showcasePauseMs(): number {
  const raw = Number(process.env.SHOWCASE_LOADER_MS);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(raw, MAX_SHOWCASE_PAUSE_MS);
}

/**
 * Only a genuine arrival at `/adopt` should pause — not a filter chip, the
 * ready-only toggle, or (once the page paginates) a page change, all of
 * which re-run this same server component. Two signals, either one enough
 * to call it "within the page":
 *
 *  - any of `/adopt`'s own query params present (a filter/paging link
 *    always sets at least one), or
 *  - the request's Referer is `/adopt` itself (a same-route Link click,
 *    including "All species" clearing back to no params).
 *
 * A missing Referer (direct nav, most back/forward navigation served from
 * Next's client-side router cache without hitting the server at all) reads
 * as a fresh arrival, which is the safer default for a showcase pause.
 */
export async function isFreshAdoptArrival(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<boolean> {
  if (Object.keys(searchParams).length > 0) return false;

  const referer = (await headers()).get("referer");
  if (!referer) return true;

  try {
    return new URL(referer).pathname !== "/adopt";
  } catch {
    return true;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Runs the pause only for a fresh arrival; a no-op when the var is off. */
export async function showcaseAdoptPause(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<void> {
  const ms = showcasePauseMs();
  if (ms <= 0) return;
  if (!(await isFreshAdoptArrival(searchParams))) return;
  await sleep(ms);
}
