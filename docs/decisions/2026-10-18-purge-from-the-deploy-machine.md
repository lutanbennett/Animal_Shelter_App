# Purge Cloudflare from the deploy machine, not from the Pi (2026-10-18)

Lutan ruled on 2026-10-18 that the Cloudflare cache purge should be automated. He
had done it by hand twice in two days, and `docs/release-procedure.md` had just made
it a required step after every Pi deploy, which pushed a release's cost to three of
his interventions against a budget of two.

## The decision

**`scripts/purge-cache.mjs` runs on the deploy machine, not on the Pi**, and the
Cloudflare token lives in `.env.deploy.production` beside every other deploy secret.

## Why this differs from what was planned

`docs/decisions/2026-10-18-pi-deploy-safety.md` set this out as option (a): "a
Cloudflare API token on the Pi with *Zone → Cache Purge* on the one zone, stored in
`.env.deploy.production`, and a `curl` of `purge_everything` after the restart",
and framed the trade-off as "a credential on an internet-facing-adjacent box,
against a manual step that was forgotten once already".

**That trade-off does not have to be taken, because the premise is wrong in one
detail.** The purge was assumed to belong at the end of `deploy-pi.sh` because that
is where the deploy finishes. But **`deploy-pi.sh` is driven over `ssh` from the
deploy machine**, which is where `.env.deploy.production` already lives and where
`scripts/lib/env.mjs` already reads it. Running the purge there gets the same
automation with **no credential on the Pi at all**.

So the trade-off the earlier decision weighed is avoided rather than resolved. The
Pi gains nothing it did not have; the deploy machine gains one more secret in a file
that already holds the Supabase service-role key.

## What this does not cover, stated plainly

**A `deploy-pi.sh` run started on the Pi itself does not purge.** The script does
not call this one — deliberately, since that would put us back to needing the token
there. The documented path is the runbook's, which runs the deploy over `ssh` and
then the purge from the same machine.

Two things make that acceptable rather than a hole:

- `deploy-pi.sh` already ends with `scripts/pi/check-assets.mjs`, which **fails loudly** if the served stylesheet differs from the build. So a Pi-side deploy that needed a purge says so, even though it cannot do it.
- The release manager follows the runbook, and the runbook now gives the command.

If someone later wants a Pi-side deploy to purge by itself, that is the moment to
revisit the token-on-the-Pi question — with the knowledge that it buys only that
case.

## What it is for, in one paragraph

`/_next/static/**` is served `max-age=31536000, immutable`. A Pi deploy rewrites
`.next` while requests keep arriving, so an edge node that fetches an asset mid-swap
can cache a 404 or a half-written file **and serve it for a year**. On 2026-10-17
that left the app unstyled on a phone while every release check passed and the
laptop looked perfect — a phone on mobile data reaches a different edge node than
the machine doing the checking. `docs/releases/2026-10-17-0-36-0.md`, Defect 2.

## Details worth not re-deriving

- **The token is scoped to Zone → Cache Purge on the one zone.** Nothing else in the repo reads `CLOUDFLARE_PURGE_TOKEN`, and the script never prints it.
- **`CLOUDFLARE_ZONE_ID` was already set** in `.env.deploy.production` (it predates this, for the analytics figure on the Management dashboard). So adopting this needs **one** new value, not two.
- **The script verifies the purge rather than trusting the API's "success".** After a successful purge it re-runs the asset check against the public URL where it can; where it cannot — `check-assets.mjs` compares against a local `.next`, which only exists on the Pi — it prints the exact command to run there. A purge that reports success and did not take is the failure worth catching.
- **It refuses with instructions, not a stack trace.** Whoever meets a missing token is mid-release; the message names the file, the permission and the dashboard fallback.
- **It still cannot prove a global purge.** The check sees one edge node. That is why the runbook keeps "purge even when the check is green" — the fault it exists for is invisible from the deploy machine by construction.
