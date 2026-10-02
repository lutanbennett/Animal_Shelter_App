# Test plan: test-pi-origin

## Header

| | |
|---|---|
| Feature | Serve test.lannacare.org from the Pi (repo half) |
| Backlog item | `docs/backlog.md` → "Serve `test.lannacare.org` from the Pi too". **Left open**: test is not yet served by the Pi |
| Branch / worktree | `claude/test-pi-origin` @ `C:\Development\Animal_Shelter_test-pi-origin` |
| Dev server | `http://localhost:3002` (not used: no app surface) |
| PR | this PR |
| Tested by / date | Claude, 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | edbe4d5 |

## 1. Scope and risk

- [x] One sentence: test gets its own Pi clone, service unit and `ORIGIN_HOST`, and `deploy-pi.sh` refuses to build for one environment in the other's clone
- [x] Touched: `scripts/pi/deploy-pi.sh`, `write-env.mjs`, `cloudflared-config.yml`, new `lanna-care-test.service` and `setup-test.sh`, `wrangler.jsonc` (test `ORIGIN_HOST`), docs, README
- [x] Roles affected: none directly; every signed-in test user stops hitting 1102 once Lutan's steps are done
- [x] Out of scope: the DNS route, WAF rule, `ORIGIN_KEY`, installing the unit and the test deploy (Lutan's, listed below); uat on the Pi; the SSH deploy hand-off; Home Assistant tiles

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` closing line below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data

- [ ] Migration number one above `main`'s highest — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised in a harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `deploy-pi.sh --env test` from a `*_test` folder passes the clone check and proceeds to git (run in scratch folders; no real Pi)
- [ ] Data persists — n/a: no UI surface, no data
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [x] Invalid input rejected readably: `--env test` from the production-named folder, `--env production` and `--env uat` from a `*_test` folder, and a test clone holding `.env.deploy.production`, each exit 2 naming the folder and the right command
- [ ] Boundary cases — n/a: no UI surface; the folder-name rule is the only boundary and both sides were run

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a: no UI surface | n/a |
| management | n/a | n/a: no UI surface | n/a |
| staff | n/a | n/a: no UI surface | n/a |
| vet | n/a | n/a: no UI surface | n/a |
| volunteer | n/a | n/a: no UI surface | n/a |
| signed out | n/a | n/a: no UI surface | n/a |

- [ ] Every role tested — n/a: no UI surface
- [ ] Server-side block — n/a: no UI surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console — n/a: no UI surface
- [ ] Network — n/a: no UI surface

## 6. Regression

- [x] Nearest: production path of `deploy-pi.sh` (syntax-checked with `bash -n`; a production-named folder with `--env production` passes the clone check); `write-env.mjs` production still uses `~/photo-cache`
- [ ] Shared file touched checked from another page — n/a: no shared UI file touched; the `wrangler.jsonc` change is one test var and the full build passed
- [x] Nothing from `main` broken by `sync`: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: test is not yet served by the Pi, so the item stays open (a note on the `backlog` branch lists the remaining steps)
- [x] Decision added: `docs/decisions/2026-10-02-pi-test-own-clone.md`
- [x] `README.md` still accurate: Test column updated; `docs/pi-hosting.md` rewritten for the clone
- [ ] **Release notes.** n/a: test environment infrastructure; testers will notice test stops returning 1102 once the steps below are done, but shelter users are not on test
- [x] Commit messages say why
- [x] Claims were measured: the refusals were run, not reasoned. Capacity (memory with both servers and a build) is NOT claimed; it is in the manual table

## 8. Pre-production gate

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: Lutan (`npm run deploy:test -- --secrets`)
- [ ] Smoke-tested on test.lannacare.org — deferred: Lutan, after the Pi steps
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary/banding assertions — n/a: no threshold or banding change
- [ ] Evidence is tool output — n/a: only the gates line above, pasted unedited
- [ ] Public pages re-checked — n/a: no public page change
- [ ] `deploy: production → Supabase project` line — n/a: production is not deployed by this PR
- [ ] `strip-baked-env` line — n/a: production is not deployed by this PR
- [ ] New secret exists in production — n/a: only a test-environment secret (`ORIGIN_KEY`, same value as production's)
- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup fresh — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: revert this commit; no Pi change has been made, production's unit, folder and `wrangler.jsonc` block are untouched, and `ORIGIN_HOST` back to `""` returns test to Worker-only

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The backlog item and brief say `ORIGIN_KEY` goes in `.env.deploy.test`; test's values file is `.env.local` (`scripts/lib/env.mjs`, `envFile`) | fixed in docs: pi-hosting.md and the decision say `.env.local` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Clone `~/Animal_Shelter_App_test`, copy the dev `.env.local` in, run `./scripts/pi/setup-test.sh` | the Pi |
| 2 | `cloudflared tunnel route dns <tunnel> test-pi.lannacare.org`, refresh `/etc/cloudflared/config.yml` from the repo copy, restart cloudflared | the Pi |
| 3 | Extend production's existing WAF expression to both hostnames (free plan allows five rules; do not add a sixth) | Cloudflare dashboard |
| 4 | Put `ORIGIN_KEY` (same value as production's) in `.env.local` on the dev machine, then `npm run deploy:test -- --secrets` | dev machine |
| 5 | `curl -sI https://test.lannacare.org/login` shows `x-lanna-served-by: pi`; a signed-in page too; `curl -sI https://test-pi.lannacare.org/` from elsewhere is 403; a page that gave 1102 before now loads | anywhere |
| 6 | Failover drill: `sudo systemctl stop lanna-care-test` flips the header to `worker`; sign in and submit something while stopped | the Pi |
| 7 | Capacity: `free -m` with both servers running and a test build in progress; production unaffected; disk for the second `node_modules` and `.next` | the Pi |
| 8 | Do it in the same sitting as `pi-usb-ssd-spare` and `backup-encryption-rollout` (DB-1), which also need the Pi | the Pi |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the list is Lutan's and awaits him

Manual verification by: pending: Lutan's Pi, Cloudflare and dev-machine steps in the table above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — nothing ships until Lutan's steps are done

Result: pass
