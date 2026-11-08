#!/usr/bin/env bash
# One-time setup of the UAT instance (uat.lannacare.org) on a Pi that already runs production
# (scripts/pi/setup.sh). Run it inside its own clone:
#
#   git clone https://github.com/lutanbennett/Animal_Shelter_App.git ~/Animal_Shelter_App_uat
#   # put UAT's OWN values in ~/Animal_Shelter_App_uat/.env.deploy.uat  (see below)
#   cd ~/Animal_Shelter_App_uat && ./scripts/pi/setup-uat.sh
#
# The clone must be named *_uat (deploy-pi.sh decides by the folder name). It holds
# .env.deploy.uat and NOTHING else: no .env.local (dev's values, and the Supabase token),
# no .env.deploy.production. UAT has its own Supabase project
# (docs/decisions/2026-11-06-uat-own-database.md), so .env.deploy.uat must carry every value,
# the Google Drive set included, because nothing falls through to .env.local here.
# write-env.mjs names whatever is missing. Idempotent.
set -euo pipefail
# Never run as root: this script already calls sudo for the steps that need it, and
# running all of it under sudo leaves node_modules, .next and the env file root-owned
# (docs/decisions/2026-10-06-setup-test-sudo-guard.md).
if [[ "$(id -u)" -eq 0 ]]; then
  OWNER="${SUDO_USER:-<your user>}"
  {
    echo "setup-uat: REFUSING to run as root."
    echo "  Run it as your own user. It calls sudo itself, for the systemd steps only, and"
    echo "  will ask for your password there:"
    echo "    cd ~/Animal_Shelter_App_uat && ./scripts/pi/setup-uat.sh"
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
[[ "$(basename "$REPO")" == *_uat ]] || { echo "setup-uat: $REPO is not a *_uat clone — refusing (it would share another environment's .next)" >&2; exit 2; }
[[ -f .env.deploy.uat ]] || { echo "setup-uat: .env.deploy.uat is missing — UAT's own values go in it (not dev's, not production's)" >&2; exit 2; }
[[ -e .env.deploy.production ]] && { echo "setup-uat: $REPO/.env.deploy.production exists — the uat clone must not hold it; delete it" >&2; exit 2; }
[[ -e .env.local ]] && { echo "setup-uat: $REPO/.env.local exists — it is dev's values and would be layered under UAT's; move it off the Pi" >&2; exit 2; }

echo "== 1. The app: dependencies, env file, first build (niced)"
nice -n 10 npm ci --no-audit --no-fund
node scripts/pi/check-no-forbidden.mjs
node scripts/pi/write-env.mjs --env uat
nice -n 10 npm run build

echo "== 2. systemd: lanna-care-uat.service, running as its own user"
source scripts/pi/service-lib.sh
SVC_USER=lannacare-uat
ensure_service_user "$SVC_USER"
node scripts/pi/write-env.mjs --env uat
prepare_service_files "$SVC_USER" "$REPO" "$HOME/photo-cache-uat" no
install_unit scripts/pi/lanna-care-uat.service lanna-care-uat "$SVC_USER" "$REPO" "$HOME/photo-cache-uat"   http://127.0.0.1:3002/ uat.lannacare.org "$(grep -s "^ORIGIN_KEY=" .env.production.local | cut -d= -f2-)"

echo
echo "Capacity: three Next servers now share this Pi. Check 'free -m' and 'journalctl -u lanna-care -n 30' for restarts."
echo "Still to do (docs/pi-hosting.md, 'UAT on the same Pi'): cloudflared tunnel route dns <tunnel> uat-pi.lannacare.org,"
echo "install the new cloudflared config (the 3002 ingress), extend the WAF rule to the new host, then"
echo "npm run deploy:uat -- --secrets from the dev machine so the UAT Worker has ORIGIN_KEY and the new ORIGIN_HOST."
