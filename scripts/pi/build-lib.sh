# Helpers for deploy-pi.sh, sourced (not run) so scripts/pi/build-lib.test.mjs can exercise them.
# docs/decisions/2026-10-19-pi-build-cache-bound.md.

# Delete a clone's Turbopack build cache when it has grown past MAX_MB. Conservative on purpose:
# it only ever touches a directory literally named .../.next/cache, prints what it removes, and
# never globs. A 4.4 GB cache on a 4 GB Pi starved the build; 450 MB built in 52 s.
prune_build_cache() {
  local dir="$1" max_mb="$2" size_mb
  case "$dir" in */.next/cache|.next/cache) ;; *) echo "prune_build_cache: refusing '$dir'" >&2; return 2 ;; esac
  [[ -d "$dir" ]] || return 0
  size_mb="$(du -sm "$dir" | cut -f1)"
  if [[ "$size_mb" -gt "$max_mb" ]]; then
    echo "deploy-pi: build cache $dir is ${size_mb} MB (ceiling ${max_mb} MB) — removing it; the next build recompiles."
    rm -rf -- "$dir"
  else
    echo "deploy-pi: build cache $dir is ${size_mb} MB (ceiling ${max_mb} MB) — kept."
  fi
}

# Say loudly that a build failed, with the exit code and what it usually means. Stderr, boxed.
report_build_failure() {
  local rc="$1" why="the build exited with an error (read the output above)"
  [[ "$rc" -eq 137 ]] && why="the kernel KILLED the build (out of memory). Check du -sh .next .next/cache node_modules"
  {
    echo "################################################################"
    echo "# deploy-pi: DEPLOY FAILED — NOTHING NEW IS BEING SERVED"
    echo "# exit code $rc: $why"
    echo "# The Pi is still on the OLD version. Do not announce this release."
    echo "################################################################"
  } >&2
}

# Fatal check that what is served is the version just built. URL is the /api/version endpoint.
check_served_version() {
  local url="$1" expected="$2" got
  local i
  for i in 1 2 3 4 5; do   # the service needs a moment after the restart
    got="$(curl -fsS --max-time 10 "$url" 2>/dev/null | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')"
    [[ "$got" == "$expected" ]] && break
    sleep 2
  done
  if [[ "$got" != "$expected" ]]; then
    report_build_failure 1
    echo "deploy-pi: $url serves '${got:-nothing}', expected '$expected'." >&2
    return 1
  fi
  echo "deploy-pi: serving $got as expected."
}
