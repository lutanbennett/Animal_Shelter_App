#!/usr/bin/env bash
# One-time setup of the TEST instance on a Pi that already runs production
# (scripts/pi/setup.sh). Run it inside its own clone:
#
#   git clone https://github.com/lutanbennett/Animal_Shelter_App.git ~/Animal_Shelter_App_test
#   cp ~/Animal_Shelter_App/.env.local ~/Animal_Shelter_App_test/   # dev values only
#   cd ~/Animal_Shelter_App_test && ./scripts/pi/setup-test.sh
#
# The clone must be named *_test (deploy-pi.sh decides by the folder name) and must
# not hold .env.deploy.production or .env.deploy.uat: test uses the dev database
# and dev Drive and nothing else. Idempotent.
set -euo pipefail
cd "$(dirname "$0")/../.."
REPO="$(pwd)"
RUN_USER="$(id -un)"
[[ "$(basename "$REPO")" == *_test ]] || { echo "setup-test: $REPO is not a *_test clone — refusing (it would share production's .next)" >&2; exit 2; }
[[ -f .env.local ]] || { echo "setup-test: .env.local is missing — copy the dev one in" >&2; exit 2; }
for f in .env.deploy.production .env.deploy.uat; do
  [[ -e "$f" ]] && { echo "setup-test: $REPO/$f exists — the test clone must not hold it; delete it" >&2; exit 2; }
done

echo "== 1. The app: dependencies, env file, first build (niced)"
nice -n 10 npm ci --no-audit --no-fund
node scripts/pi/write-env.mjs --env test
nice -n 10 npm run build

echo "== 2. systemd: lanna-care-test.service"
sed -e "s|__USER__|$RUN_USER|g" -e "s|__REPO__|$REPO|g" scripts/pi/lanna-care-test.service \
  | sudo tee /etc/systemd/system/lanna-care-test.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable --now lanna-care-test
sleep 3
curl -fsS -o /dev/null -H "Host: test.lannacare.org" http://127.0.0.1:3001/ && echo "test app answers on :3001"

echo
echo "Still to do (docs/pi-hosting.md, 'Test on the same Pi'): cloudflared tunnel route dns <tunnel> test-pi.lannacare.org,"
echo "re-run setup.sh's cloudflared step (or copy the config) so the 3001 ingress is live, extend the WAF rule to the new host."
