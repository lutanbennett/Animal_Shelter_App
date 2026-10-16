# Status alert mail tile: only delivery turns it green; the Pi relay is not built

2026-10-16, `claude/status-alert-mail-clearable`. Reads `2026-10-11-status-tile-truth.md` first.

## What may turn the tile green

Only **a mail that reached at least one admin** (`status_alert_runs.sent` non-empty), from a real
alert or a test. The tile reads the newest such run, so a later test mail that reaches an admin
already replaces an earlier `sent = 0` — no code change was needed for that half. Not evidence,
and never clearing: "the check ran" (Run now), "no error recorded", a timeout, or a Pi-pressed run
(ignored, and the Pi refuses to record one).

## What changed

The red now says what to press (`fixHere`: Send a test alert, and verify addresses in Cloudflare if
one is skipped as not allowed). Drawn by the Pi, where the buttons are off, it says the test must be
sent from a Worker-drawn page and to ask Lutan (`fixOnPi`). Both dictionaries and the manual.

## The relay: not built, and why

Options for pressing the test from a Pi-drawn page:

1. **Pi calls a Worker endpoint** that sends the test. Needs a shared secret the Pi does not hold
   (a new `OPTIONAL_SECRETS` entry, i.e. a Pi deploy and a Worker deploy, both Lutan's) — without
   it the endpoint is unauthenticated mail-to-all-admins. Cost: one secret, two deploys.
2. **Pi writes a "please test" row; the Worker's 15-minute cron sends it.** No new network path or
   secret, but needs a migration (or reuse of a table) and a cron change. Cost: a schema PR and
   up to 15 minutes' delay. Safest.
3. **Do nothing:** Director asks Lutan to press it on the Worker page. What ships now.

Recommendation: option 2, as a schema stream then a feature stream. Needs from Lutan: a yes, and
the Worker deploy. Filed on the `backlog` branch; the item stays open.
