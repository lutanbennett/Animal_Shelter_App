# Test plan — pi-cloudflared-race

## Header

| | |
|---|---|
| Feature | `scripts/pi/setup.sh` installs a systemd drop-in so `cloudflared` waits (bounded) for DNS and retries after 1 s, removing the 6 s retry after a power cut. Plus the behaviour written into `docs/pi-hosting.md` |
| Backlog item | `docs/backlog.md` → `#f1wp1` (retitled, not ticked: the apply on the Pi is Lutan's) |
| Branch / worktree | `claude/pi-cloudflared-race` @ `C:\Development\Animal_Shelter_pi-cloudflared-race`, port `3002` |
| Dev server | n/a: not started. A shell script for a Raspberry Pi and markdown. Nothing renders |
| PR | #TBD |
| Tested by / date | Claude Sonnet 5.5 / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | e24566cb |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — a drop-in removes the unchosen 6-second post-power-cut retry
- [x] Files/areas touched listed — `scripts/pi/setup.sh` (14 added lines), `docs/pi-hosting.md`, `docs/backlog.md` (one retitle), a decision file and this plan. No `src/`, `worker/`, migration
- [x] Cards affected identified — none; box-level OS configuration, no card, activity or page
- [x] Anything explicitly out of scope written down — faster boot, the 1970 clock, `#dxjz2`, the build lock in `deploy-pi.sh`, and the live Pi itself (Lutan's)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: branch was cut from current `origin/main` at the start
- [x] `node scripts/gates.mjs` — `gates: typecheck=0 lint=0 test=0 build=0`
- [x] `bash -n scripts/pi/setup.sh` parses, and `git ls-files --eol` reads `i/lf w/lf` (a CRLF script would fail on the Pi)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] All items — n/a: no migration, no column, no policy, no data

## 4. Functional checks

- [x] The block was read against `systemd.service(5)`: a `[Service]` drop-in, `ExecStartPre=-` (failure ignored), `RestartSec=1s`, no `$` in the Exec line (systemd expands it). `systemd-analyze verify` was not run: not available on this machine
- [x] Bounded: 15 iterations × 1 s, then `exit 0`, so it cannot hang the boot (default start timeout is 90 s)
- [x] Idempotent: `mkdir -p` and `tee` rewrite the same file byte for byte
- [ ] Exercised on the Pi after an abrupt power loss — pending: Lutan applies it and cuts power; see Left for manual verification

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | nothing in this diff | unchanged | n/a: a Pi setup script and markdown; nothing is served or rendered |

- [x] A login that should not have access is blocked server-side — n/a: no action, route or policy added

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string
- [x] Timezone — n/a: nothing derives "today"
- [x] Money and rounding — n/a: no amounts
- [x] Secrets — n/a: no credential written or read

## 6. Regression

- [x] Nearest steps unchanged — the block sits in step 2a before `daemon-reload`; step 5 (`cloudflared service install`) is untouched and the drop-in does not edit its unit
- [x] `setup-test.sh` / `setup-uat.sh` deliberately do not get it: one `cloudflared` service serves all three clones
- [x] Shared file touched — `setup.sh` is run by hand once per box, imported by nothing

## 7. Documentation

- [x] Backlog item retitled honestly — `#f1wp1` now says awaiting Lutan's apply; `#dxjz2` read and deliberately not ticked
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-11-pi-cloudflared-race.md`
- [x] `README.md` still accurate — unchanged by this diff
- [ ] Release notes. n/a: nobody using the app would notice; it does not take effect until Lutan installs it on the Pi
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — timings are from the 2026-11-01 drill (one sample, not re-takeable), syntax from `bash -n`

## 8. Pre-production gate

**Host mapping:** `lannacareforanimals.org` is production, served by the Pi. This diff reaches no host until Lutan applies it.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing is deployed; `setup.sh` is run by hand
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy

### On the deployed build

- [ ] All items — deferred: Lutan — install the drop-in on the Pi (re-run `scripts/pi/setup.sh <tunnel-id>`)

### Deploy safety

- [x] Any new secret/env var exists in the production Cloudflare environment — none introduced
- [x] A `scripts/pi/` change ships here, but `deploy-pi.sh` is untouched and `setup.sh` is never run by a deploy

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither

### Rollback

- [x] Rollback position stated — `git revert`; on the Pi delete `/etc/systemd/system/cloudflared.service.d/10-wait-for-dns.conf` and `sudo systemctl daemon-reload`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | None found; the 6 s retry itself is a single unrepeated sample | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After an ABRUPT power loss (a clean reboot proves nothing): `journalctl -u cloudflared -b -o short-monotonic`. Expect 0 `network is unreachable` failures (was 1) and first `Registered tunnel connection` well under 20.5 s (clean reboot was 12.2 s) | the Pi |
| 2 | The drop-in is active: `systemctl cat cloudflared` lists `10-wait-for-dns.conf` | the Pi |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Sonnet 5.5  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: two items, only the person who looked may tick it

Manual verification by: pending: Lutan, after applying the drop-in and the next abrupt power loss

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
