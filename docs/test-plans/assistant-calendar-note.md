# Feature test plan — assistant-calendar-note

## Header

| | |
|---|---|
| Feature | One release note: clinic visits booked through the assistant now reach the calendar |
| Backlog item | `docs/backlog.md` → **BOOKING A CLINIC VISIT THROUGH THE ASSISTANT NEVER REACHED THE CALENDAR** (ticked) |
| Branch / worktree | `claude/assistant-calendar-note` @ `C:\Development\Animal_Shelter_assistant-calendar-note` |
| Dev server | not started — no application code changed |
| PR | see the PR |
| Tested by / date | Claude / 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | `f248f7f0` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one release-note line in `unreleased`, the history, a decision file and the tick
- [x] Files/areas touched listed — `src/lib/releases.ts` (one `unreleased` line), `docs/backlog.md` (tick), `docs/decisions/2026-11-02-assistant-calendar-note.md`, this plan
- [x] Roles affected identified — none; the note is shown to everyone on the next release
- [x] Anything explicitly **out of scope** written down — no application code, no migration, no marker column for how a visit was created

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `git merge origin/main`: already up to date
- [x] `node scripts/gates.mjs` ends with the line below, run on this branch:

```
=== gates: typecheck exited 0 after 77s
=== gates: lint exited 0 after 199s
=== gates: test exited 0 after 17s
=== gates: build exited 0 after 293s

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
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no behaviour changed; the fix itself shipped in #1203 (`0b81f9ac`) and `src/app/assistant/actions.ts` line 235 reads `.id` from the returned row, confirmed by reading it
- [ ] Data persists — n/a: no behaviour changed
- [ ] Create / edit / delete — n/a: no behaviour changed
- [ ] Empty state — n/a: no UI change
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no logic

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing new | unchanged | n/a — text in a data file only |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no feature change
- [ ] Translatable strings — n/a: the note is English release text; no Thai was written
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages still work — n/a: no page changed; the build gate compiles every reader of `releases.ts`
- [ ] Shared file checked from a second page — n/a: `releases.ts` is plain data; the test and build gates load it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices in `docs/decisions/2026-11-02-assistant-calendar-note.md`
- [x] `README.md` still accurate — it says nothing about this
- [x] **Release notes.** `unreleased` gained the line. Nothing is outstanding for it to be true: the fix is on `main` and goes out with the release that carries the note
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned.** The history comes from `git log -S` and `git show`; the lost-versus-unsynced question is written as NOT ESTABLISHED, with why and what would settle it

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted is the tool's actual output** — n/a: the gates block above is unedited, nothing else pasted
- [ ] Public pages re-checked — n/a: the public site does not read release notes
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reading code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: text only; reverting the commit removes the line

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — a person may read the note's wording when the release is cut | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

### Manual verification

- [x] The manual list above is empty — nothing for a person to look at

Manual verification by: n/a: nothing to look at, one line of release text

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the release manager reads it at the next release

Result: pass
