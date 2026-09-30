# 2026-09-30 — One Pi hosts the site and takes the backup

## Decision

There is **one** Raspberry Pi 5, in Lutan's home in Suphan Buri, and it does both jobs:
it renders the site behind the Cloudflare Tunnel (`docs/pi-hosting.md`) and it runs the
weekly production database backup. The backlog carried two Pi items until today, on the
assumption of two machines (a hosting box and a separate backup Pi at home). That was
wrong; the items were folded into one, and the runbook's "Second Pi (later)" section
stays genuinely later, with no second connector today.

## What changed on the way

- **Debian 13 (trixie), not 12.** Raspberry Pi Imager's default moved on. Cloudflare's apt
  repo has no `trixie` suite (404) but has `any`, so `setup.sh` and the runbook use `any`
  (it also works on bookworm). Trixie's own `postgresql-client-17` is 17.11, which removes
  the PGDG step the brief warned about; bookworm's package is 15 and `pg_dump` refuses a
  17 server. Measured with `curl -sI` and `apt-cache policy` on the Pi, not assumed.
- **No adapter for the NVMe HAT**, so the system was built on a micro SD and copied to the
  SSD with `rpi-clone`. The Pi already booted NVMe first (`BOOT_ORDER=0xf146`).
- **Production is switched by a PR and a release cut**, not from a feature branch:
  `deploy.mjs` deploys production only from a clean, pushed `main` and only as a
  written-down release, so `ORIGIN_HOST` went out as PR 237 and release 0.10.1 (PR 238),
  not major, so no admin was mailed.
- **The WAF rule is the origin's access control**: `pi.lannacare.org` returns 403 to
  anything without `x-origin-key`. The key was regenerated once before use, because a
  failed command had echoed its first and last characters into a screenshot.

## The backup flag: `--local-copy`, not `--local`

`--local <dir>` dumps to a folder and **skips Drive entirely**, with no pruning, so it
could not be the Pi's flag. `--local-copy <dir>` uploads to Drive **and** keeps a copy,
removes local copies beyond `--keep` (default 12, so about a quarter of a year of weekly dumps) only
after the upload is confirmed, and prints each removal, so nothing is deleted silently and
a failed run removes nothing. A dump is under 1 MB today, so retention is about history,
not disk. The folder must be outside the repo (the script refuses one inside it), is
created `0700`, and each dump is `0600`.

## The trade-off the two-box split was quietly avoiding

Hosting was designed to hold no data; the backup puts a production dump on the SSD of a
machine that also runs an internet-reachable render service. The Tunnel is outbound-only
and `next start` listens on `127.0.0.1`, so the exposure is a compromised app, not an open
port. Handled: permissions and location above; **Drive stays the off-site copy**, because
the Pi is in the same house as the origin it protects. **Not handled, and recorded here so
it is not lost:**

- The app service and the backup run as the same user, so a compromised app process could
  read the dumps and `.env` files. A separate user for the app is the next step.
- **The dumps are not encrypted**, in Drive or on the Pi (audit finding DB-1, still open on
  the backlog). The Pi's cron job will keep producing plaintext dumps that include the
  `auth` schema until DB-1 is done. The intended design is `age` public-key encryption, so
  the key that decrypts never lives on the Pi, plus excluding the session tables, dropping
  the Drive link from the log, and a restore rehearsal.

## Not yet done

- The first **scheduled** Sunday run (2026-10-04 03:00) has not fired. The backup was proven
  by hand and again under cron's minimal environment (`env -i`, exit 0), not by the schedule
  itself. The laptop's Task Scheduler job also runs at that time and stays until the Pi's run
  is confirmed, then `scripts\backup-schedule.ps1 -Remove`.
- The load test could only exercise signed-out pages (light on CPU), where the Pi was
  slower than the test Worker (p50 310 ms against 41 ms) because of the tunnel hop. It
  cannot show that the heavy signed-in pages that produced the 1102s now succeed; that is
  a manual check.
