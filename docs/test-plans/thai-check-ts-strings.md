# Test plan: thai-check-ts-strings

| | |
|---|---|
| Feature | Date/time validity messages through the dictionaries; rule for which English counts |
| Backlog item | `docs/backlog.md` → English the Thai-dictionary check CANNOT see (left open: the sweep remains) |
| Branch / worktree | `claude/thai-check-ts-strings` @ `C:\Development\Animal_Shelter_thai-check-ts-strings` |
| Dev server | port 3002 (not started) |
| PR | see PR |
| Tested by / date | Claude, 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | 0e41069b |

## 1. Scope and risk

- [x] Change is described in one sentence: three English date/time validity messages now come from `t.validation` in both languages
- [x] Files touched: DateInput.tsx, date-input.ts (+ test), en.ts/th.ts `t.validation` (4 keys), releases.ts, one decision file
- [ ] Roles affected — n/a: every role sees a date box the same way; no access change
- [x] Out of scope: the check extension, the manual, release notes, the ~258-string sweep

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends as below

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: not driven in a browser this session; see Left for manual verification
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state — n/a: no list
- [x] Invalid input rejected with a readable message: unit test on badDateReason covers impossible day, month 13, bad format; dictionary keys exist in both languages (typecheck)
- [x] Boundary cases: 31/04, 29/02/2027, month 13, free text (date-input.test.mjs)

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | any form with a date box | same message, in the login's language | n/a: not driven |

- [ ] Every role tested — n/a: no access logic touched
- [ ] Blocked server-side — n/a: no access logic touched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page added
- [ ] Manual updated — n/a: wording of a bubble only
- [x] Translatable strings go through the translation path: four new keys in en.ts and th.ts
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] Nearest pages: unit tests and build (every form importing DateInput compiles)
- [ ] Shared file loaded from a second page — n/a: not driven in a browser; see manual list
- [x] Nothing merged from main broke this branch (sync was a no-op, gates green)

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item stays open for the sweep; the planner files the follow-up
- [x] Decision file: docs/decisions/2026-11-02-date-messages-and-which-english-counts.md
- [x] README.md still accurate
- [x] **Release notes.** `unreleased` has a line about the date and time messages appearing in Thai
- [x] Commit messages say why
- [x] Claims were measured: the sample counts in the decision file come from a scan I ran, and say they are a sample of 36

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive — n/a: no time-of-day logic
- [ ] Boundary or banding — n/a: no threshold changed
- [ ] Evidence unedited — n/a: gates output pasted as printed
- [ ] Public pages — n/a: no public page touched
- [ ] Deploy line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Dry-run production — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: pure code change, redeploy previous ref reverts it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | First version lost regex backslashes (caught by the test gate, fixed before PR) | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Type 31/04/2026 and 13/10/2026 outside a min/max in a date box, in English and in Thai; bubble reads right | Any form with a date, e.g. a resident record |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

- [ ] The manual list above is empty, or every item was checked by a person — n/a: the list is not empty and nobody has looked yet; the signature below is pending

Manual verification by: pending: a person types a bad date and an out-of-range date in a date box in English and Thai

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not a release cut

Result: pass

Release manager acknowledgement: n/a: not yet released
