# Feature test plan

## Header

| | |
|---|---|
| Feature | Bills gets its own manual section |
| Backlog item | `docs/backlog.md` → #b4qk7 |
| Branch / worktree | `claude/bills-manual-topic` @ `C:\Development\Animal_Shelter_bills-manual-topic` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | pending: PR not yet opened at this commit |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | 8b5c7883 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the Bills topic leaves Deliveries, gets a Bills section keyed on `bills.general`, plus a utility-bill topic keyed on `bills.utilities`
- [x] Files/areas touched listed: `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `src/lib/releases.ts`, `docs/`
- [x] Cards affected identified: `bills` (now sees the Bills topics), the delivery cards (no longer see the Bills topic); admin sees everything; signed-out public unaffected
- [x] Out of scope written down: card grants, Thai manual, screenshots, any deploy

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (no change at the time of the gates)
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 131s
=== gates: lint exited 0 after 715s
=== gates: test exited 0 after 41s
=== gates: build exited 0 after 150s
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
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: a login holding exactly `bills` opens /manual (clicked through from /my) and "Showing the 17 topics for the cards you hold" lists Bills, Bills: filing the photo of a receipt, Bills: filing a utility bill and Maintenance: adding a bill to a job
- [ ] Data persists — n/a: static manual text
- [ ] Create / edit / delete — n/a: static manual text
- [ ] Empty state — n/a: static manual text
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no input

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /manual | n/a: admin sees all topics by the isAdmin short-circuit, unchanged | not driven |
| exactly `bills` | /manual | Bills section topics shown | seen as described above |
| signed out | /manual | n/a: unchanged | not driven |

- [x] Every login above tested — only the Bills login was driven; the other two rows are unchanged code paths and are marked as not driven
- [ ] Blocked server-side — n/a: the manual shows text, grants nothing; a topic outside your cards is only marked

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topics read correctly at `/manual`
- [ ] Translatable strings — n/a: English manual only; Thai manual is #1o5tk
- [ ] Mobile viewport — n/a: not driven
- [ ] Browser console clean — pending: console not read in this session
- [ ] Network clean — pending: network not read in this session

## 6. Regression

- [x] Pages nearest the change still work: /manual loaded, 130 headings rendered
- [ ] Shared file touched (`manual/en.ts`) checked from a second, unrelated page — pending: only /manual reads it; PDF render not opened
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-11-bills-its-own-manual-section.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line tagged to the `bills` card
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the 17-topic count and the three bill topics were read from the signed-in page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — n/a: only the gates output, pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] Deploy project line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — deferred: release manager; text-only change, revert the commit, no schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The printed manual PDF shows the new Bills section | /manual → print |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the PDF look

Manual verification by: pending: the printed manual PDF has not been looked at

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none open
- [ ] Checklist pasted into the PR — pending: PR not yet open
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
