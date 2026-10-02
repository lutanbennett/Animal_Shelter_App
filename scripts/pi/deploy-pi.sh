#!/usr/bin/env bash
# Update the app on the Pi to the current origin/main and restart it.
#
#   ./scripts/pi/deploy-pi.sh                 # production values
#   ./scripts/pi/deploy-pi.sh --env test      # test.lannacare.org, from the TEST clone only
#   ./scripts/pi/deploy-pi.sh --env uat       # a UAT instance, from the cutover
#   ./scripts/pi/deploy-pi.sh --ref <sha>     # ROLLBACK: serve that commit instead
#   ./scripts/pi/deploy-pi.sh --force "why"   # emergency: past the release guard, on record
#
# uat and production ship only a written-down release, as scripts/deploy.mjs
# does for the Worker: unreleased notes empty, package.json at the newest
# release, every migration the commit carries applied. test is unguarded.
# The Pi is what serves users (the Worker answers only when it times out), so
# this is the deploy that needs the guard (docs/decisions/2026-10-02-pi-ships-releases.md).
#
# Production and test are separate clones of the repo (~/Animal_Shelter_App and
# ~/Animal_Shelter_App_test), each with its own node_modules, .next and env file,
# because a build bakes NEXT_PUBLIC_* values in and the running service serves
# whatever .next is in its WorkingDirectory. This script refuses to run for one
# environment from the other's clone (docs/decisions/2026-10-02-pi-test-own-clone.md).
#
# Builds into a fresh .next before swapping, so the running server keeps
# serving the old build until the new one is ready; the restart itself
# takes a second or two, during which the Worker's fallback answers
# (worker/index.mjs). Run from the repo root as the user the service runs as.
set -euo pipefail
cd "$(dirname "$0")/../.."

ENV_NAME=production
SERVICE=lanna-care
REF=origin/main
FORCE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV_NAME="${2:?--env needs a name}"; shift 2 ;;
    --ref) REF="${2:?--ref needs a commit}"; shift 2 ;;
    --force) FORCE="${2:?--force needs a reason}"; shift 2 ;;
    *) echo "deploy-pi: unknown argument $1"; exit 2 ;;
  esac
done
[[ "$ENV_NAME" == "test" ]] && SERVICE=lanna-care-test
[[ "$ENV_NAME" == "uat" ]] && SERVICE=lanna-care-uat

# Which clone is this? The folder name decides: ..._test is the test clone and
# nothing else is. A wrong pairing builds one environment's values into the
# other's .next, invisibly, so stop before anything is fetched, built or restarted.
CLONE="$(pwd)"
case "$(basename "$CLONE")" in
  *_test) CLONE_KIND=test ;;
  *) CLONE_KIND=production ;;
esac
if [[ "$ENV_NAME" == "test" && "$CLONE_KIND" != "test" ]]; then
  echo "deploy-pi: REFUSING --env test from $CLONE" >&2
  echo "  That is the production clone: its .next is what lanna-care.service serves, and a test" >&2
  echo "  build would bake the dev database into it. Run it from the test clone instead:" >&2
  echo "    cd ~/Animal_Shelter_App_test && ./scripts/pi/deploy-pi.sh --env test" >&2
  exit 2
fi
if [[ "$ENV_NAME" != "test" && "$CLONE_KIND" == "test" ]]; then
  echo "deploy-pi: REFUSING --env $ENV_NAME from $CLONE" >&2
  echo "  That is the test clone, which holds the dev database's values. Run it from the" >&2
  echo "  production clone instead:" >&2
  echo "    cd ~/Animal_Shelter_App && ./scripts/pi/deploy-pi.sh --env $ENV_NAME" >&2
  exit 2
fi
# Isolation: the test clone must never be able to read a production secret.
if [[ "$CLONE_KIND" == "test" ]]; then
  for f in .env.deploy.production .env.deploy.uat; do
    if [[ -e "$f" ]]; then
      echo "deploy-pi: REFUSING: $CLONE/$f exists. The test clone must not hold production or uat secrets; delete it." >&2
      exit 2
    fi
  done
fi
# Test builds are the ones that come and go; keep them from starving production.
NICE=()
[[ "$ENV_NAME" == "test" ]] && NICE=(nice -n 10)

echo "deploy-pi: fetching main"
# The test clone may be put on any branch (--ref origin/claude/<feature>), so it
# fetches them all; the production clone only ever needs main.
if [[ "$ENV_NAME" == "test" ]]; then git fetch origin --quiet; else git fetch origin main --quiet; fi
git checkout main --quiet
git reset --hard "$REF" --quiet
echo "deploy-pi: at $(git rev-parse --short HEAD) — $(git log -1 --format=%s)"

# Refuses (exit 2, set -e stops here) before anything is built or restarted,
# so the running service keeps serving the build it has.
GUARD_ARGS=(--env "$ENV_NAME")
[[ -n "$FORCE" ]] && GUARD_ARGS+=(--force "$FORCE")
node scripts/pi/guard-release.mjs "${GUARD_ARGS[@]}"

# Migrations are applied from the developer's machine (CLAUDE.md), never
# here; guard-release.mjs above refuses a uat/production deploy whose database
# lacks one. For test, --status just says where it stands.
node scripts/apply-migrations.mjs --env "$ENV_NAME" --status 2>/dev/null | tail -1 || true

node scripts/pi/write-env.mjs --env "$ENV_NAME"
"${NICE[@]}" npm ci --no-audit --no-fund   # devDependencies too: next build needs TypeScript and Tailwind
"${NICE[@]}" npm run build

sudo systemctl restart "$SERVICE"
sleep 3
sudo systemctl is-active --quiet "$SERVICE" && echo "deploy-pi: $SERVICE running" || {
  echo "deploy-pi: $SERVICE failed to start — journalctl -u $SERVICE -n 50"; exit 1;
}

# The public site through Cloudflare should now come from here.
# lannacare.org is UAT's for good; production keeps it only until the
# cutover moves it to lannacareforanimals.org (docs/decisions.md).
HOST=lannacare.org
[[ "$ENV_NAME" == "test" ]] && HOST=test.lannacare.org
[[ "$ENV_NAME" == "uat" ]] && HOST=lannacare.org
echo -n "deploy-pi: https://$HOST/ served by: "
curl -s -D - -o /dev/null "https://$HOST/?deploy=$(date +%s)" | grep -i x-lanna-served-by | tr -d '\r' || echo "(no header — Worker not deployed?)"
