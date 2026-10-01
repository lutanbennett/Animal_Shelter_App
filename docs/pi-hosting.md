# Hosting: the Pi renders, the Worker fronts and falls back

Since 2026-09-22. Why: Cloudflare's free Workers plan allows 10 ms of CPU
per request and a Next.js page costs 30–40 ms, so the Worker alone throws
intermittent `1102 Worker exceeded resource limits` (see `decisions.md`).
There is no budget for Workers Paid, so the page rendering moves to a
Raspberry Pi 5 with real CPU, and the Worker stays as the front door and
the fallback.

**There is one Pi** (a Raspberry Pi 5 in Lutan's home in Suphan Buri) and it does two
jobs: it renders the site, and it takes the weekly database backup. An earlier plan
assumed two machines; that was wrong (decisions/2026-09-30-one-pi-hosting-and-backup.md).

```
visitor ──► Cloudflare edge ──► Worker (worker/index.mjs)
                                  │ 1. edge cache   public pages, anonymous, 10 min
                                  │ 2. pi.lannacare.org ──► Cloudflare Tunnel ──► Pi: next start :3000
                                  │ 3. render here  (OpenNext, as before) when 2 fails
                                  ▼
                              Supabase (Mumbai), Google Drive — unchanged either way
```

Every response carries `x-lanna-served-by: pi | worker` and
`x-lanna-cache: HIT | MISS | BYPASS`, so `curl -sI https://lannacare.org/`
tells you which path answered.

What the Pi's outage costs: the staff app falls back to Worker rendering
(the old intermittent 1102 on heavy pages); the public site keeps coming
from the edge cache. The site's data is never on the Pi; the one exception is the
weekly backup, whose dumps sit on its SSD ("Backups on this Pi" below).

## Pi side (once)

Raspberry Pi OS Lite 64-bit, Debian 12 (bookworm) or 13 (trixie), booted from the
NVMe SSD, on the home network. Imager now offers **trixie**, and that is what this
Pi runs. As the normal user:

```bash
sudo apt-get update && sudo apt-get install -y git curl
git clone https://github.com/lutanbennett/Animal_Shelter_App.git ~/Animal_Shelter_App
cd ~/Animal_Shelter_App
# copy .env.local and .env.deploy.production here from the dev machine (scp) — never commit them
```

Create the tunnel from the Pi (the login prints a URL to open in any
browser signed in to the Cloudflare account):

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
cloudflared tunnel login
cloudflared tunnel create lanna-care          # prints the tunnel id; credentials land in ~/.cloudflared/<id>.json
cloudflared tunnel route dns lanna-care pi.lannacare.org
```

Then everything else:

```bash
./scripts/pi/setup.sh <tunnel-id>
```

which installs Node 22 and cloudflared, builds the app, installs
`lanna-care.service` (next start on 127.0.0.1:3000, restart always) and
the cloudflared service with `scripts/pi/cloudflared-config.yml` (Host
header rewritten to `lannacare.org`), and turns on unattended security
updates. Re-runnable.

## Cloudflare side (once)

1. **Shared secret.** `openssl rand -hex 32` → add to
   `.env.deploy.production` as `ORIGIN_KEY=…` on the dev machine.
2. **WAF rule** so only the Worker can reach the Pi: Security → WAF →
   Custom rules → create, expression
   `(http.host eq "pi.lannacare.org" and not any(http.request.headers["x-origin-key"][*] eq "<the key>"))`,
   action **Block**. (Free plan: 5 custom rules.)
3. **Point the Worker at the Pi**: in `wrangler.jsonc`, production
   `ORIGIN_HOST: "pi.lannacare.org"`; commit on a branch and merge as
   usual. Then `npm run deploy:prod -- --secrets` (uploads `ORIGIN_KEY`
   alongside the other secrets).
4. **Check**: `curl -sI https://lannacare.org/login | grep x-lanna` →
   `x-lanna-served-by: pi`. A page in the app (signed in) should also say
   `pi`. `curl -sI https://pi.lannacare.org/` from anywhere else → 403
   from the WAF.
5. **Failover drill**: `sudo systemctl stop lanna-care` on the Pi; the
   header flips to `worker` within a second; `start` it again and it flips
   back. Do the same with `cloudflared` (tunnel down → 530 → worker).

## Day to day

- **Deploy**: after merging to `main` and applying migrations from the dev
  machine, on the Pi `cd ~/Animal_Shelter_App && ./scripts/pi/deploy-pi.sh`
  (pull, build, restart, then prints who served the home page). Also
  `npm run deploy:prod` from the dev machine so the fallback keeps pace —
  a version gap between the two is harmless (same database) but not worth
  leaving for long.
- **Logs**: `journalctl -u lanna-care -f`, `journalctl -u cloudflared -f`.
- **Restart**: `sudo systemctl restart lanna-care`.
- **Test on the same Pi** (optional): `./scripts/pi/deploy-pi.sh --env test`
  needs a `lanna-care-test.service` copy on port 3001, a
  `test-pi.lannacare.org` DNS route to the same tunnel (already in the
  cloudflared config), and `ORIGIN_HOST: "test-pi.lannacare.org"` in the
  Worker's test env.
- **Rollback to Worker-only**: set `ORIGIN_HOST` back to `""` and
  `npm run deploy:prod`. The Pi can stay running; nothing reaches it.

## Building the box (what was done on 2026-09-30)

The NVMe SSD is on a HAT, and there was no adapter to flash it from a laptop, so:
flash a micro SD with Raspberry Pi Imager (Lite 64-bit; hostname, user, SSH and the
Bangkok time zone set in Imager's settings), boot from it, SSH in, then copy the
running system to the NVMe drive with `rpi-clone`
(`sudo rpi-clone nvme0n1 -f`, from github.com/geerlingguy/rpi-clone) and pull the SD
card. The boot order on this Pi was already `0xf146` (NVMe first), so no change was
needed; `df -h /` showing `nvme0n1p2` confirms it booted from the SSD. `rpi-clone`
erases the destination: read the source and destination lines before typing `yes`.

**Where reality differed from the plan** (all fixed in the scripts):

- Cloudflare's apt repo has no `trixie` suite (404), only `any`. `setup.sh` and the
  commands above use `any`, which also works on bookworm.
- `pg_dump` 17 needs no extra repo on trixie (`postgresql-client-17` is 17.11 there).
  On bookworm the package is 15 and `pg_dump` refuses a 17 server.
- `deploy.mjs` deploys production only from a clean, pushed `main` and only as a
  written-down release, so switching `ORIGIN_HOST` had to go through a PR and a
  release cut, not straight from a feature branch.

**Failover drill, run 2026-09-30, both halves passed.** With `lanna-care` stopped,
the header went `pi` → `worker` and every request still returned 200; after `start` it
went back to `pi`. The same with `cloudflared` stopped. A cold first request while the
Worker discovers the Pi is down takes about one to two seconds; the rest are fast.

## Backups on this Pi

The same box takes the weekly database backup (README "Backups"): a cron job runs
`scripts/backup.mjs --env production --local-copy ~/backups/lannacare` on Sundays at
03:00, which uploads to Drive and keeps the newest 12 dumps on the SSD, printing each
one it removes. Needs `postgresql-client-17` (above) and the same two env files, plus the public key.

Holding a production dump on an internet-reachable render box means the old "no data
on the Pi" rule no longer holds, so:

- **The dumps are encrypted and the Pi cannot read them.** `backup.mjs` encrypts with the
  administrator's age *public* key (`BACKUP_AGE_RECIPIENT` in `.env.deploy.production`)
  before the Drive upload and before the local copy, and never writes a plaintext file.
  The private key is in Lutan's password manager and is never on the Pi, so a read of
  `~/backups` by a compromised app gives ciphertext only. It refuses to run with no key.
  The session tables are left out of the dump and the Drive link is no longer logged.
  **Setup on the Pi:** add the `BACKUP_AGE_RECIPIENT=age1…` line, `git pull && npm ci`
  (adds `age-encryption`), then run `node scripts/backup.mjs --env production --local-copy ~/backups/lannacare`
  once by hand. Then handle what predates encryption: **delete the plaintext
  `~/backups/lannacare/*.dump` files** (the run names each one it finds), and **remove
  or truncate `~/backups/backup.log`**, which holds a live Drive link for every earlier
  week (`: > ~/backups/backup.log`). Assume those links are exposed until the Drive
  folder is re-shared (README "Backups").
- The Tunnel is outbound-only and `next start` listens on `127.0.0.1` only, so nothing
  is exposed to the internet directly. The exposure is a compromised app, not an open port.
- The dump folder is `0700` and each dump `0600`, outside the repo (`backup.mjs` refuses a
  folder inside it), so nothing the app serves can reach it.
- **Known limit:** the app service and the backup run as the same user, so a compromised
  app process could read the dumps and the env files anyway. Splitting the app onto its
  own user is the next step if the threat model needs it; it is not done.
- **Drive stays the off-site copy.** The Pi is in the same house as the origin it
  protects; a flood or theft takes both.

## Second Pi (later)

There is **no second connector today**. This section is for if one is ever added.

Same `setup.sh` with the **same tunnel id** and a copy of the same
credentials file. Cloudflare balances between the connectors and drops
one that stops answering. Put it somewhere with different power and
internet — the shelter itself is the obvious place — and run
`deploy-pi.sh` on both after each merge.

## Edge cache notes

The Worker caches anonymous GETs of `/`, `/adopt…`, `/our-work…`,
`/foster…`, `/volunteer…`, `/donate…` for 10 minutes per Cloudflare data
centre, per `locale` cookie. A change on `/admin/website` or to a
resident's public profile can therefore take up to 10 minutes to appear
to visitors (staff, being signed in, always bypass). Photos are cached
separately by the proxy's own headers (a day). To flush early: Cloudflare
dashboard → Caching → Configuration → **Purge Everything** (free; the
edge cache and the photo cache both go).
