# Feature test plan — worktree-env-narrowing

## Header

| | |
|---|---|
| Feature | `worktree.mjs new` copies an allow-list of env keys instead of whole files |
| Backlog item | `docs/backlog.md` → #52y56 (retitled, not ticked) |
| Branch / worktree | `claude/worktree-env-narrowing` @ `C:\Development\Animal_Shelter_worktree-env-narrowing` |
| Dev server | not needed here; the probe worktree's server was started and removed |
| PR | pending |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | `b78737ef` |

## 1. Scope and risk

- [x] Change is described in one sentence — new worktrees get 11 of 14 `.env.local` keys and fail loudly if a core key is missing
- [x] Files/areas touched listed — `scripts/worktree.mjs`, `docs/decisions/2026-11-11-worktree-env-narrowing.md`, `docs/backlog.md` (retitle), this plan
- [ ] Cards affected identified — n/a: a developer script; no card, Admin or public page is affected
- [x] Out of scope written down — rotation and moving the service-role key and database password, existing worktrees

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main already merged ("Already up to date")
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
=== gates: typecheck exited 0 after 205s
=== gates: lint exited 0 after 660s
=== gates: test exited 0 after 90s
=== gates: build exited 0 after 391s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration (status was run in the probe and answered against dev)
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a real probe worktree was created with the changed script: `copied .env.local: 11 of 14 keys (left in the main checkout: DEV_TEST_USER_EMAIL, DEV_TEST_USER_PASSWORD, REHEARSAL_SUPABASE_ACCESS_TOKEN)`, `copied .dev.vars: 5 of 5 keys`; there `check-planner-preflight` printed all four core keys ok and "Everything a planner needs is reachable", `apply-migrations --status` answered against dev, the dev server served /login 200, and `dev-signin --cards do_maintenance --port 3007` printed its snippet
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected with a readable message — the missing-core-key path calls `fail()` naming the key; by reading, not triggered (would need to damage the main checkout's env file)
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: no page changed |
| exactly `do_maintenance` | /login, sign-in snippet only | snippet produced | ok; signed-in page load not driven |
| signed out | /login | 200 | ok |

- [ ] Every login above tested — n/a: no access rule changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: developer script
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — worktree creation, `done` of the probe (also exercised)
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from main during sync was broken — nothing merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; #52y56 retitled to say the worktree copy is done and move-and-rotate remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — 2026-11-11-worktree-env-narrowing.md
- [x] `README.md` still accurate — it does not describe which keys are copied
- [ ] **Release notes.** n/a: a developer script, no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the key readers come from `git grep`, the copy result from a real probe worktree

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted is the tool's actual output — n/a: gates output above is unedited
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the script; existing worktrees are unaffected either way

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | `dev-signin` card key `view_resident` was refused in the probe though listed; `do_maintenance` worked | deferred to backlog, not investigated |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

### Manual verification

- [x] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist
- [ ] Handed to the production release manager — n/a: not a release

Result: pass

Release manager acknowledgement: pending: release cut
