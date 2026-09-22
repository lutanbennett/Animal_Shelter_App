#!/usr/bin/env bash
# Update the app on the Pi to the current origin/main and restart it.
#
#   ./scripts/pi/deploy-pi.sh                 # production values
#   ./scripts/pi/deploy-pi.sh --env test      # a Test instance on the same Pi
#
# Builds into a fresh .next before swapping, so the running server keeps
# serving the old build until the new one is ready; the restart itself
# takes a second or two, during which the Worker's fallback answers
# (worker/index.mjs). Run from the repo root as the user the service runs as.
set -euo pipefail
cd "$(dirname "$0")/../.."

ENV_NAME=production
SERVICE=lanna-care
if [[ "${1:-}" == "--env" && -n "${2:-}" ]]; then
  ENV_NAME="$2"
  [[ "$ENV_NAME" == "test" ]] && SERVICE=lanna-care-test
fi

echo "deploy-pi: fetching main"
git fetch origin main --quiet
git checkout main --quiet
git reset --hard origin/main --quiet
echo "deploy-pi: at $(git rev-parse --short HEAD) — $(git log -1 --format=%s)"

# Migrations are applied from the developer's machine (CLAUDE.md), never
# here; a build against a database missing a migration is still a valid
# build, and --status just says so.
node scripts/apply-migrations.mjs --env "$ENV_NAME" --status 2>/dev/null | tail -1 || true

node scripts/pi/write-env.mjs --env "$ENV_NAME"
npm ci --no-audit --no-fund   # devDependencies too: next build needs TypeScript and Tailwind
npm run build

sudo systemctl restart "$SERVICE"
sleep 3
sudo systemctl is-active --quiet "$SERVICE" && echo "deploy-pi: $SERVICE running" || {
  echo "deploy-pi: $SERVICE failed to start — journalctl -u $SERVICE -n 50"; exit 1;
}

# The public site through Cloudflare should now come from here.
HOST=lannacare.org
[[ "$ENV_NAME" == "test" ]] && HOST=test.lannacare.org
echo -n "deploy-pi: https://$HOST/ served by: "
curl -s -D - -o /dev/null "https://$HOST/?deploy=$(date +%s)" | grep -i x-lanna-served-by | tr -d '\r' || echo "(no header — Worker not deployed?)"
