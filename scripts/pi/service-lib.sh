# Helpers for setup.sh and setup-test.sh, sourced (not run): move a service onto its own
# system user. docs/decisions/2026-10-22-pi-app-own-user.md says why and what it does and does not protect.
#
# Every step here is re-runnable and none of them stops the service. The only step that does
# is install_unit, and it puts the old unit back if the new one does not come up.

# ensure_service_user <user> — a login-less system account with no home and no password.
ensure_service_user() {
  local svc="$1"
  if ! id "$svc" >/dev/null 2>&1; then
    sudo useradd --system --user-group --no-create-home --shell /usr/sbin/nologin "$svc"
  fi
  # The deploy user joins the group so the deploy can still clear the build cache the
  # service wrote into. Takes effect at the next login, which is fine: deploys are a new ssh session.
  sudo usermod -aG "$svc" "$(id -un)"
}

# prepare_service_files <user> <repo> <photo-cache-dir> <allow-env-local: yes|no>
# Lets the service READ the build and its env file, and WRITE only its two caches. Everything
# else in the deploy user's home (the backups, .env.deploy.*, ssh keys) stays closed to it.
prepare_service_files() {
  local svc="$1" repo="$2" photos="$3" allow_local="$4" f
  # Reaching the clone means walking through the home folder. o+x lets a process pass
  # through without being able to list it; the folders inside decide who can open what.
  [[ "$(stat -c %A "$HOME" | cut -c10)" == *x* ]] || chmod o+x "$HOME"
  # next start reads .env.local if it is there. On production it must not be (it holds the
  # Supabase token); on the test clone it is the dev values and the service needs to read it.
  if [[ -f "$repo/.env.local" ]]; then
    if [[ "$allow_local" != yes ]]; then
      echo "setup: $repo/.env.local exists. Production must not have it (it holds the Supabase token)." >&2
      echo "       Move it off the Pi, then run this again." >&2
      return 1
    fi
  fi
  for f in .env.production.local .env.local; do
    [[ -f "$repo/$f" ]] || continue
    sudo chgrp "$svc" "$repo/$f"
    chmod 640 "$repo/$f"
  done
  # The photo cache is disposable, so a fresh empty folder is fine; an old one is handed over.
  sudo install -d -o "$svc" -g "$svc" -m 700 "$photos"
  sudo chown -R "$svc:$svc" "$photos"
  # The build cache is created and handed over by the unit itself at every start (ExecStartPre).
  # Nothing that holds a secret is readable by the service except its own env file:
  for f in .env.deploy.production .env.deploy.uat; do
    [[ -f "$repo/$f" ]] && chmod 600 "$repo/$f"
  done
  return 0
}

# install_unit <template> <unit-name> <user> <repo> <photo-cache-dir> <probe-url> <probe-host> <probe-key>
# Installs the unit, restarts the service and checks it answers. If anything fails the previous
# unit file is put back and restarted, so the site is not left stopped.
install_unit() {
  local tmpl="$1" name="$2" svc="$3" repo="$4" photos="$5" url="$6" host="$7" key="$8"
  local dest="/etc/systemd/system/$name.service" old; old="$(mktemp)"
  local had=no
  if [[ -f "$dest" ]]; then sudo cp "$dest" "$old"; had=yes; fi
  sed -e "s|__SVC_USER__|$svc|g" -e "s|__REPO__|$repo|g" -e "s|__PHOTO_CACHE__|$photos|g" "$tmpl" \
    | sudo tee "$dest" >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable "$name"
  if sudo systemctl restart "$name" && sleep 4 \
     && curl -fsS -o /dev/null -H "Host: $host" -H "x-origin-key: $key" "$url"; then
    rm -f "$old"; echo "$name runs as $svc and answers"; return 0
  fi
  echo "setup: $name did not come up as $svc. Putting the previous arrangement back." >&2
  sudo journalctl -u "$name" -n 15 --no-pager >&2 || true
  if [[ "$had" == yes ]]; then sudo cp "$old" "$dest"; else sudo rm -f "$dest"; fi
  rm -f "$old"
  sudo systemctl daemon-reload
  sudo systemctl restart "$name" || true
  return 1
}
