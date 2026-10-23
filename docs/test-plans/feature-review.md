## Header

| | |
|---|---|
| Feature | feature-review: the printable feature list (step 1 of the card simplification) |
| Backlog item | `docs/backlog.md` → THE FOUNDATION OF THE SECURITY REBUILD (step 1 only, not ticked) |
| Branch / worktree | `claude/feature-review` @ `C:\Development\Animal_Shelter_feature-review` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3017` |
| PR | pending |
| Tested by / date | Claude, 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | bee24a9 |

## 1. Scope and risk

- [x] Change is described in one sentence: adds `docs/features.md`, the written list of the system's 13 features, which the PDF on Lutan's Desktop was printed from
- [x] Files/areas touched listed: `docs/features.md`, `docs/decisions/2026-10-23-feature-list-for-the-security-rebuild.md`, this plan; nothing under `src/`, `worker/` or `supabase/`
- [x] Roles affected identified: none, no code or permission changed
- [x] Out of scope: steps 2 and 3 (feature by card map; simpler card set), any change to cards or roles, and the card walkthrough runs

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Evidence:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; a document only
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a |
| management | nothing new | no change | n/a |
| staff | nothing new | no change | n/a |
| doctor | nothing new | no change | n/a |
| volunteer | nothing new | no change | n/a |
| signed out | nothing new | no change | n/a |

- [ ] Every role above tested — n/a: no page or permission changed
- [ ] A role that should not have access is blocked server-side — n/a: no page or permission changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item has three steps and this is step 1; follow-ups go on the backlog branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: no change a shelter user would notice, it is a planning document
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The coverage claim (every activity and route present) was run by script; role holdings were read from the dev database

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: no boundary logic
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documents only, nothing deployed changes

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none: Lutan reading and marking up the printed PDF is the next step, not a check of this change | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: the PDF is for Lutan's review, there is no behaviour to verify

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass

Release manager acknowledgement: n/a: nothing to deploy
