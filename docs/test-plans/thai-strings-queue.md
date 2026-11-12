# Feature test plan — thai-strings-queue

## Header

| | |
|---|---|
| Feature | `docs/thai-read-routine.md`: when, who and how the Thai worklist is handed to a reader, plus the measured queue |
| Backlog item | `docs/backlog.md` → `#y1dqu` (retitled; open for the cadence to be confirmed and the first read) |
| Branch / worktree | `claude/thai-strings-queue` @ `C:DevelopmentAnimal_Shelter_thai-strings-queue` |
| Dev server | not started — a script over files, no UI surface |
| PR | pending: number is assigned when the PR opens |
| Tested by / date | Claude / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | `7301732b6` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a written routine (when, who, command, what the reader does) and a measured queue
- [x] Files/areas touched listed — `docs/thai-read-routine.md`, `docs/decisions/2026-11-12-thai-read-routine.md`, `docs/backlog.md` (one item retitled), this plan
- [x] Cards affected identified — none: no card, page or permission is touched; admin and the signed-out public see no change
- [x] Anything explicitly **out of scope** written down — correcting any Thai, the script, any app screen, `src/lib/releases.ts`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code 0. Output redirected to a file and read:

```
=== gates: typecheck exited 0 after 113s
=== gates: lint exited 0 after 318s
=== gates: test exited 0 after 110s
=== gates: build exited 0 after 400s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, the script touches no database
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the routine's command was run as written and wrote a 1125-string worklist to the Desktop
- [ ] Data persists — n/a: the script reads files and writes only a file the caller names
- [ ] Create / edit / delete all exercised — n/a: nothing is created, edited or deleted in the app
- [ ] Empty state renders sensibly — n/a: a document, no UI
- [ ] Invalid input is rejected — n/a: a document, no input
- [ ] Boundary cases checked — n/a: a document, no logic

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a: no UI, no route | nothing | not applicable | n/a |

- [ ] Every login above tested — n/a: no page or route to reach
- [ ] A login that should not have access is blocked server-side — n/a: no page or route; the script runs on a developer machine

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings go through the translation path — n/a: the script adds no app wording
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no app file changed
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched; `docs/backlog.md` changed in one line
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item `#y1dqu` retitled on this branch (deliberately not ticked: the first read of the queue is still outstanding)
- [x] Design choices added in `docs/decisions/2026-11-12-thai-read-routine.md`
- [ ] `README.md` still accurate — n/a: README does not list scripts at this level
- [ ] **Release notes.** — n/a: a process document; nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — every count is the script's own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the script handles dates only as git `--before` text and no app logic derives "today"
- [ ] Boundary or banding change assertions — n/a: no threshold or band
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager, for deploy output; the gates output above is unedited
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] Production Supabase ref line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: a script not used at runtime; reverting the commit removes it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | no defects found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan confirms the weekly cadence; a Thai reader reads the 1125-string worklist | `docs/thai-read-routine.md`; the Desktop worklist |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: cadence confirmation and the Thai reading

Manual verification by: pending: Lutan (cadence) and a Thai reader

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing to deploy; it merges with the next release

Result: pass

Release manager acknowledgement: pending: next release
