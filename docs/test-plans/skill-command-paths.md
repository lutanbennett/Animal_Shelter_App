# Feature test plan — skill-command-paths

## Header

| | |
|---|---|
| Feature | Skill files write paths as `C:/Development/...` so the Bash tool no longer eats the backslashes |
| Backlog item | `docs/backlog.md` → none: raised by Lutan on 2026-10-12 as "`/clean-streams` keeps coming up as blocked" (see `.brief.md`) |
| Branch / worktree | `claude/skill-command-paths` @ `C:\Development\Animal_Shelter_skill-command-paths` |
| Dev server | not used — no UI surface |
| PR | |
| Tested by / date | Claude, 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | `3c7632ca` plus the uncommitted skill edits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: 15 Windows backslash paths in two skill files (10 command lines, 5 prose references) become forward-slash `C:/` paths
- [x] Files/areas touched listed: `.claude/skills/clean-streams/SKILL.md`, `.claude/skills/plan-day/SKILL.md`, `docs/decisions/2026-10-12-skill-paths-use-forward-slashes.md`, this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Roles affected identified: none. Developer tooling for Claude sessions; no app role reaches it
- [x] Out of scope: `scripts/worktree.mjs` is unchanged. Windows paths in prose elsewhere in `docs/` (test-plan headers, release records) are read by humans and left alone

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: not yet run at this commit
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: not yet run at this commit
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `node C:/Development/Animal_Shelter_App/scripts/worktree.mjs done no-such-slug-xyz` reaches the script and prints `worktree: nothing called no-such-slug-xyz: no worktree, no branch, no folder`
- [x] Old form reproduces the bug: `node C:\Development\Animal_Shelter_App\scripts\worktree.mjs done no-such-slug-xyz` fails with `Cannot find module '...DevelopmentAnimal_Shelter_Appscriptsworktree.mjs'`, `MODULE_NOT_FOUND`
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: the grep for `C:\` under `.claude/` returns nothing after the edit

### Role access matrix

Not applicable to tooling; no role reaches these files.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing | n/a | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no user-visible behaviour
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change: the diff is 16 lines in two skill files, each a path substitution; `git diff -U0` read line by line, nothing else changed
- [ ] Shared file touched — n/a: no shared file (`NavLinks.tsx`, `manual/en.ts`, libs) touched
- [ ] Nothing merged from `main` broken — n/a: not yet synced at this commit

## 7. Documentation

- [ ] Backlog item ticked — n/a: not a backlog item; the sweep of `docs/backlog.md` for `clean-streams`, `plan-day` and `worktree.mjs` found only items already ticked
- [x] Design choice recorded in `docs/decisions/2026-10-12-skill-paths-use-forward-slashes.md`
- [ ] `README.md` still accurate — n/a: README names no skill paths
- [ ] **Release notes.** n/a: a change to Claude's own skill files; no shelter user sees it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The failure and the fix were both run (section 4)

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: no app code changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app code changed
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output — n/a: no pasted evidence
- [ ] Public pages re-checked — n/a: no app code changed
- [ ] `deploy:` line read — n/a: no deploy involved
- [ ] `strip-baked-env` seen — n/a: no deploy involved
- [ ] New secret/env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: no deployed artifact; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | None | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run a full `/clean-streams` round and confirm step 4's `done` runs without `MODULE_NOT_FOUND`. It ends in real deletions, so it is Lutan's to drive | a session on `C:\Development\Animal_Shelter_App` after this PR merges |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: row 1 is outstanding, pending Lutan (see signature)

Manual verification by: pending: Lutan to drive one full `/clean-streams` round

### Result

- [x] Open defects are either fixed or explicitly accepted above (none found)
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged

Result: pass
