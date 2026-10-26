# The Release mail tile asks the Worker, because the Pi that draws the page cannot see its settings

2026-10-26, `claude/release-mail-tile`.

**Mechanism chosen: the Pi-rendered page asks the Worker** (new `GET /api/releases/mail-status`, answered in `worker/release-mail.mjs` before the edge cache and the Pi, like the other release endpoints). The tile fetches it through the app's own address (`appUrl`, from `APP_HOST`), 4-second timeout.

**Why not "the cron records its own state":** it needs a table or column for the Worker's state, which this branch may not add (one migration branch at a time), and the production 15-minute cron has been dead since 2026-10-23 10:00 UTC, so it could not be verified on production at all. This route needs no schema and the Worker half is unit-tested.

**What the endpoint exposes:** the environment label, the From address, whether the binding exists, and the reason it is off. All four are already in `wrangler.jsonc` in a public repo. No key, no recipient. It is unauthenticated on purpose: the Pi holds no Worker secret to send.

**What the tile now says:** on, with the label and From address; off on a live site (amber, "no admin will be mailed"); could not ask (amber, says so); a local dev server (grey, says it cannot tell). Off on the Worker itself (the test site, dev database) is unchanged: grey, "off by design".

**Could not verify:** the Pi-asks-Worker path end to end. The endpoint does not exist on the deployed production Worker until Lutan deploys it; before that the tile would read "couldn't check" (amber). On dev only the local-dev-server sentence was driven.

**Reusable:** any status tile that needs a Worker-only fact can use the same shape (a small public GET on the Worker). The backup tile's fault is a different one and is not touched here.
