# Feature test plan — english-strings-classification

## Header

| | |
|---|---|
| Feature | Settle the open half of `#c7zjk`: classify the `.tsx` English, trace the 11 "maybe", decide the 14 stray positions and admin screens, correct the classifier |
| Backlog item | `docs/backlog.md` → `#c7zjk` (annotated, left open) and `#hzmxi` (annotated) |
| Branch / worktree | `claude/english-strings-classification` @ `C:\Development\Animal_Shelter_english-strings-classification` |
| Dev server | not started — no UI surface; no string on a screen changed |
| PR | pending: number assigned when opened |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | `0afbda94` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the classifier now reflects who actually reads each English string, and the item's five open points are settled or re-measured in a decision file
- [x] Files/areas touched listed — `scripts/lib/english-in-ts-classes.mjs`, new `scripts/measure-english-in-tsx.mjs`, `docs/decisions/2026-11-06-english-strings-classification.md`, `docs/backlog.md`, this plan. No `src/`, no migration
- [x] Cards affected identified — none: no behaviour of any card changes. Admin and signed-out public unaffected
- [x] Anything explicitly **out of scope** written down — translating the 5 archive-helper strings and the 4 Drive-warning fallbacks, flipping `RULE_3_BLOCKS`, and the Thai read are in the decision file's list for the planner

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 130s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 385s
=== gates: test — npm test
=== gates: test exited 0 after 48s
=== gates: build — npm run build
=== gates: build exited 0 after 267s

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
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-thai-dictionary.mjs` runs clean on the new classifier: rule 3 reports 5 strings (was 2), all traced to a screen; `measure-english-in-ts.mjs` prints `UNCLASSIFIED 0`
- [ ] Data persists — n/a: no UI surface, nothing stored
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: the one boundary is the three-word minimum of the matcher, recorded as a limit in the decision file

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | unchanged | n/a — no page, route or permission changed |
| signed out | nothing new | unchanged | n/a — as above |

- [ ] Every login above tested — n/a: no access rule or page changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no string added or changed in `src/`; no Thai written, so no Thai is unreviewed by this PR
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the only consumer of the classifier is `check-thai-dictionary.mjs` rule 3 and `measure-english-in-ts.mjs`; both run and agree (5 `user` strings in each)
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged (already up to date); gates run on the tip

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — not ticked: it is annotated in place (`#c7zjk` title says what is still open; `#hzmxi` struck and superseded). Other items read: `#y1dqu`, `#3nuwy`, `#ifxk8` concern the Thai read and database refusals, which this does not close
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-06-english-strings-classification.md`
- [x] `README.md` still accurate — it does not mention the classifier
- [ ] **Release notes.** — n/a: nobody would notice; no `src/` file changed, only a build-time classifier, a measuring script and docs
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 20-in-7 `.tsx` count, the 204 `.ts` count and rule 3's 2 → 5 are command output; the caller traces were read in source (`deceased/actions.ts:113,175`, `MaintenanceBoard.tsx:321`, `confirm-actions.ts:56`)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on the test host — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates block above is the run's own output
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: build-time scripts and docs only; reverting the commit is the whole rollback and nothing at runtime depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | 5 archive-helper strings (`Resident not found.` ×2, `Failed to archive the resident.`, `This resident is still recorded as deceased.`, `Failed to restore the resident's Drive folder.`) reach a screen untranslated | deferred to backlog (planner to file; outside this stream's files) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty — nothing for a person to look at

Manual verification by: n/a: no UI surface and no string on a screen changed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the PR as a file
- [ ] Handed to the production release manager — n/a: nothing here reaches production

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet reviewed
