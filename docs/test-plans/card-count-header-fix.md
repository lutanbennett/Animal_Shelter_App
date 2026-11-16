# Feature test plan

## Header

| | |
|---|---|
| Feature | check-cards-count header no longer states a card count |
| Backlog item | `docs/backlog.md` → #hzhnh |
| Branch / worktree | `claude/card-count-header-fix` @ `C:\Development\Animal_Shelter_card-count-header-fix` |
| Dev server | n/a: no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | 8de6a6cf1 |

## 1. Scope and risk

- [x] Change is described in one sentence: line 1 of scripts/check-cards-count.mjs now states no number, so the assertion (61) is the only place the figure lives
- [x] Files touched: scripts/check-cards-count.mjs (one comment line), docs/backlog.md (tick), this plan
- [ ] Cards affected — n/a: no card, grant, admin or public behaviour changes; a comment only
- [x] Out of scope: card catalogue, cards.ts history lines 380/384, tenancy (#s50n8)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (run before PR)
- [x] `node scripts/gates.mjs` output:

```
=== gates: typecheck exited 0 after 83s
=== gates: lint exited 0 after 245s
=== gates: test exited 0 after 66s
=== gates: build exited 0 after 249s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] apply-migrations --status — n/a: no migration
- [ ] apply-migrations --dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `node scripts/check-cards-count.mjs` still prints ok with sixty-one cards after the edit
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no feature
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: comment only

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | nothing changes | no access change | n/a |

- [ ] Every login tested — n/a: no access behaviour changed
- [ ] Server-side block — n/a: no access behaviour changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest thing checked: the check script itself, run after the edit (passes)
- [ ] Shared file touched — n/a: no shared file touched
- [x] Nothing merged from main during sync was broken (gates green)

## 7. Documentation

- [x] Backlog item #hzhnh ticked on this branch
- [ ] Decision file — n/a: the item and commit message say it all
- [ ] README — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: a comment inside a developer check script; no shelter user can see it.
- [x] Commit message says why
- [x] Claims were measured: line 35 read (asserts 61) and the script run

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding — n/a: none
- [ ] Evidence unedited — n/a: gates block above is the run's own output
- [ ] Public pages — n/a: not touched
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: a comment; reverting the commit is the rollback

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-16

### Manual verification

- [ ] manual list — n/a: nothing for a person to look at

Manual verification by: n/a: comment-only change, nothing to look at

### Result

- [x] Open defects fixed or accepted (none)
- [ ] Checklist pasted into the PR — n/a: plan is in the branch
- [ ] Handed to release manager — n/a: nothing for them beyond section 8

Result: pass
