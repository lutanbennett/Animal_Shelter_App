# Release handover — after 0.50.0

This outranks nothing. `docs/release-procedure.md` is the runbook and
`docs/releases/2026-11-27-0-50-0.md` is what actually happened; this is the delta
since the `0.49.3` edition, for whoever runs the next one.

## 1. THE DNS BLACKOUT IS NOT SUB-SECOND. THE LAST EDITION SAID IT WAS

`0.49.3`'s record and handover say the blackout lasts "under a second". **Today's ran
at least 23 seconds** (16:19:21.677Z to 16:19:44.507Z), across three `wrangler`
invocations five seconds apart, every one refused — while each individual lookup still
failed in 0–4 ms. So the *mechanism* reading was right (an instant `ENOTFOUND`, not a
timeout, not Cloudflare) and the *duration* reading was wrong.

**Two consequences, and the second will bite you.**

- **#1916's `DNS-RETRY` works, and you will see it.** It fires, names itself, tells you
  to write it down, and does not rebuild. This release is its first live proof, which is
  what `deploy-dns-retry`'s plan was waiting for.
- **Its window is sized for the old reading — 2 retries, 5 seconds apart, about ten
  seconds of cover — so it gave up.** Expect to finish the job by hand. Filed; do not
  widen it yourself mid-release.

**The duration is now unknown with 23 seconds as a floor.** Two episodes, two very
different numbers. Do not write a third figure as though it settles it.

## 2. A STREAM LEFT A RELEASE GATE RED, AND IT COST THE THIRD TOUCH

`check-deployed-hosts` FAILed on test and UAT before the cut: #1920 added two new product
addresses as `wrangler.jsonc` routes and left `docs/domain-checklist.md` section G — the
front-door row, the `/auth/callback` entry, `site_url` — for later. Any FAIL stops the
release, so it had to go to Lutan, who chose to ship and record the gap.

**What this means for you.** G2 is done on both (rows in, read back with a null shelter),
and the two addresses now serve pages normally. **G3 and G6 are dashboard fields and are
his**, so `check-deployed-hosts --env uat` and the dev run will keep FAILing on
`NO CALLBACK` until he has done them. **Read the failure before you treat it as new**, and
do not script an auth write to clear it — a scripted `config/auth` PATCH is what broke UAT
sign-in on 2026-11-26.

## 3. WHAT IS NOW SETTLED, SO DO NOT CARRY IT FORWARD

- **The production release mail is correct, and `#w4k9n` (e) is closed.** First major release
  since `RELEASE_MAIL_ENV: "Production"` was set on 2026-11-06: subject `[Production] …`,
  sender *CooperJaidee Production*, delivered and read in the inbox. `sent 1, skipped 2`,
  both skips `E_RECIPIENT_NOT_ALLOWED` on unverified addresses, which is the known open
  question and not a delivery failure.
- **A major release mails ONE person.** Measured again rather than assumed: the list is
  three, two are refused by the relay. Tell him plainly when the call comes up.
- **`#cjpzn` works as designed.** `purge-cache.mjs --env production` **exits 1** naming
  `cooperjaidee.org` as `NOT PURGED` *after* purging the other zone. Not a release-stopper:
  purge that zone by hand and carry on.
- **UAT restarts its own Pi service.** Still true, third release running.

## 4. OUTSTANDING, AND ALL OF IT IS LUTAN'S

Not blockers, and not work the next release manager can do. Each is a dashboard field or a
look at a screen behind a sign-in.

1. **Purge the `cooperjaidee.org` zone by hand**, and ideally close `#cjpzn` with the
   `CLOUDFLARE_ZONE_ID_COOPERJAIDEE` value plus a token allowed on that zone.
2. **`/auth/callback` for the two new product addresses**, dev project and UAT's, dashboard
   field only, keeping every existing entry. Then **`site_url`** on both, after checking
   Email Templates for `{{ .SiteURL }}`.
3. **Dev's `site_url` currently points at `https://cooperjaidee.org` — the live production
   platform.** Found this release, not changed. Item 2 fixes it.
4. **Seven test plans in `0.50.0` end `Manual verification by: pending:`**, plus the eight
   release notes themselves, which nobody has read on a rendered `/releases` page. The
   record tables all of them with where to look.

## 5. For the planner, not for the next release

Owed, and **not** in any release — a release ships what is already on `main`: the DNS retry
window (section 1) and the upstream rule behind section 2 — a stream that changes a deployed host
should not leave a release gate red. The test Pi's build cache is 1001 MB against a 1024 MB
ceiling and will start being cleared, which is a slower build and not a failure.
