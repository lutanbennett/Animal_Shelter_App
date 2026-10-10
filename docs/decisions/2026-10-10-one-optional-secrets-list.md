# One list of optional secrets for the Worker and the Pi

**Date:** 2026-10-10 · **Branch:** `claude/pi-visitor-count`

**What happened.** Settings → System status → *Website visitors* read "Not set
up" on lannacare.org with `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID`
uploaded as production Worker secrets. The Pi renders the pages, and it reads
`.env.production.local`, written by `scripts/pi/write-env.mjs`. That script had
its own hand-kept optional list (just `BACKUP_DRIVE_FOLDER_ID`), while
`scripts/deploy.mjs` had grown the Cloudflare pair. Two lists, one updated.

**Decision.** The optional list lives once, in `scripts/lib/optional-secrets.mjs`,
imported by both scripts. Adding a value there sends it to both servers.

**`ORIGIN_KEY` stays Worker-only** (`WORKER_ONLY_SECRETS`, same file). The
Worker attaches it on the way to the Pi and the WAF checks it; the Pi neither
sends nor checks it. Its only other reader, the Pi origin tile in
`src/lib/status/health.ts`, also needs `ORIGIN_HOST`, which the Pi is not given,
so on the Pi it would be an unused copy of a secret. Making the exception a named
list in the shared file, rather than a second hand-kept list, keeps the drift
from coming back: a new optional value reaches the Pi unless someone decides it
should not.

**Not changed.** The required `KEYS` stay where they are; `write-env.mjs`
already refuses to run without them, so they cannot silently go missing. The
code only moves values the Pi's file already has: the Pi's copy of
`.env.deploy.production` still needs the two lines by hand (README, System
status; `docs/pi-hosting.md`, Day to day).
