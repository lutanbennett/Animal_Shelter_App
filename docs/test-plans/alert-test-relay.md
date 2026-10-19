# Feature test plan — alert-test-relay

## Header

| | |
|---|---|
| Feature | Send a test alert from a Pi-drawn Status page, via a request row the Worker cron sends |
| Backlog item | `docs/backlog.md` → **Relay for the Status alert mail test from a Pi-drawn page** (ticked) |
| Branch / worktree | `claude/alert-test-relay-46263a` @ `C:\Development\Animal_Shelter_App-worktrees\alert-test-relay-46263a` |
| Dev server | not started — see section 4 |
| PR | see the PR |
| Tested by / date | Claude / 2026-10-19 |
| Carries a migration? | no — uses `0226` (merged in #744, applied to dev only) |
| Tested at SHA | tip of this branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the Pi button writes a request, the Worker cron sends it
- [x] Files/areas touched listed — `src/lib/status/alerts.ts`, `src/app/api/status/alerts/route.ts`, `src/app/admin/status/{actions.ts,AlertActions.tsx,page.tsx}`, both dictionaries, `src/lib/manual/en.ts`, `scripts/check-status-alert-test-requests.mjs`, backlog tick, decision file
- [x] Roles affected identified — admins (`system.status`) only, as before
- [x] Anything explicitly **out of scope** written down — no deploy, no production migration, no change to alert thresholds

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch cut from current `origin/main` the same day
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — deferred: Claude reads it from the PR once it runs

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: 0226 was applied by #744
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [x] Constraints exercised against real rows — `node scripts/check-status-alert-test-requests.mjs` on dev: forged result columns overwritten, second pending refused, a new request allowed once handled, signed-in users refused. Result `HARNESS-OK`, rolled back
- [ ] Down-migration — n/a: no migration in this PR
- [ ] Production apply plan — n/a: no migration in this PR; the PR text says production needs 0226 before the Worker deploy

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser; the Pi-drawn page and the Worker cron need a Pi and a Worker, so it is left for manual verification below
- [ ] Data persists — n/a: the row insert and uniqueness are covered by the dev harness in section 3
- [ ] Create / edit / delete all exercised — n/a: only create; covered by the harness
- [ ] Empty state renders sensibly — n/a: with no pending request no extra line is drawn; not driven in a browser
- [ ] Invalid input is rejected — n/a: no input field; a duplicate press is refused by the database and reported as already waiting
- [ ] Boundary cases checked — n/a: duplicate press covered by the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Send a test alert on a Pi-drawn page | writes one request | not run — manual |
| other roles | Status page | refused as before (`system.status` check unchanged) | not run |
| signed out | nothing | nothing | not run |

- [ ] Every role above tested — n/a: the permission check is the unchanged `system.status` guard; not driven
- [ ] A role that should not have access is blocked server-side — n/a: the guard is unchanged and runs before the new branch

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [x] Manual updated — Status alert topic in `src/lib/manual/en.ts`
- [x] Translatable strings go through the translation path — new keys in both dictionaries (`en.ts`, `th.ts`); typecheck enforces parity
- [ ] Mobile viewport (375px) — n/a: one extra text line on an existing tile
- [ ] Browser console clean — n/a: not driven in a browser
- [ ] Network clean — n/a: not driven in a browser

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles the Status page and the alerts route
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched beyond the dictionaries and the manual
- [ ] Nothing merged from `main` during `sync` was broken — n/a: no sync brought anything in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-19-status-alert-test-relay-feature.md`
- [x] `README.md` still accurate — it does not describe this button
- [ ] **Release notes.** — n/a: the button works only after the Worker deploy and production migration 0226, both Lutan's steps and still outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the database behaviour is from the dev harness; the Worker pickup is not yet exercised and is described as such

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted is unedited** — n/a: no deploy evidence yet
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: the migration is #744; this code reads it, so 0226 must be on production before the Worker deploy
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for destructive migration — n/a: additive table
- [ ] Apply plan stated — n/a: stated in the PR

### Rollback

- [x] Rollback position stated — revert the code; the table is harmless and unused without it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | none found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On the Pi-drawn Status page as an admin, press Send a test alert: the tile says the test is waiting and is never green; pressing again says it is already waiting | Pi page, after 0226 is on production |
| 2 | After the next 15-minute run, the test mail arrives, the tile turns green, and the waiting line disappears | same, after the Worker deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by:

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — deferred: release manager

Result: pass-with-gaps

Release manager acknowledgement: n/a: not yet released
