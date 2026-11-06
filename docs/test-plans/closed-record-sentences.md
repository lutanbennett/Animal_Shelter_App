# Feature test plan

## Header

| | |
|---|---|
| Feature | Closed-record sentences: banner and death-page wording corrected to match what 0310/0320 permit |
| Backlog item | `docs/backlog.md` → **THE CLOSED-RECORD BANNER ON A DEAD RESIDENT'S PAGE STILL SAYS NOTHING CAN BE EDITED** (#k3q7w, ticked here) |
| Branch / worktree | `claude/closed-record-sentences` @ `C:\Development\Animal_Shelter_closed-record-sentences` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | 8c9876d8 |

## 1. Scope and risk

- [x] Change is described in one sentence: four sentences that overstated a closed record's lock (en and th) now say what 0310/0320 allow
- [x] Files touched: `src/lib/i18n/dictionaries/en.ts`, `th.ts`, `src/lib/releases.ts`, decision file, backlog tick
- [x] Cards affected: none (wording only); admin sees the same text; signed-out public does not see these pages
- [x] Out of scope: any control or permission; code comments in PhotoGallery/BloodTestList/ProcedureList (correct, left)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` — run on commit 8c9876d8; four exit codes below

```
=== gates: typecheck exited 0 after 153s
=== gates: lint exited 0 after 254s
=== gates: test exited 0 after 42s
=== gates: build exited 0 after 324s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: a deceased resident's page, reached by clicking through from the Deceased list, shows the new banner sentence (admin login on dev)
- [ ] Data persists — n/a: wording only, no data
- [ ] Create / edit / delete — n/a: wording only
- [ ] Empty state — n/a: wording only
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no input

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | deceased resident page | new banner text | seen |

- [ ] Every login above tested — n/a: wording is identical for every login that can open the page; only admin driven
- [ ] Blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: manual does not quote these sentences
- [x] Translatable strings go through the dictionaries; `check-thai-dictionary.mjs` passes
- [ ] Mobile viewport — n/a: text only, same element
- [ ] Browser console clean — n/a: not inspected beyond the page loading
- [ ] Network clean — n/a: no network change

## 6. Regression

- [x] Nearest pages: the Deceased list and the resident page loaded
- [ ] Shared file check — n/a: dictionaries only gained reworded strings, same keys
- [ ] Nothing merged from main broken — n/a: sync brought nothing conflicting; gates green

## 7. Documentation

- [x] Backlog item #k3q7w ticked on this branch
- [x] Decision file `docs/decisions/2026-11-06-closed-record-sentences.md`
- [ ] README — n/a: not affected
- [x] **Release notes.** `unreleased` has a line for the corrected notice
- [x] Commit messages say why
- [ ] Claims measured — n/a: no timezone, concurrency or float work

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary/banding assertions — n/a: no threshold
- [ ] Evidence unedited — n/a: gates output pasted as printed
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration with code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager (redeploy previous sha; no schema involved)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai sentences read naturally (written by Claude, unreviewed) | deceased resident page, Thai |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

- [ ] Manual list — pending: a Thai speaker reading the new Thai wording

Manual verification by: pending: Thai wording review

- [x] Open defects fixed or accepted
- [ ] Checklist pasted into the PR — pending: pasted when PR is opened
- [ ] Handed to release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: release manager
