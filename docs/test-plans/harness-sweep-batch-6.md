# Feature test plan: harness-sweep-batch-6

## Header

| | |
|---|---|
| Feature | Harness sweep batch 6: fresh red count and verdicts |
| Backlog item | `docs/backlog.md` → BATCHES 2, 3, 4 AND 5 OF THE HARNESS SWEEP ARE DONE (left open) |
| Branch / worktree | `claude/harness-sweep-batch-6` @ `C:\Development\Animal_Shelter_harness-sweep-batch-6` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | a958251a |

## 1. Scope and risk

- [x] Change is described in one sentence: re-count every `scripts/check-*.mjs` against dev, fix one stale harness, write verdicts down
- [x] Files touched: `scripts/check-policy-role-names.mjs`, `docs/decisions/2026-10-27-harness-sweep-batch-6.md`, this plan
- [x] Roles affected identified: none, test harnesses only
- [x] Out of scope: the two deliberate reds, CI wiring, migrations, `src/`, and every harness not named in the verdicts

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `check-policy-role-names` was RED (4) and now prints GREEN
- [ ] Data persists — n/a: no UI surface, nothing stored
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing changed | n/a | n/a |

- [ ] Every role tested — n/a: no role-facing change
- [ ] Blocked server-side — n/a: no role-facing change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages — n/a: no app code changed
- [ ] Shared files — n/a: no shared file touched
- [ ] Nothing from main broken — n/a: sync was already up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: the parent item stays open for later batches; a verdict note goes on the backlog branch
- [x] Decisions file added: `docs/decisions/2026-10-27-harness-sweep-batch-6.md`
- [ ] README accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: test harnesses only; nothing a user sees changed
- [x] Commit messages say why
- [ ] Claims measured — n/a: the counts were read from exit codes of real runs

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding — n/a: no thresholds changed
- [ ] Evidence unedited — n/a: no pasted tool evidence beyond the gates lines
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret exists — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: scripts only; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | 75 other harnesses red or timed out on dev; listed in the decision file | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

- [x] The manual list above is empty; nothing for a person to look at

Manual verification by: n/a: test harnesses only, no surface to look at

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: link to the file is in the PR body
- [ ] Handed to the release manager — n/a: nothing user-visible ships

Result: pass with accepted defects

Release manager acknowledgement: n/a: not a release
