# Hosting: the Pi renders, the Worker fronts and falls back

Since 2026-09-22. Why: Cloudflare's free Workers plan allows 10 ms of CPU
per request and a Next.js page costs 30–40 ms, so the Worker alone throws
intermittent `1102 Worker exceeded resource limits` (see `decisions.md`).
There is no budget for Workers Paid, so the page rendering moves to a
Raspberry Pi 5 with real CPU, and the Worker stays as the front door and
the fallback.

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
from the edge cache. The data is never on the Pi.

## Pi side (once)

Debian 12 bookworm 64-bit, booted from the SSD, on the home network. As
the normal user:

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
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bookworm main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
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

## Second Pi (later)

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
