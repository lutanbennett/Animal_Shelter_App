# Pi deploy safety: cache poisoning and build memory (2026-10-18)

Two backlog items, one stream, because both land in `scripts/pi/deploy-pi.sh`.
Nothing here has been run on a real Pi. Next person: read "What is still Lutan's".

## Item A — a Pi deploy can poison Cloudflare's year-long asset cache

- **(d) built:** `scripts/pi/check-assets.mjs`, run as the last line of `deploy-pi.sh`. It
  fetches the page, finds the referenced `/_next/static/*.css`, fetches each through the
  public URL and compares bytes with the file in `.next`. Fails (exit 1) saying what it
  fetched, expected and got. Tested here against a local server, pass and fail.
- **(b) NOT built as written, on purpose.** "Build into `.next.new` and `mv`" is not possible
  without a `distDir` switch in `next.config.ts`, which this stream's brief rules out. Instead
  `deploy-pi.sh` copies the last good `.next` to `.next.prev` and restores it if the build or
  the Server Actions key check fails. That fixes the real fail-safe gap (a failed build left a
  half-written `.next` under the running service) but **does not close the 404 window while a
  build runs.** Closing it needs `distDir` from an env var plus a `mv` swap: a small change to
  `next.config.ts`, Lutan's call. The script's old header claimed the build already went into a
  fresh directory; it did not, and the comment is corrected.
- **(a) is Lutan's.** Automating the purge needs a Cloudflare API token on the Pi with
  *Zone → Cache Purge* on the one zone, stored in `.env.deploy.production`, and a `curl` of
  `purge_everything` after the restart. Trade-off: a credential on an internet-facing-adjacent
  box, against a manual step that was forgotten once already. Until he rules, the purge is a
  runbook step (`docs/release-procedure.md`).
- **(c) worth filing** as its own item (serve `/_next/static` from the Worker or R2); too big here.

## Item C — Pi build out of memory

- **Built:** `/swapfile2` (4 GB) in `setup.sh` step 2b; `deploy-pi.sh` refuses below ~5.5 GiB
  of swap (6 GB less rounding), `--force` warns instead; `docs/pi-hosting.md` "Swap" explains
  the number (zram is compressed RAM; the file did it).
- **Ref hole, cheap answer built:** production and uat refuse a commit not on `origin/main`
  (`git merge-base --is-ancestor`, no GitHub API). Rollback to an older release still works.
- **NOT done: (3) `ignoreBuildErrors` on the Pi.** `next.config.ts` untouched. It waits on a
  measurement only the Pi can give: runbook step "Measure the build's peak memory".
  **Threshold:** peak a little over 6 GB → the 6 GB of swap is defensible and (3) can wait;
  peak well over (say 8 GB+, or growing release on release) → swap is the wrong tool and (3) is
  the only honest answer. Then (3) must be gated to the Pi build and must not touch CI.

## What is still Lutan's
Run the first Pi deploy with these changes (watch for the swap refusal, the `.next.prev`
copy time and disk, and the asset check); purge by hand after it; take the memory
measurement; decide on the purge token and on `distDir`.
