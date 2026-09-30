# Feature test plan — pi-setup

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason. The Pi was built and driven in a guided session with
Lutan on 2026-09-30: he ran each command at the Pi, pasted the output, and it was
read before the next step.

---

## Header

| | |
|---|---|
| Feature | The Raspberry Pi serves the production site and takes the weekly backup (one box); `backup.mjs --local-copy`; runbook and README corrected |
| Backlog item | `docs/backlog.md` → Set the Pi up: production origin and weekly backup, one box |
| Branch / worktree | `claude/pi-setup` @ `C:\Development\Animal_Shelter_pi-setup` |
| Dev server | not used: scripts, docs and one release-notes line |
| PR | linked from the PR itself |
| Tested by / date | Claude with Lutan at the Pi, 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence: the Pi is the production origin and the weekly backup runs there, with `backup.mjs --local-copy` (upload to Drive and keep the newest `--keep` on the SSD, pruning visibly), and the runbook, README and decisions corrected to one Pi and Debian 13
- [x] Files touched: `scripts/backup.mjs`, `README.md`, `docs/pi-hosting.md`, `docs/decisions/2026-09-30-one-pi-hosting-and-backup.md`, `docs/backlog.md` (tick), `src/lib/releases.ts` (`unreleased`), this plan. The `ORIGIN_HOST` switch and the `setup.sh` fix shipped earlier as PR 237, and release 0.10.1 as PR 238
- [ ] Roles affected identified — n/a: no app code; a signed-in role's pages are served by the Pi instead of the Worker, which is the point of the change, checked in section 4
- [x] Out of scope, written down: encrypting the backup (audit finding DB-1, still open, and now also covers the Pi's SSD), a separate service user for the app, serving photos from the Pi (backlog spike), and pointing the test environment at the Pi

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (a clean `git merge` of `origin/main`, including PR 237 and PR 238)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 163s

gates: typecheck=0 lint=0 build=0
```

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

- [x] Happy path works end to end. **Hosting:** `curl -sI https://lannacare.org/login` returned `x-lanna-served-by: pi` on repeated requests after the deploy of release 0.10.1, and `https://pi.lannacare.org/` returned `403 Forbidden` without the key. **Backup:** `node scripts/backup.mjs --env production --local-copy ~/backups/lannacare` on the Pi printed `Environment: production (Supabase project dbkodyyxxhtygxcxmfcu)`, wrote a 0.69 MB dump, uploaded to Drive, and ended `Local copies kept in /home/lutan/backups/lannacare: 1`
- [x] Data persists: the dump is a valid archive. `pg_restore --list` showed `Format: CUSTOM`, 1296 TOC entries and 74 `TABLE DATA` entries. A restore into a database was **not** run (never rehearsed; see manual list)
- [x] Create / edit / delete exercised for the local copies: a second run under cron's stripped environment (`env -i HOME=… PATH=/usr/bin:/bin`, the exact line from `crontab -l`) exited 0 and produced a second dump (`Local copies kept … 2`). **Pruning of local copies was not exercised**: with `--keep 12` and two dumps, nothing was over the limit, so the removal path has run zero times. Its guard (upload confirmed first) is by reading, not by observation
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected: the inside-the-repo guard on `--local-copy` was run against five paths (a folder in the repo and the repo itself refused; a sibling folder with a similar name, another directory and another drive allowed). Passing `--local` and `--local-copy` together is refused by reading; not run
- [ ] Boundary cases checked — n/a: covered above; `--keep 1` and a failed upload were not provoked

**Failover drill, run with Lutan on 2026-09-30, the line that matters most:**

| Test | While down | After restart |
|---|---|---|
| `sudo systemctl stop lanna-care` | `x-lanna-served-by: worker`, every request `200` (5 of 5 polled, first ~1 s) | `pi`, 4 of 4 |
| `sudo systemctl stop cloudflared` | `worker`, `200` (5 of 5, first ~2 s) | `pi`, 6 of 6 |

**Load test (Claude, from this machine).** 400 requests at concurrency 12, cache-busted `/login` and `/`: `lannacare.org` all `200`, all `pi`, 0 Cloudflare 1102 pages, p50 310 ms, p95 672 ms; `test.lannacare.org` (still Worker-rendered) all `200`, 0 × 1102, p50 41 ms. **This does not prove the 1102s are fixed**: only signed-out pages could be requested, and those are light. The Pi was slower on them (tunnel hop). The heavy signed-in pages are on the manual list.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface changed | n/a |
| management | n/a | no app surface changed | n/a |
| staff | n/a | no app surface changed | n/a |
| vet | n/a | no app surface changed | n/a |
| volunteer | n/a | no app surface changed | n/a |
| signed out | `pi.lannacare.org` | 403 without the key | 403 seen |

- [ ] Every role above tested — n/a: no app code changed; signed-in pages on the Pi are on the manual list
- [x] A caller that should not have access is blocked server-side: the WAF rule on `pi.lannacare.org` (403), and `next start` listens on `127.0.0.1` only

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: the one release note is English-only register data
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: the existing Drive upload and prune path ran unchanged (`Backups kept for production: 4`, then `5`), and the dump filename and prefix are as before, so Settings → System status still finds the newest dump
- [ ] Shared file checked from a second page — n/a: `releases.ts` gained one `unreleased` line and the build compiles every reader
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with what remains open stated in the entry. Follow-ups (the Sunday run and the laptop task, a separate service user, DB-1 now covering the Pi) went on the `backlog` branch
- [x] Non-obvious design choices added: `docs/decisions/2026-09-30-one-pi-hosting-and-backup.md`
- [x] `README.md` still accurate: "Backups" now describes `--local-copy`, the Pi's cron job and `postgresql-client-17` on trixie
- [x] **Release notes.** A shelter user would notice pages that used to fail with the 1102 page; `unreleased` in `src/lib/releases.ts` gained one line, worded "should stop" because the heavy pages are not yet confirmed
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the `trixie` 404 and `any` 200, `postgresql-client-17` 17.11, the boot order `0xf146`, the header results and the load figures are all tool output read during the session

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at the next `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at the next `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — n/a: this PR changes no Worker code; production was switched by PR 237
- [ ] Smoke-tested on `test.lannacare.org` — n/a: test is unchanged and still Worker-rendered
- [ ] Timezone-sensitive behaviour — n/a: the cron schedule uses the Pi's `Asia/Bangkok` clock, confirmed from the dump's own `+07` timestamp; no app date logic
- [ ] Boundary assertions — n/a: the one threshold (`--keep`) is listed in section 4 as not provoked
- [ ] Evidence pasted is unedited tool output — n/a: the drill and load figures above are summarised from output read in the session; the gates lines are as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager, after the next deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: this PR ships a release-notes line only; the production deploy that carried `ORIGIN_HOST` was 0.10.1 and its output was read then (Worker showed `ORIGIN_HOST ("pi.lannacare.org")`)
- [ ] `strip-baked-env` seen — deferred: release manager, at the next deploy
- [ ] New secret/env var in production — n/a: `ORIGIN_KEY` was pushed by `--secrets` in the 0.10.1 deploy; none added here

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: set `ORIGIN_HOST` back to `""` and redeploy, or `npx wrangler rollback --env production`; the Pi can keep running and nothing reaches it. The backup change is reverted by reverting `backup.mjs`; the cron line is removed with `crontab -e`. No migrations

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `setup.sh` and the runbook asked Cloudflare's apt repo for the OS codename; Debian 13 (`trixie`) is not in it (404) | fixed in PR 237 (`any` suite) |
| 2 | high | The backup is not encrypted, in Drive or on the Pi's SSD, and includes the `auth` schema (audit finding DB-1) | deferred to backlog: DB-1, now noted as covering the Pi |
| 3 | medium | The app service and the backup run as the same user, so a compromised app could read the dumps and env files | deferred to backlog: own service user |
| 4 | low | The first `ORIGIN_KEY` was regenerated before use, because a failed command echoed its first and last characters into a screenshot | fixed: regenerated, the old value was never in the WAF rule or deployed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in to `lannacare.org` and open the heaviest pages (Residents, a resident's page, Cashflow), click around for a few minutes: none shows Cloudflare's "Error 1102", and the browser's Network tab shows `x-lanna-served-by: pi` | Browser, as a signed-in user |
| 2 | The Pi's first scheduled backup: after Sunday 2026-10-04 03:00, `ls -l ~/backups/lannacare` and `tail ~/backups/backup.log` on the Pi show a new dump, and the newest dump appears in Drive `Backups/` (Settings → System status) | The Pi, and Drive |
| 3 | A restore of a dump into a scratch Supabase project has never been rehearsed | Backlog: restore rehearsal, with DB-1 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude, with the Pi commands run by Lutan and their output read back  Date: 2026-09-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see `pending:` below

Manual verification by: pending: Lutan to check heavy signed-in pages for 1102s and the Pi's Sunday 2026-10-04 backup

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
