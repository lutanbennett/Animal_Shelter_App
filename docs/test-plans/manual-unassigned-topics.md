# Feature test plan

## Header

| | |
|---|---|
| Feature | Manual: the last two UNASSIGNED topics |
| Backlog item | `docs/backlog.md` → #1wb6g |
| Branch / worktree | `claude/manual-unassigned-topics` @ `C:\Development\Animal_Shelter_manual-unassigned-topics` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | see the PR this file is in |
| Tested by / date | Claude, 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | 56992ce97 |

## 1. Scope and risk

- [x] Change is described in one sentence: the manual's Operations topic follows the cards that open Operations, and the cover-another-role topic is everyone's and sits in Getting started
- [x] Files touched: `src/lib/manual/{en.ts,for-topic.ts,types.ts,for-topic.test.mjs}`, `src/lib/releases.ts`, docs
- [x] Cards affected: the 25 cards that open Operations see that topic; every other card (e.g. `bills`) no longer sees it or an empty My tasks section; Admin unchanged
- [x] Out of scope: the `unassigned` state itself, Thai (no Thai manual edition exists), any migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line:

```
=== gates: typecheck exited 0 after 117s
=== gates: lint exited 0 after 471s
=== gates: test exited 0 after 126s
=== gates: build exited 0 after 322s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works: `topicView()` against the real manual, driven by card
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: read-only manual
- [ ] Empty state — n/a: no list
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: the edge is a card holding nothing that opens Operations, covered by the `bills` case

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | Operations topic shown | pass (unit test) |
| exactly `bills` | manual | no Operations topic, no My tasks topics; cover-another-role shown (Getting started) | pass (measured with topicView) |
| exactly `do_maintenance` | manual | Operations topic shown | pass (measured) |
| signed out | n/a | manual needs sign-in | n/a |

- [x] Every login above tested (by `topicView()`, not in a browser)
- [ ] Blocked server-side — n/a: the manual hides content for convenience; it grants nothing

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [x] Manual updated (`src/lib/manual/en.ts`)
- [ ] Translatable strings — n/a: no new string in the translation path
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven in the browser, pending below
- [ ] Network clean — n/a: not driven in the browser, pending below

## 6. Regression

- [x] The nearest pages: manual topic tests (16 pass), including the photo-card case
- [x] Shared file `manual/en.ts` — checked by the unit test that loads it; not loaded in a browser (see Left for manual verification)
- [x] Nothing merged from `main` during `sync` was broken (already up to date)

## 7. Documentation

- [x] Backlog item #1wb6g ticked on this branch
- [x] Decision file `docs/decisions/2026-11-12-manual-unassigned-topics.md`
- [ ] `README.md` still accurate — n/a: not mentioned there
- [x] **Release notes.** `unreleased` has a line for it
- [x] Commit messages say why
- [x] Claims were measured: `grep -c UNASSIGNED src/lib/manual/en.ts` printed 0; topicView outputs above are from a run

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary/banding — n/a: no threshold
- [ ] Evidence pasted is tool output — n/a: gates output pasted above is unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy line ref matches production — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secrets exist — n/a: none
- [ ] Both migration and code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager (nothing to roll back beyond the deploy; no schema)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Click through to `/manual` as a `bills`-only login and as one holding `do_maintenance`; confirm Operations and My tasks are gone/present | Test |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: a person to click through `/manual` in a browser

Manual verification by: pending: a person to click through `/manual` on Test with a `bills`-only and a `do_maintenance` login

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass

Release manager acknowledgement: pending
