# The Pi's app checks `x-origin-key` too — on the Pi only (2026-10-12)

Backlog: architecture review S3. The WAF rule on `pi.lannacare.org` was the only thing stopping a request that reached the Pi without the Worker's shared secret. It lives in the Cloudflare dashboard, outside the repository, on a plan limited to five rules. An edited, disabled or forgotten rule (it already had to be extended by hand for `test-pi`) would fail open, and no screen would show it.

## What changed

- `src/proxy.ts` answers 403 before `updateSession` when `originKeyRefuses()` (`src/lib/origin-key.ts`) says so. Constant-time comparison, as `api/status/alerts` does.
- `ORIGIN_KEY` left `WORKER_ONLY_SECRETS`, so `write-env.mjs` writes it into the Pi's `.env.production.local`.
- `setup.sh` / `setup-test.sh` health curls send the header; `docs/pi-hosting.md` updated. The WAF rule stays.

## The decision: the check runs only where `PHOTO_CACHE_DIR` is also set

The brief assumed the Worker never has `ORIGIN_KEY` in `process.env`. It does: it is a Worker secret, the compatibility date is 2026-09-19 with `nodejs_compat`, and `health.ts` already reads `process.env.ORIGIN_KEY` as a fallback. A check on `ORIGIN_KEY` alone would have refused every visitor to the Worker, who send no such header. So the check also requires `PHOTO_CACHE_DIR`, the Pi's marker in the same file (`status/runtime.ts` uses it the same way). `next dev` has neither.

## Strict on the Pi (an absent header is refused), and why that is safe

The brief said to fall back to "refuse only when present and wrong" if the two cannot be shown to agree. They can: the WAF rule already blocks anything without the exact key, and the Worker sends it on every request (`worker/origin.mjs:46`), so the Pi already only ever sees the right key. The app check adds nothing the rule does not already require in normal running. Nothing else on the Pi talks to the app: the only local callers are the two setup health curls (now sending the header) and the status probe (sends it).

## Ordering

Safe either way round. Pi first: the Worker already sends the key. Worker first: the Pi does not check yet. The one lock-out is a Pi whose `.env.deploy.production` holds a *different* `ORIGIN_KEY` from the Worker's, which the WAF would already block. A Pi without the line does not check at all (fail-open as before, not locked out). **Deploying means adding `ORIGIN_KEY` to the Pi's own `.env.deploy.production`, then `deploy-pi.sh`.**

## What this closes and what it does not

Closes: the WAF rule being the only guard on direct requests to the Pi's Node server. Does not close: the Pi as a single point of failure, the Pi's check being absent until the line is on the Pi, or anyone who already holds the key.
