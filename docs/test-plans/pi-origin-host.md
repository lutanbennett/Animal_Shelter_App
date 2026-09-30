# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Point the production Worker at the Pi (`ORIGIN_HOST`), and make `setup.sh` work on Debian 13 |
| Backlog item | `docs/backlog.md` → Set the Pi up: production origin and weekly backup, one box (first half; the item stays open) |
| Branch / worktree | `claude/pi-origin-host` @ `C:\Development\Animal_Shelter_pi-origin-host` |
| Dev server | not used: a Worker var and a shell script |
| PR | linked from the PR itself |
| Tested by / date | Claude with Lutan at the Pi, 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence: production `ORIGIN_HOST` becomes `pi.lannacare.org` so the Worker tries the Pi before rendering itself, and `scripts/pi/setup.sh` plus the runbook use Cloudflare's `any` apt suite because `trixie` does not exist there
- [x] Files touched: `wrangler.jsonc` (production block only; `test` and `uat` stay empty), `scripts/pi/setup.sh`, `docs/pi-hosting.md`, this plan
- [ ] Roles affected identified — n/a: no app code; every role's requests take the same route
- [x] Out of scope: the backup half of the item, the failover drill record, and the single-Pi corrections to the runbook. They go in `claude/pi-setup`, which cannot merge before this one is deployed because `deploy.mjs` only deploys a pushed, clean `main`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was created from `origin/main` minutes earlier; nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 123s

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

The Pi itself was built and driven with Lutan on 2026-09-30, and each step's output was read before the next.

- [x] Happy path works end to end, as far as it can before the deploy: `setup.sh` ran to the end on a fresh Debian 13 Pi (Node v22.23.3, cloudflared 2026.9.3, `app answers on :3000`, `cloudflared connected`), both services `active`, and the local app returned HTTP 200. The `x-lanna-served-by: pi` header cannot be checked until this PR is deployed
- [ ] Data persists — n/a: no data; the services are enabled at boot, but a reboot was not tested here
- [ ] Create / edit / delete all exercised — n/a: no data
- [x] Invalid input is rejected: `curl -sI https://pi.lannacare.org/` from the laptop returned `403 Forbidden` from the WAF rule, i.e. a request without the shared key is refused
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Boundary cases checked — n/a: a var and a script

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| management | n/a | no app surface | n/a |
| staff | n/a | no app surface | n/a |
| vet | n/a | no app surface | n/a |
| volunteer | n/a | no app surface | n/a |
| signed out | `pi.lannacare.org` | 403 without the key | 403 seen |

- [ ] Every role above tested — n/a: no app code changed
- [x] A caller that should not have access is blocked server-side: the WAF rule, above

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: the check is the post-deploy header test, in section 8
- [ ] Shared file checked from a second page — n/a: `wrangler.jsonc` production block only
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item stays open until the Pi is serving and backing up
- [ ] Non-obvious design choices in `docs/decisions/` — n/a: the single-Pi and trixie decisions go in `claude/pi-setup`'s decision file, which covers this whole item
- [x] `README.md` still accurate: it does not describe the apt suite or `ORIGIN_HOST`
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: the visible effect (faster site, no more 1102s) is claimed in the `claude/pi-setup` PR only once the failover drill has passed; this PR only switches the var
- [x] Commit messages say why, not just what
- [x] Claims were measured: the 404 on Cloudflare's `trixie` suite and 200 on `any` were read from `curl -sI` on the Pi

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — n/a: `ORIGIN_HOST` for `test` is deliberately left empty
- [ ] Smoke-tested on `test.lannacare.org` — n/a: test is unchanged
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions — n/a: no threshold
- [ ] Evidence pasted is unedited tool output — n/a: none pasted beyond the gates lines
- [ ] Public pages re-checked after a cache purge — deferred: release manager, `curl -sI https://lannacare.org/` must say `x-lanna-served-by: pi`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager, at `npm run deploy:prod -- --secrets`
- [ ] `strip-baked-env` seen — deferred: release manager, at deploy
- [x] Any new secret exists in the production Cloudflare environment: `ORIGIN_KEY` is in `.env.deploy.production` and is pushed by `--secrets` at deploy; the WAF rule carrying the same value is live

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: set `ORIGIN_HOST` back to `""` and `npm run deploy:prod` (or `npx wrangler rollback --env production`). The Pi can keep running and nothing reaches it. No migrations are involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `setup.sh` and the runbook asked Cloudflare's apt repo for the OS codename; Raspberry Pi Imager now ships Debian 13 (`trixie`), which the repo does not have (404). It would have failed at step 2 | fixed: both now use the `any` suite, which works on both releases |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: the checks are commands with output, read above.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude, with the Pi commands run by Lutan and their output read back  Date: 2026-09-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
