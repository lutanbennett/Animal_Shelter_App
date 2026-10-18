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
# `next build` rewrites .next in place (next.config.ts has no distDir switch), so
# this script keeps a copy of the last good .next and puts it back if the build or
# the Server Actions key check fails: a failed build never leaves the service on a
# half-written one. While a build runs, assets of the old build can still 404 --
# that is the window that poisoned Cloudflare's year-long cache on 2026-10-17, so
# the last step fetches the served stylesheet and compares it with the build
# (scripts/pi/check-assets.mjs). The restart itself takes a second or two, during
# which the Worker's fallback answers (worker/index.mjs). Run from the repo root as
# the user the service runs as. See docs/decisions/2026-10-18-pi-deploy-safety.md.
set -euo pipefail
# Never run as root: this script already calls sudo for the steps that need it, and
# running all of it under sudo leaves node_modules, .next and the env file root-owned
# (docs/decisions/2026-10-06-setup-test-sudo-guard.md).
if [[ "$(id -u)" -eq 0 ]]; then
  OWNER="${SUDO_USER:-<your user>}"
  {
    echo "deploy-pi: REFUSING to run as root."
    echo "  Run it as your own user. It calls sudo itself, for the service restart only, and"
    echo "  will ask for your password there:"
    echo "    ./scripts/pi/deploy-pi.sh [--env test]"
    echo "  Run as root, everything it builds (node_modules, .next, the env file) would belong to"
    echo "  root and every later deploy would fail with EACCES."
    echo "  Already ran it under sudo? Hand the folder back, then run it again as above:"
    echo "    sudo chown -R $OWNER:$OWNER $(cd "$(dirname "$0")/../.." && pwd)"
  } >&2
  exit 2
fi
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

# A ref CI never saw: production and uat ship only commits that are on main (every
# commit there came through a PR with CI green). A rollback to an older release is
# fine; a branch tip is not. --force records the reason and goes ahead.
if [[ "$ENV_NAME" != "test" ]] && ! git merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
  if [[ -n "$FORCE" ]]; then
    echo "deploy-pi: WARNING: $(git rev-parse --short HEAD) is not on origin/main, so CI has not passed it. Forced: $FORCE" >&2
  else
    echo "deploy-pi: REFUSING: $(git rev-parse --short HEAD) is not on origin/main, so no CI run has passed it." >&2
    echo "  Production and uat serve only commits that reached main through a PR. Deploy a commit on main," >&2
    echo "  or pass --force \"why\" to go past this on the record." >&2
    exit 2
  fi
fi

# Refuses (exit 2, set -e stops here) before anything is built or restarted,
# so the running service keeps serving the build it has.
GUARD_ARGS=(--env "$ENV_NAME")
[[ -n "$FORCE" ]] && GUARD_ARGS+=(--force "$FORCE")
node scripts/pi/guard-release.mjs "${GUARD_ARGS[@]}"

# Migrations are applied from the developer's machine (CLAUDE.md), never
# here; guard-release.mjs above refuses a uat/production deploy whose database
# lacks one. For test, --status just says where it stands.
node scripts/apply-migrations.mjs --env "$ENV_NAME" --status 2>/dev/null | tail -1 || true

# Memory precondition. `next build` peaks above 6 GB on this 4 GB Pi (killed by the kernel
# three times at 4 GB RAM + 2 GB swap; through first try with 4 GB of file-backed swap added),
# so refuse now, before anything is touched, rather than be killed minutes in and leave a
# quiet half-deploy. MEMINFO is overridable for testing. docs/pi-hosting.md, "Swap".
MIN_SWAP_KB=$((5 * 1024 * 1024 + 512 * 1024))   # 5.5 GiB: 6 GB with rounding slack
SWAP_KB="$(awk '/^SwapTotal:/ {print $2}' "${MEMINFO:-/proc/meminfo}")"
if [[ "${SWAP_KB:-0}" -lt "$MIN_SWAP_KB" ]]; then
  echo "deploy-pi: this Pi has $(( ${SWAP_KB:-0} / 1024 )) MB of swap; the build needs about 6144 MB." >&2
  echo "  At 4 GB RAM + 2 GB swap the build was killed three times in a row; with about 4 GB of" >&2
  echo "  file-backed swap added it went through first try. Add it (scripts/pi/setup.sh does, or" >&2
  echo "  docs/pi-hosting.md, \"Swap\"), then run this again." >&2
  if [[ -n "$FORCE" ]]; then
    echo "deploy-pi: WARNING: forced past the swap check: $FORCE" >&2
  else
    exit 2
  fi
fi

node scripts/pi/write-env.mjs --env "$ENV_NAME"
"${NICE[@]}" npm ci --no-audit --no-fund   # devDependencies too: next build needs TypeScript and Tailwind
# Keep the last good build; put it back if this one does not get through.
rm -rf .next.prev
[[ -d .next ]] && cp -a .next .next.prev
restore_build() {
  echo "deploy-pi: BUILD FAILED — putting the previous .next back; $SERVICE keeps serving the old version." >&2
  echo "  (Check the served version with /api/version: a git-updated clone is not a deployed clone.)" >&2
  if [[ -d .next.prev ]]; then rm -rf .next && mv .next.prev .next; fi
}
if ! "${NICE[@]}" npm run build
then restore_build; exit 1; fi
# The build must carry this environment's Server Actions key, the one the Worker
# builds with, or forms rendered by one are rejected by the other. Stops before
# the restart, so the running service keeps serving what it has. Compare the
# fingerprint with the one `npm run deploy:*` prints on the dev machine.
node scripts/actions-key.mjs --env "$ENV_NAME" --built || { restore_build; exit 1; }

sudo systemctl restart "$SERVICE"
rm -rf .next.prev
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

# The served stylesheet must be the one just built. Fatal: a poisoned edge stays poisoned for a
# year (docs/release-procedure.md, "Purge the Cloudflare cache").
node scripts/pi/check-assets.mjs --url "https://$HOST/" --dir .next
