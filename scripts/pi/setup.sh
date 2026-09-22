#!/usr/bin/env bash
# One-time setup of a Raspberry Pi (Debian 12 "bookworm", 64-bit) as the
# app's origin behind a Cloudflare Tunnel. docs/pi-hosting.md walks through
# the parts that happen in the Cloudflare dashboard; this does the box.
#
#   git clone https://github.com/lutanbennett/Animal_Shelter_App.git ~/Animal_Shelter_App
#   cd ~/Animal_Shelter_App && ./scripts/pi/setup.sh <tunnel-id>
#
# Before running: copy .env.local and .env.deploy.production into the repo
# root (never commit them), and have the tunnel's credentials JSON from
# `cloudflared tunnel create` (or the dashboard) ready for step 4.
#
# Idempotent — re-run after a change to the unit or the tunnel config.
set -euo pipefail
cd "$(dirname "$0")/../.."
REPO="$(pwd)"
RUN_USER="$(id -un)"
TUNNEL_ID="${1:-}"
if [[ -z "$TUNNEL_ID" ]]; then
  echo "usage: $0 <tunnel-id>   (from 'cloudflared tunnel create lanna-care' or the Zero Trust dashboard)"; exit 2
fi
for f in .env.local .env.deploy.production; do
  [[ -f "$f" ]] || { echo "setup: $f is missing — copy it from the dev machine first"; exit 2; }
done

echo "== 1. Node 22 (NodeSource) and build tools"
if ! command -v node >/dev/null || [[ "$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y git curl
node --version && npm --version

echo "== 2. cloudflared (Cloudflare's apt repo, arm64)"
if ! command -v cloudflared >/dev/null; then
  sudo mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(. /etc/os-release && echo "$VERSION_CODENAME") main" \
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
curl -fsS -o /dev/null -H "Host: lannacare.org" http://127.0.0.1:3000/ && echo "app answers on :3000"

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

echo
echo "Done on the Pi. Now in Cloudflare (docs/pi-hosting.md, 'Cloudflare side'):"
echo "  - route pi.lannacare.org to tunnel $TUNNEL_ID (cloudflared tunnel route dns $TUNNEL_ID pi.lannacare.org)"
echo "  - WAF rule requiring the x-origin-key header on that hostname"
echo "  - ORIGIN_KEY in .env.deploy.production, ORIGIN_HOST=pi.lannacare.org in wrangler.jsonc, then 'npm run deploy:prod -- --secrets'"
