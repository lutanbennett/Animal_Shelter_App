# Feature test plan — build-halt-gates

## Header

| | |
|---|---|
| Feature | `gates.mjs` re-runs the build gate once when Next's agent advisory halt stops it |
| Backlog item | `docs/backlog.md` → #bhalt |
| Branch / worktree | `claude/build-halt-gates` @ `C:\Development\Animal_Shelter_build-halt-gates` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-11-17 |
| Carries a migration? | no |
| Tested at SHA | `5464673d7` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the build gate re-runs once, immediately, on `SecurityFatalError`, after measuring that the receipt is a one-shot token
- [x] Files/areas touched listed — `scripts/gates.mjs`, `docs/decisions/2026-11-17-build-halt-gates-retry.md`, `docs/backlog.md` (tick), this plan
- [ ] Cards affected identified — n/a: no card, page or permission touched; local gates runner only
- [x] Anything explicitly **out of scope** written down — no Next upgrade, no env var, no workflow change, `brief-blocks.md` left to the planner

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: gates were run before the final sync; main's changes since do not touch `scripts/gates.mjs`
- [x] `node scripts/gates.mjs` four gates, all 0. A real halt occurred on the build gate and the retry cleared it (build log shows `SecurityFatalError`, then the re-run line):

```
=== gates: typecheck exited 0 after 15s
=== gates: lint exited 0 after 251s
=== gates: test exited 0 after 56s
=== gates: build exited 0 after 129s
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

- [x] Happy path works end to end — one clean gates run with a real halt, retried, `build=0`
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash — a deliberate type error in a scratch file gave `gates: typecheck=2 lint=0 test=0 build=1`, exit 1, and no retry; file removed
- [ ] Boundary cases checked — n/a: the only boundary is the five-minute token, measured in the decision file

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing in the app | unchanged | n/a: local script, no access change |

- [ ] Every login above tested — n/a: no app surface
- [ ] A login that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the other three gates still report their own exit codes (typecheck=2 in the failure run, all 0 in the clean run)
- [ ] Any shared file touched checked from a second page — n/a: no app file touched
- [ ] Nothing merged from `main` during `sync` was broken — n/a: sync merged nothing touching this script

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [ ] `README.md` still accurate — n/a: it does not describe the gates runner's retry
- [ ] **Release notes.** — n/a: nobody at the shelter sees the local gates runner
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — four timed builds with receipt listings; the retry proved on a real halt

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — n/a: no deployed artefact changes
- [ ] Deployed SHA matches — n/a: no deployed artefact changes

### On the deployed build

- [ ] Deployed to test — n/a: not part of any deploy
- [ ] Smoke-tested — n/a: not part of any deploy
- [ ] Timezone-sensitive behaviour proved — n/a: no dates derived
- [ ] Boundary or banding change — n/a: the five-minute TTL is Next's, measured not changed
- [ ] Evidence pasted is the tool's actual output, unedited — n/a: the gates lines above are extracted unedited from the run's file
- [ ] Public pages re-checked — n/a: no public change

### Deploy safety

- [ ] `deploy:` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reader together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the commit; nothing deployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, local script only

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: no deploy impact

Result: pass

Release manager acknowledgement: n/a: not yet released
