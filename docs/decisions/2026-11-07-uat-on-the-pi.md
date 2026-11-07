# UAT is served by the Pi, like production and test (2026-11-07)

**Lutan, 2026-11-07:** *"yes lets point UAT at the Pi"*, after Cloudflare's daily email (21:37, 6 Nov): *"Your
Workers hit the free tier CPU time limit at least 100+ times in the past 24 hours."*

## What the dashboard showed (read in Chrome, 2026-11-07)

Over 7 days the **UAT** Worker (`lanna-animal-care-uat`, `lannacare.org`) had **674** "Exceeded CPU Time Limits":
627 on version `0b470124` in one burst on 5 Nov (the cutover, with five deployments that day), then 20 and about
27 on `19791304`. Production and test showed **0**. The first look, at "last 24 hours" read on the morning of
7 Nov, missed the 5 Nov burst entirely and reported 20; the email's 24-hour window ended at 21:37 on 6 Nov and
began on the evening of 5 Nov. A reading is only as good as its window.

## Cause

`wrangler.jsonc`'s `uat` env had `ORIGIN_HOST: ""`, so the Worker rendered every page itself
(`curl -sI https://lannacare.org/login` answered `x-lanna-served-by: worker`, `x-lanna-cache: BYPASS`). A
Next.js render is 30–40 ms of CPU and the free plan allows 10 ms (`worker/index.mjs`, header comment). Production
(`pi.lannacare.org`) and test (`test-pi.lannacare.org`) have a Pi behind a tunnel and never hit it. UAT had none
because, until the 2026-11-05 cutover, `lannacare.org` was production and *had* one, and the cutover moved the
Pi to the new production address without giving UAT its own.

The earlier guess that the every-15-minutes cron was the cause was wrong: the 7-day chart has no steady trickle.

## Decision

UAT becomes a **third instance on the same Pi**, the pattern test already uses, because the customer tests on it
and "occasionally an error page" is not acceptable for that. Zero ongoing cost holds (no Workers Paid, no new
hardware).

- `ORIGIN_HOST: "uat-pi.lannacare.org"` in the `uat` env; tunnel ingress `uat-pi.lannacare.org` → `127.0.0.1:3002`
  presenting `Host: lannacare.org`; `scripts/check-site-hosts.mjs` proves the pairing (each tunnel hostname is the
  `ORIGIN_HOST` of exactly one environment and presents that environment's own address).
- `scripts/pi/lanna-care-uat.service` (port 3002, `Nice=5`, `CPUWeight=75`, `MemoryMax=900M`: between production
  and test, because a person is testing on it) and `scripts/pi/setup-uat.sh`.
- `deploy-pi.sh` now knows three clone kinds by folder name (`*_test`, `*_uat`, otherwise production) and
  refuses any pairing that does not match. **This closes a latent hole, not just a gap:** `--env uat` used to be
  accepted from the production clone (the script mapped it to a service, never to a clone), so it would have
  built UAT's database into the `.next` that `lanna-care.service` serves to the shelter's staff.
- UAT clone isolation: it must not hold `.env.deploy.production` (deploy and setup refuse) and must not hold
  `.env.local` (setup refuses: dev's database and the Supabase token). Everything UAT needs is in `.env.deploy.uat`.
- `write-env.mjs`: photo cache `~/photo-cache-uat`, service group `lannacare-uat`, no Drive mirror (production's
  Drive only). Written as "anything not production" so a future environment does not silently get production's.

## What was not decided here, and was left alone

- **Memory.** Three Next servers on a 4 GB Pi. `MemoryMax=900M` caps each of test and UAT, but nobody has
  measured the three together; the runbook's step 2 says to read `free -m` and production's restarts first.
  If it does not fit, the fallback is to stop test's service when UAT is in use, not to drop UAT's Pi.
- The WAF rule is edited, never added to (free plan: five custom rules).
- The Pi, the tunnel and Cloudflare are Lutan's hands; nothing here can be applied from this repository. Until he
  has done steps 1–3 of the runbook and deployed the UAT Worker, **nothing changes for anyone**: a Worker that
  names a tunnel with no origin behind it takes the 530 path back to rendering itself, which is today's behaviour.

## Not verified here

Nothing was run on the Pi. The shell scripts parse (`bash -n`), `check-site-hosts`, `check-self-update` and the
gates pass, and `deploy-pi.sh`'s new refusals follow the existing ones line for line. A first real run of
`setup-uat.sh` and the drill in the runbook are what prove it.
