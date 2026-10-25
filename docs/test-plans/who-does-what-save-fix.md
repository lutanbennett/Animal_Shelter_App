# Feature test plan — who-does-what-save-fix

## Header

| | |
|---|---|
| Feature | Giving, removing and moving a card on Who does what saves again (`set_role_cards` called with `p_bundle: null`), plus a test that catches an app/database rpc input mismatch |
| Backlog item | `docs/backlog.md` → **URGENT BUG, LIVE ON PRODUCTION SINCE `0.40.2`** (ticked) |
| Branch / worktree | `claude/eager-dijkstra-16f0cf` @ `C:\Development\Animal_Shelter_App-worktrees\eager-dijkstra-16f0cf` |
| Dev server | `next dev --port 3077` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `apply()` sends `p_bundle: null`, and a test compares every `supabase.rpc` call's inputs with the migrations
- [x] Files/areas touched listed — `src/app/admin/who-does-what/actions.ts`, `scripts/check-rpc-inputs.test.mjs`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-25-who-does-what-save-bundle-input.md`, this plan
- [x] Roles affected identified — admin only (the only role that can change cards)
- [x] Anything explicitly **out of scope** written down — dropping `p_bundle` from the function (belongs to the `role_extras` cleanup); the patch release and production deploy (Lutan's)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from current `main`; nothing merged in since
- [x] `node scripts/gates.mjs` ends with all four exit codes 0:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration; `0257` is already applied on production

## 4. Functional checks

- [x] Happy path works end to end — the call shape reaches the function: against dev, anonymously (nothing can be written), the old two-input call answers `PGRST202`, the new three-input call answers `42501 permission denied for function set_role_cards`, i.e. the function was found
- [ ] Data persists — reload the page and the change is still there — n/a: the save needs the 2-step (aal2) session; the dev-signin session is aal1 and Who does what says to verify with the authenticator app first. Left for Lutan, below
- [ ] Create / edit / delete all exercised — n/a: same reason (add, remove and move all go through the one call)
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected with a readable message — n/a: no change to validation
- [ ] Boundary cases checked — n/a: one added argument

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/who-does-what | page opens at aal1 with the 2-step prompt | as expected |
| management | n/a | no change | n/a |
| staff | n/a | retired | n/a |
| doctor | n/a | no change | n/a |
| volunteer | n/a | no change | n/a |
| signed out | n/a | no change | n/a |

- [ ] Every role above tested — n/a: no access rule changed; only admin reaches the page and its guard is untouched
- [ ] A role that should not have access is blocked server-side — n/a: guard unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no behaviour change, the manual already says cards can be changed
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: the save was not reachable at aal1, so there was nothing new to watch
- [ ] Network clean — n/a: the save was not reachable at aal1

## 6. Regression

- [x] The pages nearest the change still work — Who does what (`/admin/who-does-what`) loads and lists the roles and cards
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the new test and the existing suite pass

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has an admin-tagged line saying card changes on Who does what work again
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the PGRST202 / 42501 answers above were read from dev; the guard's failure on this call was seen before the fix

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan (add a card, remove it, move one, check Recent changes; needs the authenticator step)
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change assertions — n/a: not a boundary change
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: only the gates block above, pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: Lutan, at the production deploy
- [ ] `strip-baked-env` line seen — deferred: Lutan, at the production deploy
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager; the change is one argument, rollback is redeploying the previous build, no schema involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a | The new guard first flagged `issue_donation_receipt` wrongly (line comments inside the call) | fixed in the guard |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as Admin with the authenticator step done: add a card to a role, remove it, move one up and down; each saves and Recent changes shows each | `/admin/who-does-what` on dev or test.lannacare.org |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan's one click-through above

Manual verification by: pending: the card save click-through, which needs the authenticator step

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the PR as a file
- [ ] Handed to the production release manager — deferred: release manager

Result: pass

Release manager acknowledgement: pending
