#!/usr/bin/env bash
# One-time setup of a Raspberry Pi (Debian 12 "bookworm" or 13 "trixie", 64-bit) as the
# app's origin behind a Cloudflare Tunnel. docs/pi-hosting.md walks through
# the parts that happen in the Cloudflare dashboard; this does the box.
#
#   git clone https://github.com/lutanbennett/Animal_Shelter_App.git ~/Animal_Shelter_App
#   cd ~/Animal_Shelter_App && ./scripts/pi/setup.sh <tunnel-id>
#
# Before running: copy .env.deploy.production (only that one — NOT .env.local, which
# holds the Supabase token that must never be on the Pi) into the repo root (never commit it), and have the tunnel's credentials JSON from
# `cloudflared tunnel create` (or the dashboard) ready for step 4.
#
# Idempotent — re-run after a change to the unit or the tunnel config.
set -euo pipefail
# Never run as root: this script already calls sudo for the steps that need it, and
# running all of it under sudo leaves node_modules, .next and the env file root-owned
# (docs/decisions/2026-10-06-setup-test-sudo-guard.md).
if [[ "$(id -u)" -eq 0 ]]; then
  OWNER="${SUDO_USER:-<your user>}"
  {
    echo "setup: REFUSING to run as root."
    echo "  Run it as your own user. It calls sudo itself, for the apt and systemd steps only, and"
    echo "  will ask for your password there:"
    echo "    cd ~/Animal_Shelter_App && ./scripts/pi/setup.sh <tunnel-id>"
    echo "  Run as root, everything it builds (node_modules, .next, the env file) would belong to"
    echo "  root and every later deploy would fail with EACCES."
    echo "  Already ran it under sudo? Hand the folder back, then run it again as above:"
    echo "    sudo chown -R $OWNER:$OWNER $(cd "$(dirname "$0")/../.." && pwd)"
  } >&2
  exit 2
fi
cd "$(dirname "$0")/../.."
REPO="$(pwd)"
RUN_USER="$(id -un)"
TUNNEL_ID="${1:-}"
if [[ -z "$TUNNEL_ID" ]]; then
  echo "usage: $0 <tunnel-id>   (from 'cloudflared tunnel create lanna-care' or the Zero Trust dashboard)"; exit 2
fi
[[ -f .env.deploy.production ]] || { echo "setup: .env.deploy.production is missing — copy it from the dev machine first"; exit 2; }
if [[ -f .env.local ]]; then
  echo "setup: note — .env.local is present. The production Pi does not need it (put the Drive values in .env.deploy.production); delete it unless this is a deliberate exception." >&2
fi

echo "== 1. Node 22 (NodeSource) and build tools"
if ! command -v node >/dev/null || [[ "$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y git curl
node --version && npm --version
# Node is now here, so the guard can run: refuse before anything is built or started.
node scripts/pi/check-no-forbidden.mjs

echo "== 2. cloudflared (Cloudflare's apt repo, arm64)"
if ! command -v cloudflared >/dev/null; then
  sudo mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" \
    | sudo tee /etc/apt/sources.list.d/cloudflared.list >/dev/null
  sudo apt-get update && sudo apt-get install -y cloudflared
fi
cloudflared --version

echo "== 3. The app: dependencies, env file, first build"
npm ci --no-audit --no-fund
node scripts/pi/write-env.mjs --env production
npm run build

echo "== 4. systemd: lanna-care.service"
sed -e "s|__USER__|$RUN_USER|g" -e "s|__REPO__|$REPO|g" scripts/pi/lanna-care.service \
  | sudo tee /etc/systemd/system/lanna-care.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable --now lanna-care
sleep 3
curl -fsS -o /dev/null -H "Host: lannacare.org" -H "x-origin-key: $(grep -s "^ORIGIN_KEY=" .env.production.local | cut -d= -f2-)" http://127.0.0.1:3000/ && echo "app answers on :3000"

echo "== 5. cloudflared as a service"
sudo mkdir -p /etc/cloudflared
if [[ ! -f "/etc/cloudflared/$TUNNEL_ID.json" ]]; then
  if [[ -f "$HOME/.cloudflared/$TUNNEL_ID.json" ]]; then
    sudo cp "$HOME/.cloudflared/$TUNNEL_ID.json" /etc/cloudflared/
  else
    echo "setup: put the tunnel credentials at /etc/cloudflared/$TUNNEL_ID.json (from 'cloudflared tunnel login' + 'cloudflared tunnel create'), then re-run"; exit 2
  fi
fi
sed -e "s|__TUNNEL_ID__|$TUNNEL_ID|g" scripts/pi/cloudflared-config.yml | sudo tee /etc/cloudflared/config.yml >/dev/null
sudo chmod 600 /etc/cloudflared/*.json
# `cloudflared service install` writes its own unit pointing at /etc/cloudflared/config.yml.
sudo cloudflared service install 2>/dev/null || true
sudo systemctl enable --now cloudflared
sudo systemctl restart cloudflared
sleep 3
sudo systemctl is-active --quiet cloudflared && echo "cloudflared connected (journalctl -u cloudflared -n 20 to see the edge locations)"

echo "== 6. Unattended security updates"
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -f noninteractive unattended-upgrades

echo "== 7. Daily database backup (03:00 Bangkok time)"
# Needs postgresql-client-17 and .env.deploy.production with BACKUP_AGE_RECIPIENT (docs/pi-hosting.md, Backups on this Pi).
# --shared-drive-token: interim, the app's Drive token (Lutan, 2026-10-13); drop it once BACKUP_GOOGLE_OAUTH_* exists on the Pi.
# Removes dumps older than 14 days, never the newest five, and nothing unless the day's upload succeeded.
mkdir -p "$HOME/backups/lannacare"
BACKUP_CRON="0 3 * * * cd $HOME/Animal_Shelter_App && node scripts/backup.mjs --env production --shared-drive-token --keep-days 14 --local-copy $HOME/backups/lannacare >> $HOME/backups/backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'scripts/backup.mjs' ; echo "$BACKUP_CRON" ) | crontab -
crontab -l | grep 'scripts/backup.mjs'

echo
echo "Done on the Pi. Now in Cloudflare (docs/pi-hosting.md, 'Cloudflare side'):"
echo "  - route pi.lannacare.org to tunnel $TUNNEL_ID (cloudflared tunnel route dns $TUNNEL_ID pi.lannacare.org)"
echo "  - WAF rule requiring the x-origin-key header on that hostname"
echo "  - ORIGIN_KEY in .env.deploy.production, ORIGIN_HOST=pi.lannacare.org in wrangler.jsonc, then 'npm run deploy:prod -- --secrets'"
