# Release handover — after 0.49.3

**This outranks nothing.** `docs/release-procedure.md` is the runbook and `CLAUDE.md` the rules; where
this disagrees with either, they win. It is one chat's note to the next, rewritten every release, and
a wrong line here is corrected by its successor rather than by a reviewer — which is why it merges on
green like any other PR.

**`0.49.3` — 2026-11-26, minor, no email, two touches, which is the target.**

## Where things stand

- **Live everywhere: `0.49.3 @ ef022e146`** — all four hosts on `/api/version` **and**
  `/api/releases/current`, all `served-by: pi`.
- **Migrations: `0445` is the highest applied** on production and UAT, both **446 applied, 0 pending**,
  zero drift. Dev still has one extra that exists in no file (`#d422o`); `--status` before assuming.
- **The production website floor is `open`** — readable in the deploy's own binding list as
  `env.PUBLIC_SITE "open"` — and **Lanna's own `public_site` is `locked`, which is the only thing
  keeping the real public site shut.** Lutan has re-tested that switch himself and it works. Not a
  fault to chase; the fact to know before anyone touches `PUBLIC_SITE`.
- **The production Worker holds 15 secrets**, unchanged. Read them by name, never by value.

## 1. THE DEPLOY FAILURE IS A DNS BLACKOUT, NOT A CLOUDFLARE PROBLEM. RETRY WITH `--skip-build`.

**If you read one section, read this one.** It has cost two releases — one of them an hour and two
wrong diagnoses put to Lutan in writing.

A Worker deploy dies on `Unable to resolve Cloudflare's API hostname (api.cloudflare.com or
dash.cloudflare.com)`. **The message points at the wrong thing.** `0.49.3` caught it with the net
trace #1898 landed for this, and the facts are:

- **Six lookups failed inside 250 ms across four hosts, and two are not Cloudflare's:**
  `registry.npmjs.org`, `api.github.com`, `sparrow.cloudflare.com`, `api.cloudflare.com` — every one
  `ENOTFOUND errno=-3008 getaddrinfo`.
- **Each failure took 1–41 ms.** Not a timeout: a resolver answering *no such host* instantly, which
  is what a stack with no usable DNS server does.
- **It had recovered within minutes.** Same machine, same Node binary: both hostnames resolved and a
  plain `fetch` to `api.cloudflare.com` returned **HTTP 400**, a real answer.

**So it is a machine-wide blackout lasting under a second, and Cloudflare's name is in the error only
because that is what wrangler happened to be asking for.** Do not go near DNS settings, proxies,
`NODE_USE_SYSTEM_CA`, the API token or IPv6 — all were read and all are clean, and
`docs/releases/2026-11-20-0-47-5.md`'s line that this machine prefers IPv6 is **out of date**.

**WHAT TO DO: retry with `--skip-build`.** The build finishes before the upload dies, so the retry is
about a minute instead of nine. **The safeguard that makes reuse safe is the fingerprint** (`0.47.4`):
the retry must print the same Server Actions key as the build it reuses — `cbd55beae8d8` production,
`cdeca9cbc4de` UAT, `ecc41837fc0b` test. A different key means stop.

**Read the deploy log for `[deploy net-trace]` lines before concluding anything.** They are the whole
point and easy to scroll past.

**Hypothesis, not finding:** NordLynx was up with no DNS servers on its interface, and a VPN rotating
its resolver would produce exactly this. **But `0.49.3`'s production deploy succeeded first time with
the VPN up**, so do not tell Lutan the VPN breaks deploys. `#dnsgp` holds the measurement and the fix.

## 2. READ A SCRIPT'S OWN USAGE BLOCK BEFORE POINTING IT AT PRODUCTION

`0.49.3` ran `node scripts/deploy.mjs --env production --list-secrets` to read secret names.
**There is no such flag.** `deploy.mjs` ignored it and began a full build toward a **second production
deploy**; it was stopped during `next build`, before any bundle or upload, so nothing reached
Cloudflare. The real flags are in that file's **first twenty lines** — `--secrets`, `--skip-build`,
`--no-mail`, `--no-pi`, `--plan` — and `--plan` exists precisely to show what a command would do.

**An unknown flag is not an error here; it is ignored**, which is the trap. **Side effect:** it left
`.next` in the main checkout mid-build, so **do not use `--skip-build` there until a full build runs.**

## 3. A `wrangler.jsonc` variable can take effect at the PI BUILD — and this is now checked

`0.49.2` put the real public website on the internet this way while following the recorded order
exactly. **Run `node scripts/check-wrangler-var-steps.mjs --base <previous release sha>` before the
first Pi build.** `0.49.3` ran it on the branch and again on merged `main`, got `No wrangler.jsonc var
changed`, and could therefore say the fault *could not* recur rather than hoping so. Five variables
are `where: "pi"`: `PUBLIC_SITE`, `APP_HOST`, `PUBLIC_HOST`, `PLATFORM_HOST`, `PLATFORM_SEARCH`.

**Prove the website's state by bytes, not by looking.** Closed is `/` **200 at 24,468 bytes**, with
`/adopt`, `/our-work`, `/donate` at 307 and `robots.txt` `Disallow: /`. Check after the production Pi
build **and** after the Worker deploy; `0.49.3` did both.

## 4. `tail` and `head` have cost six faults between them. Stop piping.

`0.49.1` read a check through `tail -6` and wrote a false claim into a gate. `0.49.2` read
`guarded-install.mjs` through `tail -4` and called an unfinished install done. `0.49.3` piped two Pi
logs into `head`: both buffered, read nothing, and had to be re-run.

**Redirect to a file and read the file.** The last handover already said this and the next session
still reached for `head` — which is worth knowing about how much a written rule can carry.

## 5. The tenancy catalogue: read the baseline BEFORE you apply, and predict the delta

It is **report-only and always exits 0**, which is why it gets skipped, and **the delta is the whole
finding** — a total alone says nothing. `0.49.3`: **125 / 16 / 1 stale** before, **125 / 17 / 0**
after, identical on both environments.

**The thing worth copying:** the stale entry was `product_admin_access_elsewhere`, allow-listed by
#1891 in the same release as the `0444` that creates it, so the cut plan **wrote down beforehand that
it should clear, and that failing to clear would be a real finding.** A prediction recorded in advance
turns a report-only script into a check. The flagged total did not move this release, the first time
in several; if it climbs again, the item is how definer migrations are written, not the objects.

## 6. Pi builds, and the VPN

Serial, pre-flighted, detached — all durable and in the runbook; what is new is the VPN. **If you turn
it off for anything, turn it back on.** The Pi is reachable *only* over Meshnet, so `0.49.2` leaving
it off meant `0.49.3` opened unable to reach the Pi at all and had to ask Lutan for it — a touch that
should not have existed. Pre-flight read: uptime 14 days, load 0.00, 872 G free, services active.

**The parallelism the runbook sanctions is one Pi build alongside one Worker deploy.** `0.49.3` ran the
UAT Worker deploy during the production Pi build and saved about nine minutes.

## 7. Carried forward, briefly

- **A minor release's no-mail needs the CONTROL as well as the absence** (`--verify` prints both), and
  then all three deploys say it independently. **UAT's silence is the strongest proof** — it has a live
  `RELEASE_MAIL` binding and production's real people in its database. Pass `--no-mail` anyway.
- **`gh` failing is not `gh` refusing.** A transport error looks exactly like a refusal; check
  `githubstatus.com` and retry rather than escalating. `0.49.3` had no trouble — 18 checks green,
  merged first attempt.
- **A fresh worktree cannot deploy** (`.env.deploy.*` is not copied); run deploy-env commands from the
  main checkout. **A red migration `--dry-run` can be the signal to apply**, when an earlier pending
  file provides what it is missing. Both are in the runbook; neither bit this release.

## 8. Outstanding, and none of it blocks a release

Seven test gaps, listed in `docs/releases/2026-11-26-0-49-3.md`. Two to carry:

- **A real authenticator code on both step-up journeys** — Lutan's, outstanding several releases. No
  stream has an authenticator and `--aal2` on dev does not prove the real journey.
- **The phone-width looks can be DRIVEN**, not handed over (`scripts/lib/driven-session.mjs`,
  `#bprf7`). **He has now declined the same offer on `0.49.1`, `0.49.2` and `0.49.3` — "Leave them".
  Stop offering it unasked**; record them as declined, not pending.

**`cooperjaidee.org` is a third Cloudflare zone that `purge-cache.mjs` does not know** (`#cjpzn`), so a
release purges three of the four hosts it just deployed. Exposure today is small — its pages answer
`CF-Cache-Status: DYNAMIC` and its chunks are content-hashed — but the product site's words and photos
are console-editable now, which is exactly what a stale edge copy holds on to.

**`check-release-handover.mjs` tests only the handover's FIRST LINE for the version**, so the old
`# Release handover` title could never satisfy it and it has reported STALE on every correct edition,
`0.49.2`'s included. This edition's title names the release, which makes the advisory mean something.
**Keep the version in the H1.**

**`0.49.0`'s production cache fault has not recurred three times running.** Purge both zones every
time regardless; three data points, still no explanation.
