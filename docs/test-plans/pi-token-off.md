# Feature test plan — pi-token-off

## Header

| | |
|---|---|
| Feature | Repo half of taking the Supabase token off the Pi: a guard that refuses a Pi env file holding it, and no more copying `.env.local` to the production Pi |
| Backlog item | `docs/backlog.md` → **The Supabase personal access token is on the Pi by the setup instructions — take it off** (left open, status note added) |
| Branch / worktree | `claude/pi-token-off` @ `C:\Development\Animal_Shelter_pi-token-off` |
| Dev server | not started — no UI surface |
| PR | not yet opened |
| Tested by / date | Claude / 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | `1a089a27` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — steps (3) and (4): Pi scripts refuse the token in any env file of either clone, and the docs stop telling the reader to copy `.env.local`
- [x] Files/areas touched listed — `scripts/pi/check-no-forbidden.mjs` (new), `scripts/pi/write-env.mjs`, `setup.sh`, `setup-test.sh`, `scripts/lib/runtime-config.mjs`, `.env.example`, `docs/pi-hosting.md`, `docs/backlog.md`, one decision file, this plan
- [x] Roles affected identified — none; no app code or screen changed
- [x] Anything explicitly **out of scope** written down — steps (1), (2), (5) on the Pi are Lutan's; no Pi access, no production reads, no rotation, no migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (backlog lines only)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 41s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `check-no-forbidden.mjs` run against a scratch folder: a `.env.local` with the token line exits 2 naming the file and variable only; an empty `SUPABASE_ACCESS_TOKEN=` line exits 0; `check-runtime-config.mjs` passes with the new `SUPABASE_DB_URL` row
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no data
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: covered by the refusal run above
- [ ] Boundary cases checked — n/a: quoted and exported lines share one pattern; not separately exercised on a Pi

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a: no app code touched |
| management | nothing changed | unchanged | n/a: no app code touched |
| staff | nothing changed | unchanged | n/a: no app code touched |
| doctor | nothing changed | unchanged | n/a: no app code touched |
| volunteer | nothing changed | unchanged | n/a: no app code touched |
| signed out | nothing changed | unchanged | n/a: no app code touched |

- [ ] Every role above tested — n/a: no app code touched
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: Pi operations are in `docs/pi-hosting.md`, not the in-app manual
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the Pi scripts changed only by an added guard call; the build gate and `check-runtime-config.mjs` pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought backlog lines only; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; a note says steps 3 and 4 are closed and 0, 1, 2, 5 remain with Lutan
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-12-tools-means-scripts-not-dev-machine.md`
- [x] `README.md` still accurate — it does not describe the Pi env files
- [ ] **Release notes.** — n/a: no user-visible change; a shelter user would not notice any of this
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the backup reading `SUPABASE_DB_URL` was read in `scripts/backup.mjs`; the guard was run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: Pi scripts only, nothing deploys through the Worker
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app behaviour changed
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates output above is unedited
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no Worker deploy
- [ ] `strip-baked-env` seen — n/a: no Worker deploy
- [ ] Any new secret/env var exists in production — n/a: `SUPABASE_DB_URL` is optional and Pi-side only; Lutan adds it in handover step 1

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit and `git pull` on the Pi; nothing persistent changes. The guard refuses on the Pi until the token is deleted (or this PR is reverted), which is intended

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 0 | Test clone's token deleted — done 2026-10-12, grep count 0 | Pi, `~/Animal_Shelter_App_test` |
| 1 | `SUPABASE_DB_URL` set; backup run by hand, new dump written and uploaded — done 2026-10-12 | Pi, `~/Animal_Shelter_App` |
| 2 | Token deleted from every real env file; backup re-run without it, passed — done 2026-10-12 | Pi |
| 3 | Drive values moved into `.env.deploy.production`; `.env.local` parked at `~/parked`; backup re-run, passed — done 2026-10-12 | Pi |
| 4 | Token replaced on the dev machine; old `CL-Both` token deleted; `apply-migrations --status` passes on the new one — done 2026-10-12 | Supabase |
| 5 | `ORIGIN_KEY` copied into the Pi's `.env.deploy.production` (Pi is on 0.27.0, which does not check it yet; takes effect at the next Pi deploy) — done 2026-10-12 | Pi |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — Lutan did every Pi step himself, with each result read back in chat

Manual verification by: Lutan — confirmed in chat; line written by Claude at their request  Date: 2026-10-12

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: nothing deploys through the release; the Pi steps are Lutan's

Result: pass

Release manager acknowledgement: n/a: not yet released
