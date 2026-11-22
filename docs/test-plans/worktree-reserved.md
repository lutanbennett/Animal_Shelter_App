# Feature test plan

## Header

| | |
|---|---|
| Feature | worktree-reserved: `worktree.mjs list` reads a folder with a brief and no session as `reserved`, not `free` |
| Backlog item | `docs/backlog.md` → `#wtres` |
| Branch / worktree | `claude/worktree-reserved` @ `C:\Development\Animal_Shelter_worktree-reserved` |
| Dev server | n/a: no UI surface |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | f0d680bd2 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `list` marks a folder with a `.brief.md` and no session `reserved`; the legend and clean-streams say it is not available
- [x] Files touched: `scripts/worktree.mjs`, `.claude/skills/clean-streams/SKILL.md`, `docs/decisions/2026-11-23-worktree-reserved-signal.md`, `docs/backlog.md`, `docs/backlog-names.json`
- [x] Cards affected: none, no access is decided here; admin and the public are unaffected
- [x] Out of scope: any lock, registry or timeout; `done` and `new` behaviour; other streams' folders

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main was already merged in ("Already up to date")
- [x] `node scripts/gates.mjs`, all four exit codes 0:

```
=== gates: typecheck exited 0 after 132s
=== gates: lint exited 0 after 301s
=== gates: test exited 0 after 64s
=== gates: build exited 0 after 322s
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

- [x] Happy path works end to end: `node scripts/worktree.mjs list` runs and prints the new legend
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete — n/a: read-only listing
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no fixture folder was built; the rule is one `existsSync` on `.brief.md` after the `held()` probe

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| signed out | n/a | no app surface | n/a |

- [ ] Every login above tested — n/a: a developer script, no logins
- [ ] A login that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest pages: the other `list` rows still print (HELD sessions, STALE row, `(here)`)
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken: nothing was merged

## 7. Documentation

- [x] Backlog item `#wtres` ticked on this branch
- [x] Design choices recorded in `docs/decisions/2026-11-23-worktree-reserved-signal.md`
- [x] `README.md` still accurate: it does not describe the `held` column
- [ ] **Release notes.** n/a: nobody at a shelter sees a worktree
- [x] Commit messages say why
- [x] Claims in commit messages were measured: the legend text and `list` output were read from a real run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: a developer script, not deployed
- [ ] Smoke-tested on test — n/a: a developer script, not deployed
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding change assertions — n/a: none
- [ ] Evidence pasted is unedited — n/a: no pasted evidence beyond the gates lines
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` ref line — n/a: not deployed
- [ ] `strip-baked-env` line — n/a: not deployed
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--dry-run` against production — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: revert the commit; nothing is deployed and no data changes

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: a developer script with no surface a person needs to look at

### Result

- [ ] Open defects fixed or accepted — n/a: none
- [ ] Checklist pasted into the PR — n/a: the plan file is committed in the PR
- [ ] Handed to the production release manager — n/a: not a release item

Result: pass
