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
1b. **Server Actions key** (one per environment, shared by the Worker and the Pi).
   `node scripts/actions-key.mjs --generate`, then put
   `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<it>` in the environment's values file on
   the dev machine (`.env.deploy.production`; `.env.local` for test) **and the same
   line in the same file on the Pi**. Without it each build invents its own key,
   and a form rendered by one build is rejected by the other with "Failed to find
   Server Action" — which now happens whenever the Worker takes over a write
   (`docs/decisions/2026-10-03-server-actions-encryption-key.md`). `deploy.mjs` and
   `write-env.mjs` refuse to build without it. **Check they match:**
   `node scripts/actions-key.mjs --env production` prints a fingerprint on each
   machine (equal fingerprints, equal keys), and both deploys print it after
   building. **Rotating it** (generate a new one, set it in all four places,
   deploy both) makes forms already open in someone's browser fail once, as any
   deploy does; a reload fixes it.
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

- **Deploy**: after cutting a release (`src/lib/releases.ts`, `package.json`),
  merging it to `main` and applying migrations from the dev machine, on the Pi
  `cd ~/Animal_Shelter_App && ./scripts/pi/deploy-pi.sh` (pull, **guard**, build,
  restart, then prints who served the home page). The Pi serves users, so it is
  guarded like `deploy.mjs`: production and uat **refuse** when `unreleased` has
  notes, `package.json` is not the newest release, or the database lacks a
  migration the commit carries (`could not ask` only warns); `--env test` is
  unguarded. A refusal happens before anything is built, so the running service
  is untouched. A genuine emergency: `./scripts/pi/deploy-pi.sh --force "why"`
  prints every overridden problem loudly and appends the reason to
  `~/lanna-deploy-overrides.log`; mention it in the next release record. Also
  `npm run deploy:prod` from the dev machine so the fallback keeps pace —
  a version gap between the two is harmless (same database) but not worth
  leaving for long.
- **Logs**: `journalctl -u lanna-care -f`, `journalctl -u cloudflared -f`.
- **Restart**: `sudo systemctl restart lanna-care`.
- **Test on the same Pi**: its own clone, its own service, never production's
  folder. `~/Animal_Shelter_App_test` holds its own `node_modules`, `.next` and
  `.env.production.local` (dev Supabase, dev Drive, written by
  `write-env.mjs --env test`); `lanna-care-test.service`
  (`scripts/pi/lanna-care-test.service`) runs from it on 127.0.0.1:3001 at
  `Nice=10`, `CPUWeight=50`, `MemoryMax=900M`, and test builds run under `nice`.
  **Why a separate clone:** a build bakes `NEXT_PUBLIC_*` into `.next`, and the
  service serves whatever `.next` is in its folder, so a test build in the
  production folder would put the dev database in front of users at the next
  restart. `deploy-pi.sh` therefore **refuses** `--env test` from a clone not named
  `*_test`, refuses production/uat from one that is, and refuses to run in a test
  clone that holds `.env.deploy.production` or `.env.deploy.uat` (it names the
  folder and the command to run instead). The test clone's photo cache is
  `~/photo-cache-test`, separate from production's.
  Setup, once: clone to `~/Animal_Shelter_App_test`, copy the dev `.env.local` in
  (and nothing else), run `./scripts/pi/setup-test.sh`. Deploy:
  `cd ~/Animal_Shelter_App_test && ./scripts/pi/deploy-pi.sh --env test`
  (`--ref origin/claude/<feature>` puts a branch on test). Then, outside the box:
  `cloudflared tunnel route dns <tunnel> test-pi.lannacare.org`; the WAF rule
  (**the free plan allows five custom rules, so extend production's expression to
  `http.host in {"pi.lannacare.org" "test-pi.lannacare.org"}` rather than adding a
  sixth**; both Workers send the same key); `ORIGIN_KEY=<same value>` in
  **`.env.local`** on the dev machine (test's values file is `.env.local`, there is
  no `.env.deploy.test`); `npm run deploy:test -- --secrets`. `ORIGIN_HOST` is
  already `test-pi.lannacare.org` in the test env of `wrangler.jsonc`.
  **Check:** `curl -sI https://test.lannacare.org/login | grep x-lanna` says `pi`,
  and so does a signed-in page; `curl -sI https://test-pi.lannacare.org/` from
  elsewhere is 403. **Failover drill:** `sudo systemctl stop lanna-care-test` and
  the header flips to `worker`; sign in and submit something while it is
  stopped, because a GET-only drill passed on 2026-09-30 while auth and every
  Server Action were broken. **Capacity:** with both servers running and a test
  build in progress, watch `free -m` and `journalctl -u lanna-care` for restarts.
- **Rollback (the Pi serves users, so this is the production rollback)**:
  find the release's commit (`git log --oneline -- src/lib/releases.ts`, the
  cut that preceded the bad one), then `./scripts/pi/deploy-pi.sh --ref <sha>`.
  It rebuilds that commit and restarts, a few minutes, with the Worker answering
  meanwhile; the same guards apply, so a cut-release commit passes. It does
  **not** revert migrations. `npx wrangler rollback --env production` reverts
  only the Worker fallback, which answers when the Pi times out; run it as well
  if the Worker also carries the bad release.
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

## Spare boot drive (USB SSD)

**Status 2026-10-02: script, timer and these steps are in; the boot test has not been
done, so this is not yet a spare.** A clone nobody has booted is not a spare. The
acceptance for the backlog item is: with the NVMe out, the Pi boots from the USB drive
and `curl -sI https://lannacare.org/` says `x-lanna-served-by: pi`.

**What it is.** A USB SSD holding a bootable clone of the NVMe: the OS, `/etc`, and
everything that is not in git (the two env files, the `cloudflared` credentials and config,
the `lanna-care` unit, the encrypted dumps in `~/backups`). It is the quick way back from
a **dead NVMe**: minutes, not a rebuild from `setup.sh` plus hunting for secrets.

**What it is not. Read this before relying on it.** The drive sits in the same box in the
same house. Theft, fire, flood or a power surge takes the NVMe *and* the spare together.
**Drive and GitHub stay the off-site copies. The USB drive is not the backup.** Nobody
should restore the database from it when a Drive copy exists.

### One-time setup

1. Plug the drive into a **blue USB 3 port** and check it is the drive you mean:
   `lsblk -o NAME,SIZE,MODEL,TRAN` and `ls -l /dev/disk/by-id/ | grep usb`.
   Check it is not throttling: `vcgencmd get_throttled` must say `0x0` (the 27 W supply).
2. **Check the drive is real before it holds anything** (see "The first drive" below):
   `sudo apt install f3 && sudo f3probe --destructive --time-ops /dev/sdX`.
3. `sudo scripts/pi/spare-clone.sh init /dev/disk/by-id/usb-<the one from step 1>`.
   It refuses the disk the Pi booted from, refuses a non-USB disk, makes you retype the
   device name, **fails a drive slower than about 9 MB/s**, then writes a 512 MB FAT32 boot
   partition and a 64 GB ext4 root (`ROOT_SIZE=` to change) and **leaves the rest
   unpartitioned** for a data partition (the archive mirror, a separate backlog item).
   It clones, checks the clone's `cmdline.txt` names the clone's own root partition, and
   installs `spare-clone.timer`. The drive is recorded by its `by-id` name in
   `/etc/default/lanna-spare`, **never `/dev/sda`**, so a different drive that enumerates
   first is not touched. The mount by UUID requirement does not arise: nothing mounts the
   spare except the clone script, and the clone's own `fstab` uses PARTUUIDs.
4. Do the **boot test** below once, then record the date here.

### Keeping it current

`spare-clone.timer` runs Sundays 04:00, an hour after the weekly backup, so each clone
carries that week's encrypted dump (the dumps live in `~/backups`, which `rpi-clone`
copies like everything else; there is no separate "copy the dumps to the USB drive" step).
Missed runs fire at the next boot. It runs `rpi-clone -u`, which **cannot erase**: if the
layout no longer matches it stops and says so rather than re-initialising.

- Look: `scripts/pi/spare-clone.sh status` (prints the age; exits 2 over 9 days) and
  `systemctl list-timers spare-clone.timer`; `journalctl -u spare-clone -n 50` for a run.
- **Before an OS upgrade**, clone first: `sudo scripts/pi/spare-clone.sh`.
- Skipped: `~/photo-cache`, `~/.cache`, the npm cache (rebuildable).
- `/var/lib/lanna-spare/status.json` is `{"lastAttempt","lastSuccess","result","detail"}`
  with `result` one of `ok | failed | absent` (drive unplugged). **That file is the
  clone-age tile for the Home Assistant item**: show `lastSuccess`, go amber past 8 days
  and red on `failed`/`absent`. Nothing is built for it here; that item owns the dashboard.

### Boot test (the point of the item)

`BOOT_ORDER=0xf146` reads right to left: **6 NVMe, then 4 USB, then 1 SD**, then retry. With
the NVMe present it always wins, so to test the clone you must take the NVMe out of the
running.

1. `sudo scripts/pi/spare-clone.sh` (fresh clone), then `sudo poweroff`; wait for the LED to go dark.
2. **Unplug the power**, then remove the NVMe HAT (or its ribbon cable). Keep the USB drive in.
3. Power on. Wait two minutes. `ssh` in (the hostname and `authorized_keys` came across).
4. `findmnt /` must say `/dev/sda2`; `systemctl is-active lanna-care cloudflared` both `active`;
   `curl -sI https://lannacare.org/ | grep -i served-by` says `pi`.
5. Power off, put the NVMe back, power on, and confirm `findmnt /` is `nvme0n1p2` again.

If step 3 never gets an IP: attach a monitor. A rainbow screen or a blank one means the
bootloader found nothing bootable on USB; check `sudo rpi-eeprom-config | grep BOOT_ORDER`
and that `/boot/firmware` on the USB drive has `cmdline.txt` naming its own `PARTUUID`.

### Recovery: the NVMe is dead and you have no context

1. **Do not panic; the site is still up** through the Worker fallback (staff pages are
   slower and may show a 1102 now and then). Drive has the data; GitHub has the code.
2. Power the Pi off at the wall. Take out the dead NVMe (or leave it; USB is tried second).
3. Leave the USB drive in a **blue** port. Power on. It boots from the spare in about a minute.
4. `ssh lutan@lanna-pi.local`. Check `findmnt /` is `/dev/sda2`, then
   `systemctl is-active lanna-care cloudflared` and the `curl` from the boot test.
5. The site now runs from the spare, at USB speed. **Fit a replacement NVMe**, then copy
   back onto it with `sudo rpi-clone nvme0n1 -f` (as in "Building the box": it erases the
   destination; read the two disk lines before typing `yes`). Reboot; `findmnt /` should be
   `nvme0n1p2`. Then re-run `sudo scripts/pi/spare-clone.sh` to make the spare current again.
6. If the spare also will not boot: `git clone` the repo, copy the two env files from the
   dev machine (not from the Pi), and follow "Pi side (once)" and `setup.sh`. The
   `cloudflared` credentials JSON can be re-created in the Zero Trust dashboard.

### Encryption: decided how (see `docs/decisions/2026-10-02-spare-boot-drive-not-encrypted.md`)

The clone holds the env files and the tunnel credentials in plain text, because a Pi
that must come back unattended after a power cut cannot wait for a LUKS passphrase. The
dumps in it are already age-encrypted (`.dump.age`; the key is not on the Pi). So keep
the drive **plugged into the Pi and out of sight**, never lend or post it, and treat a
lost or stolen drive like a lost laptop: rotate the secrets in the decision's list.

### The first drive (2026-10-02): a counterfeit, rejected

The first USB SSD tried sold itself as 2 TB (`idVendor=048d idProduct=1234`, product
`VendorCo ProductCode`, enumerating at USB 2 speed). A raw `dd` to it ran at **40 to 50 kB/s**
(a healthy USB 2 link does 30 MB/s or more) and `mkfs.ext4` of the full size ran over half an
hour without finishing. `init` now fails a slow drive for this reason. **Use a branded
500 GB to 1 TB SSD** from a reputable shop (the clone needs about 7 GB; the archive less than
that), and run `f3probe` on it before first use.

## Second Pi (later)

There is **no second connector today**. This section is for if one is ever added.

Same `setup.sh` with the **same tunnel id** and a copy of the same
credentials file. Cloudflare balances between the connectors and drops
one that stops answering. Put it somewhere with different power and
internet — the shelter itself is the obvious place — and run
`deploy-pi.sh` on both after each merge.

## Photo cache on the Pi

`/api/photos/<id>?w=160|400|1200` serves Drive's own sized copy of a public photo
(`docs/decisions/2026-10-01-public-photo-sizing.md`). On the Pi each size is also kept
in `~/photo-cache/<fileId>/<w>.jpg` (`PHOTO_CACHE_DIR`, written into
`.env.production.local` by `write-env.mjs` on every `deploy-pi.sh`), capped at 1 GiB
(`PHOTO_CACHE_MAX_MB`) with oldest-first eviction. It is disposable: not in the
backups, and `rm -rf ~/photo-cache` is always safe. The Worker fallback has no disk
and goes to Drive. To see it working: request a size twice; the second is served
from the folder with no Drive call.

## Edge cache notes

The Worker caches anonymous GETs of `/`, `/adopt…`, `/our-work…`,
`/foster…`, `/volunteer…`, `/donate…` for 10 minutes per Cloudflare data
centre, per `locale` cookie. A change on `/admin/website` or to a
resident's public profile can therefore take up to 10 minutes to appear
to visitors (staff, being signed in, always bypass). Photos are cached
separately by the proxy's own headers (a day). To flush early: Cloudflare
dashboard → Caching → Configuration → **Purge Everything** (free; the
edge cache and the photo cache both go).
