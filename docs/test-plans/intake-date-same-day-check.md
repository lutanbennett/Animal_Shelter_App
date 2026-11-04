# Feature test plan — intake-date-same-day-check

## Header

| | |
|---|---|
| Feature | Read-only check `intake-date-extra-same-day-rows` for #pdg6b part (2) |
| Backlog item | `docs/backlog.md` → #pdg6b (retitled, deliberately not ticked) |
| Branch / worktree | `claude/intake-date-same-day-check` @ `C:\Development\Animal_Shelter_intake-date-same-day-check` |
| Dev server | not started: no UI surface |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | `434c3ab8` (code commit; `origin/main` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one named read-only check counting residents whose intake-date weight or diet rows exceed what the intake creates
- [x] Files/areas touched listed — `scripts/lib/readonly-checks.mjs`, `docs/decisions/2026-11-04-intake-date-same-day-check.md`, `docs/backlog.md` (retitle only), this plan
- [ ] Cards affected identified — n/a: no app behaviour changes, no card, admin or public surface touched; the check runs from a script with a management token
- [x] Anything explicitly **out of scope** written down — no `src/`, no migration, no SQL path added to `check-production.mjs`; the production run is the planner's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — "Already up to date."
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
=== gates: typecheck exited 0 after 64s
=== gates: lint exited 0 after 179s
=== gates: test exited 0 after 18s
=== gates: build exited 0 after 218s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the check only reads
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; the check is run on production by the planner, read-only

## 4. Functional checks

- [x] Happy path works end to end — ran `node scripts/check-production.mjs intake-date-extra-same-day-rows --env test` against dev: 108 residents, weight 0, diet 1 (R-0394), exit 0; `scripts/check-production.test.mjs` 5/5 pass (select-only guard over every entry)
- [ ] Data persists — n/a: read-only, writes nothing
- [ ] Create / edit / delete — n/a: read-only
- [x] Empty state renders sensibly — the render prints no code lines when none, by construction (conditional spreads)
- [ ] Invalid input is rejected — n/a: the check takes no input
- [ ] Boundary cases — n/a: dev data only; thresholds are "more than one row", read from record_intake (0248:128-134)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: no app surface; script only |

- [ ] Every login above tested — n/a: no app surface
- [ ] A login that should not have access is blocked server-side — n/a: no app surface; the script needs the management token

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — n/a in effect; the neighbouring checks in the same file were covered by `check-production.test.mjs` (5/5)
- [ ] Shared file touched checked from a second page — n/a: the only shared file is `readonly-checks.mjs`, covered by its test
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; the question is unanswered until the production run. Retitled instead. Searched `intake` + `weight`/`diet`: no other open item is affected
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-04-intake-date-same-day-check.md`
- [x] `README.md` still accurate — it does not list read-only checks
- [ ] **Release notes.** — n/a: a read-only script check, invisible to shelter users
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the matching rule is quoted from 0248 and 0307 by line; the dev figure is from the run above

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — n/a: no deployed surface
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold shipped to users
- [ ] **Evidence pasted is unedited** — n/a: the gates lines above are as printed
- [ ] Public pages re-checked — n/a: public site untouched
- [ ] deploy line read — n/a: no deploy of its own
- [ ] strip-baked-env seen — n/a: no deploy of its own
- [ ] New secret/env var — n/a: none
- [ ] Migration and reader together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: script only; revert the commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — the production run is the planner's, recorded in the PR body | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no UI or surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: PR body links the file
- [ ] Handed to the production release manager — n/a: no release content

Result: pass
