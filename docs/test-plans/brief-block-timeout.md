# Feature test plan

## Header

| | |
|---|---|
| Feature | Block G re-runs slow checks; `worktree.mjs streams` prints the hand-over list |
| Backlog item | `docs/backlog.md` → #m2vxe |
| Branch / worktree | `claude/brief-block-timeout` @ `C:\Development\Animal_Shelter_brief-block-timeout` |
| Dev server | n/a: no dev server needed |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | 81f6bfbe |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: block G re-runs a timed-out check without the limit before filing (rule chosen over a second named exception), plus a `streams` command that prints the hand-over list.
- [x] Files/areas touched listed: `.claude/skills/plan-day/brief-blocks.md`, `.claude/skills/plan-day/SKILL.md`, `scripts/worktree.mjs`, `docs/backlog.md`, one decision file.
- [x] Cards affected identified: none; no admin or public effect, no `src/` file.
- [x] Out of scope written down: any `check-*.mjs` timeout, `CLAUDE.md`, `src/**`, migrations.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch cut from current origin/main today; nothing to merge in
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`, output as printed:

```
=== gates: typecheck exited 0 after 118s
=== gates: lint exited 0 after 214s
=== gates: test exited 0 after 35s
=== gates: build exited 0 after 334s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/worktree.mjs streams` ran on the live worktrees and printed 10 rows with dials from the brief metadata line.
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete — n/a: read-only command
- [x] Empty state: a brief with no metadata line gets a row with blank dials and a note; the zero-worktree case prints `no claude/* worktrees` (not contrived in a real checkout; code path read only).
- [ ] Invalid input rejected — n/a: takes no input
- [ ] Boundary cases — n/a: covered by the missing-metadata rows above

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a: no app surface | n/a |
| signed out | n/a | n/a: no app surface | n/a |

- [ ] Every login above tested — n/a: no app surface
- [ ] Blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `node scripts/worktree.mjs` with no arguments still prints its usage header, `list` code untouched.
- [ ] Shared file touched checked from another page — n/a: no app page shares these files
- [x] Nothing merged from `main` was broken by this branch: branch cut from main today, gates cover the rest.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision added: `docs/decisions/2026-11-10-handover-list-as-a-command.md`
- [ ] `README.md` still accurate — n/a: README does not describe worktree subcommands
- [ ] **Release notes.** n/a: developer process and tooling; no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured: durations come from the item and PRs #1423/#1442; the command output was run.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates or clocks involved
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is actual output — n/a: see gates evidence when added
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reader in same PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: scripts and docs only; revert the commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-10

### Manual verification

- [x] The manual list above is empty. n/a: nothing for a person to look at beyond output already read

Manual verification by: n/a: I ran the command and read its output; no screen to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after PR opens
- [ ] Handed to the production release manager — pending: release manager pre-deploy pass

Result: pass
