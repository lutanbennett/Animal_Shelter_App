# Test plan — pi-persistent-journal

## Header

| | |
|---|---|
| Feature | `scripts/pi/setup.sh` gains step **2c**, which makes the Pi's systemd journal persistent, so a rebuilt Pi does not come back with a volatile journal. Plus a correction to two documents, below |
| Backlog item | `docs/backlog.md` → `#pm4kz` (the journald half; its other half, a per-machine build lock in `deploy-pi.sh`, is **not** in this PR) |
| Branch / worktree | `claude/pi-persistent-journal` @ `C:\Development\Animal_Shelter_pi-persistent-journal`, port `3001` |
| Dev server | n/a: not started. The diff is one shell script that runs on a Raspberry Pi and two markdown files. Nothing renders |
| PR | #TBD |
| Tested by / date | Claude Opus 5 / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, cut from `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — Lutan asked for the journal setting to be folded into `setup.sh` so a rebuilt Pi keeps it, after the live Pi was configured by hand earlier today
- [x] Files/areas touched listed — three: `scripts/pi/setup.sh` (new step 2c, **33 added lines, nothing changed or removed**), `docs/release-procedure.md` and `docs/release-handover.md` (one corrected passage each, see below). No `src/`, no `worker/`, no migration
- [x] Cards affected identified — **none.** No card, activity, cell or page. This is box-level OS configuration on the Pi; nothing in the app reads it, and neither Admin nor the signed-out public is affected
- [x] Anything explicitly out of scope written down — **the other half of `#pm4kz` is not here.** A per-machine lock stopping a second concurrent Pi build is the remaining work on that item and is a different file (`deploy-pi.sh`) with its own failure modes. **Also out of scope: the live Pi**, which was already configured by hand this morning; this change is for a *rebuild*, and step 2c is written to be a no-op in effect when the drop-in is already correct
- [x] **The two document corrections are in scope and here is why.** While reading `setup.sh` to place the new step, step 2b turned out to record that **`next build` peaks above 6 GB on this 4 GB Pi** — which is why it adds a 4 GB swap file and why `deploy-pi.sh` refuses below ~6 GB. **That makes "or at most two" — which I wrote into both documents earlier today — wrong**, and it is a limit a release manager would act on. One build already needs swap to fit; two want ~12 GB against about 10 GB of RAM plus swap. Corrected to **one at a time** in both, each saying what it used to say and why it changed. Leaving a number I now know to be wrong in a runbook is the exact fault those passages were added to fix

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` minutes before the change, so there was nothing to merge in
- [x] `node scripts/gates.mjs` — all four gates exit 0, read as four numbers and with the script's own status read separately from the shell's:

```
=== gates: typecheck exited 0 after 64s
=== gates: lint exited 0 after 158s
=== gates: test exited 0 after 34s
=== gates: build exited 0 after 160s
gates: typecheck=0 lint=0 test=0 build=0
GATES EXIT=0
```
- [x] **`bash -n scripts/pi/setup.sh` — syntax ok.** The gates do not parse shell scripts, so this is the only check that would catch a typo in the diff, and it was run explicitly rather than assumed
- [x] **Line endings checked, because this file runs on Linux** — `git ls-files --eol` reads `i/lf w/lf attr/text eol=lf` before and after, and the block was written with `\n` only. A CRLF shell script fails on the Pi with `bad interpreter`, and this repo's worktrees are CRLF for most files, so it is a real hazard here
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] All items — n/a: no migration, no column, no policy, no data

## 4. Functional checks

- [x] **What step 2c does, read line by line rather than described** — it creates `/etc/systemd/journald.conf.d/`, writes `99-lanna-persistent-journal.conf` with `Storage=persistent` and `SystemMaxUse=500M`, ensures `/var/log/journal` exists as `2755 root:systemd-journal`, restarts `systemd-journald`, flushes the runtime journal, and then **asserts the result** rather than assuming it
- [x] **It is idempotent**, which matters because `setup.sh`'s own header promises the whole script is: `mkdir -p` and `tee` rewrite the same file byte-for-byte, `install -d` is a no-op on an existing correct directory, and a journald restart is harmless. Re-running changes nothing
- [x] **It does not fight the vendor file.** Raspberry Pi OS ships `/usr/lib/systemd/journald.conf.d/40-rpi-volatile-storage.conf` with `Storage=volatile`. The new file is in `/etc` and numbered `99-`, so it sorts after and wins; **the vendor file is deliberately left alone**, so an OS package update can replace it without silently undoing this
- [x] **The assertion is the right way round.** It checks `journalctl --header` reports a `File path:` under `/var/log/journal/`, which is the thing that actually matters, rather than checking that the config file exists — a config file can exist and be overridden. On failure it **warns and does not exit**, because by that point in `setup.sh` the app and tunnel steps still have to run and a non-persistent journal is not worth abandoning a box build for; the warning names the command that explains it
- [x] **It will not mislead whoever runs it.** The comment says in advance that `systemd-analyze cat-config` prints **both** `Storage=` lines, volatile first and persistent second, and that the later one wins — because seeing `Storage=volatile` in that output is exactly what would make someone think it had failed
- [ ] **Exercised on a real Pi rebuild** — pending: nobody has rebuilt a Pi. See *Left for manual verification*; this is the honest gap in this PR

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | nothing in this diff | unchanged | n/a: a Pi setup script and two markdown files; none is served, imported or rendered |

- [x] A login that should not have access is blocked server-side — n/a: this diff adds no action, route or policy

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. The script's output is for whoever is building a Pi
- [x] Timezone — n/a: nothing derives "today"
- [x] Money and rounding — n/a
- [x] **Secrets** — n/a, and worth stating for a Pi script: step 2c writes no credential, reads no env file, and the file it creates is world-readable `0644` by design, holding two settings and a comment

## 6. Regression

- [x] Nearest steps still work — step 2c sits between **2b (swap)** and **3 (the app)**, which is where the other box-level OS settings live, and it changes neither. `set -euo pipefail` is in force, so a genuine failure in the new `sudo` calls stops the script, as it would anywhere else in the file
- [x] **`setup-test.sh` and `setup-uat.sh` deliberately do NOT get this**, which was checked rather than assumed: `grep` shows neither touches `journald` or `swapfile`, because both are **machine-wide** settings done once by `setup.sh`. Duplicating it per clone would restart journald three times on one box for no gain, and swap is already handled the same way
- [x] Shared file touched — `scripts/pi/setup.sh` is run once per box, by hand, and is not imported by anything. The two markdown files are read by people

## 7. Documentation

- [x] Backlog item ticked — **`#pm4kz` was updated earlier today rather than ticked**, because only its journald half is done: its title now names the remaining work (the build lock), and the body records that the item's own premise was wrong — `/var/log/journal` already existed and the cause was the vendor drop-in. That edit is on the `backlog` branch, where backlog edits belong, and is **not** in this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **yes: `docs/decisions/2026-11-11-pi-persistent-journal.md`**, because three choices here would otherwise be re-derived: overriding rather than editing the vendor file, the `500M` cap against a 10%-of-filesystem default, and warning rather than failing on the assertion
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice. This is OS configuration on the Pi for a future rebuild; no screen, no behaviour and no data changes, and the live Pi was already configured by hand
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the cause from `systemd-analyze cat-config` and journald's own startup line rather than from the empty `/var/log/journal`; the 6 GB build peak read out of `setup.sh` step 2b rather than estimated; the `setup-test.sh` / `setup-uat.sh` exclusion from `grep`; the syntax from `bash -n`; the line endings from `git ls-files --eol`

## 8. Pre-production gate

**Host mapping:** `lannacareforanimals.org` is production, served by the Pi. **This diff does not reach any host until a Pi is rebuilt**, which is the whole point of it.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing here is deployed. `setup.sh` is not built, bundled or shipped; it is run by hand on a new box
- [x] Deployed SHA matches the tested SHA — n/a: no deploy. **And no deploy is needed for this change**, which is worth saying so nobody waits for one

### On the deployed build

- [ ] All items — n/a: there is no deployed surface. The live Pi's journal was made persistent by hand this morning and **verified independently of the script** (`journalctl --header` reading `/var/log/journal/…`, journald reporting `System Journal … max 500M`), recorded in `#pm4kz` and the `0.44.2` release record

### Deploy safety

- [x] Any new secret/env var exists in the production Cloudflare environment — none introduced
- [x] **A `scripts/pi/` change DOES ship in this PR, so the one-deploy-late caveat is worth naming** — but it does not bite: `deploy-pi.sh` is untouched, and `setup.sh` is never run by a deploy. Nothing about the next release's Pi builds changes

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither

### Rollback

- [x] Rollback position stated — `git revert`. Nothing is deployed, so a revert affects only a future Pi build. **On the live Pi the drop-in would stay** until someone removed `/etc/systemd/journald.conf.d/99-lanna-persistent-journal.conf` by hand, which is correct: reverting a setup script should not silently reconfigure a running box

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **I wrote "or at most two" Pi builds into two documents earlier today, and `setup.sh` step 2b already said `next build` peaks above 6 GB on a 4 GB Pi** — which makes two builds impossible too, not just three | **Fixed in this PR**, in both documents, each noting what it used to say. The OOM kill was predictable from a comment already in the repo |
| 2 | low | **`#pm4kz` described the cause as a missing `/var/log/journal` plus a setting.** The directory had existed since 15 September; the cause was the vendor drop-in | **Corrected on the `backlog` branch** earlier today, in place, rather than quietly fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Step 2c has never run as part of a real `setup.sh`.** It was proved as a standalone script on the live Pi this morning — same commands, same drop-in, verified — but the *integration* into `setup.sh` is unexercised, and nobody is rebuilding a Pi to test it | `scripts/pi/setup.sh` on the next Pi build |
| 2 | **That the live Pi's journal survives a reboot.** Configured and verified in place, but survival is only proven by a reboot, and rebooting production to prove it was deliberately not done | `journalctl --list-boots` after the next reboot — more than one entry means it held |

Both are *a person has to go and look*, separately from merging. **Neither blocks anything**: the live
Pi is already configured, and item 1 only matters on a rebuild.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty (two items), so only the person who looked may tick it

Manual verification by: pending: step 2c on the next real Pi rebuild, and `journalctl --list-boots` after the Pi's next reboot. Neither is worth forcing: the live Pi is configured and verified in place

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
