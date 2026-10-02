# Feature test plan — pi-usb-ssd-spare

Filled from `docs/test-plan-template.md`. Guided session with Lutan at the Pi on
2026-10-02: he ran each command and pasted the output, which was read before the next
step. **The first USB drive turned out to be a counterfeit and was rejected, so the
clone script has never run against a good drive and no boot test has happened.**

---

## Header

| | |
|---|---|
| Feature | A bootable USB clone of the Pi's NVMe: `scripts/pi/spare-clone.sh`, a weekly systemd timer, a "Spare boot drive" runbook with recovery steps, and a clone-age status file for the monitoring tile |
| Backlog item | `docs/backlog.md` → A USB SSD on the Pi as a bootable spare and a second backup copy |
| Branch / worktree | `claude/pi-usb-ssd-spare` @ `C:\Development\Animal_Shelter_pi-usb-ssd-spare` |
| Dev server | not used: a shell script, two systemd units and docs |
| PR | linked from the PR itself |
| Tested by / date | Claude with Lutan at the Pi, 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence: a script and weekly timer keep a bootable clone of the NVMe on a USB SSD, with written recovery steps and a status file for a clone-age tile
- [x] Files touched: `scripts/pi/spare-clone.sh`, `scripts/pi/spare-clone.service`, `scripts/pi/spare-clone.timer`, `.gitattributes`, `docs/pi-hosting.md`, `docs/decisions/2026-10-02-spare-boot-drive-not-encrypted.md`, this plan
- [ ] Roles affected identified — n/a: no app code; Pi infrastructure only
- [x] Out of scope, written down: the Home Assistant clone-age tile (its own backlog item reads `status.json`), the deceased-residents archive mirror (separate item; this leaves unpartitioned space for it), a replacement drive

## 2. Automated gates

- [x] `bash -n scripts/pi/spare-clone.sh` is clean. `shellcheck` was not run
- [ ] `node scripts/worktree.mjs sync` and `node scripts/gates.mjs` — n/a: not yet run at this commit; run before the PR is opened
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not run. `spare-clone.sh init` and `sync` have never executed on a working drive; the only drive tried was rejected. The hardware checks that were run are listed below
- [ ] Data persists — n/a: nothing was cloned; see the manual list
- [ ] Create / edit / delete exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: the refusals (booted disk, non-USB disk, slow drive, unconfirmed device name) are by reading only; none was provoked
- [ ] Boundary cases checked — n/a: not provoked; see the manual list

**What was measured at the Pi on 2026-10-02** (output read, not reasoned):

| Check | Result |
|---|---|
| `vcgencmd get_throttled` | `0x0`, no under-voltage with the USB drive attached |
| `rpi-eeprom-config` `BOOT_ORDER` | `0xf146`, as recorded |
| USB link of the first drive | `lsusb -t` showed `480M` (USB 2), `idVendor=048d idProduct=1234`, product `VendorCo ProductCode`, 2 TB |
| `rpi-clone sda` initialise | partitioned, then `mkfs.ext4` of 1.9 TB ran over half an hour; write rate 212 KB/s |
| Raw `dd` write to the drive | 40.4 kB/s, then 49.8 kB/s (the first run overlapped a still-running `mkfs`, the second did not) |
| Verdict | drive rejected as unusable; the slow-drive refusal in `init` was added because of it |

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| management | n/a | no app surface | n/a |
| staff | n/a | no app surface | n/a |
| vet | n/a | no app surface | n/a |
| volunteer | n/a | no app surface | n/a |
| signed out | n/a | no app surface | n/a |

- [ ] Every role above tested — n/a: no app code
- [ ] A caller that should not have access is blocked server-side — n/a: no endpoint; the clone script refuses the booted disk and non-USB disks (by reading)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: the Pi kept serving from the NVMe throughout; the NVMe was never a destination (the only disk written was `sda`, and `rpi-clone` printed `Booted disk: nvme0n1` and `Destination disk: sda` before the confirmation)
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync not yet run

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: deliberately left open; the item's acceptance is the boot test, which has not happened. A note saying the script, timer and docs are in goes on the `backlog` branch
- [x] Non-obvious design choices added: `docs/decisions/2026-10-02-spare-boot-drive-not-encrypted.md`
- [ ] `README.md` still accurate — n/a: README does not describe the Pi's drives; the runbook is in `docs/pi-hosting.md`
- [ ] **Release notes.** n/a: Pi infrastructure, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the throttle, boot order, USB speed, USB ID and write rates are tool output read during the session. The `rpi-clone` options come from its README, fetched on 2026-10-02; the exact prompts of `rpi-clone -u` against a pre-made layout were not observed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at the next `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at the next `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — n/a: no Worker or app code changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app code changed
- [ ] Timezone-sensitive behaviour — n/a: the timer's `OnCalendar` uses the Pi's `Asia/Bangkok` clock; no app date logic
- [ ] Boundary assertions — n/a: the thresholds (9 MB/s floor, 9-day staleness) were not provoked
- [ ] Evidence pasted is unedited tool output — n/a: the hardware figures above are read from screenshots of the terminal
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys; this is Pi scripts and docs
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `sudo systemctl disable --now spare-clone.timer`, then delete the two unit files and `/etc/default/lanna-spare`. Nothing else on the Pi depends on the spare, and the script never writes to the NVMe

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The first USB drive reported 2 TB but wrote at 40 to 50 kB/s on a USB 2 link, with a generic `048d:1234` controller: a counterfeit or failing drive | accepted: drive rejected; `init` now refuses a drive under about 9 MB/s |
| 2 | low | The first `rpi-clone` confirmation was typed `Yes`; it only accepts `yes` and aborted without touching the disk | accepted: no effect |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Boot test, the point of the item:** with a good drive, run `spare-clone.sh init`, then power off, remove the NVMe, power on: `findmnt /` says `/dev/sda2`, `lanna-care` and `cloudflared` are `active`, `curl -sI https://lannacare.org/` says `x-lanna-served-by: pi` (docs/pi-hosting.md, "Boot test") | The Pi |
| 2 | **The timer has run once:** after the first Sunday 04:00 run, `scripts/pi/spare-clone.sh status` shows a `lastSuccess` within a day and `journalctl -u spare-clone` is clean | The Pi |
| 3 | The recovery steps read cleanly to someone with no context, and the NVMe-restore step (`rpi-clone nvme0n1 -f` from the spare) works | The Pi |
| 4 | A replacement drive is bought (branded, 500 GB to 1 TB) and passes `f3probe` | Lutan |
| 5 | The unencrypted-clone decision is confirmed or changed | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude, with the Pi commands run by Lutan and their output read back  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see `pending:` below

Manual verification by: pending: Lutan, the boot test and the first scheduled clone, once a working drive is fitted

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
