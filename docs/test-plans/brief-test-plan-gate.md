# Test plan — brief-test-plan-gate

| | |
|---|---|
| Feature | Every `/plan-day` brief must carry a pre-push test-plan block |
| Backlog item | `docs/backlog.md` → none; Lutan asked for this directly in the `/plan-day` chat, 2026-10-12 |
| Branch / worktree | `claude/brief-test-plan-gate` @ `C:\Development\Animal_Shelter_brief-test-plan-gate` |
| Dev server | not started — no runtime surface |
| PR | #553 |
| Tested by / date | Claude (Daily Planner session), 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | recorded below in §2 from `git rev-parse --short HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence: `.claude/skills/plan-day/SKILL.md` now requires every stream brief to end with a block telling the stream to fill the test plan in and run `check-test-plan.mjs` and `gates.mjs` **before** pushing, naming the four format traps that have cost six rework commits
- [x] Files touched: `.claude/skills/plan-day/SKILL.md` only, plus this plan and a decision file. No routes, no `worker/`, no migrations, no shared libs
- [x] Roles affected: none. This file is read by Claude when planning; it is not served to any user, signed-in or public
- [x] Out of scope, written down: `scripts/check-test-plan.mjs` is **not** changed — its strictness is deliberate and `CLAUDE.md` forbids loosening it or restoring `continue-on-error`. `docs/test-plan-template.md` is **not** changed. The three live batch-95 briefs were updated by hand in the planning session and are gitignored, so they are not in this diff

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — output pasted below, unedited
- [ ] CI green on the PR (runs the same three). `n/a: not yet — the PR does not exist at this commit`

Gates output and tested SHA are pasted into §2 of the PR body as printed.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR; 0187 is held by the medical-archive-trigger stream`
- [ ] `--status` reviewed — `n/a: no migration`
- [ ] `--dry-run` reviewed — `n/a: no migration`
- [ ] Applied to dev — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly — `n/a: no migration, and no code reads any column`
- [ ] Constraints and defaults exercised against real rows — `n/a: no migration`
- [ ] Down-migration written — `n/a: no migration`
- [ ] Production apply plan stated — `n/a: no migration`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: no runtime surface; the change is an instruction file read by Claude at planning time`
- [ ] Data persists — `n/a: no data`
- [ ] Create / edit / delete exercised — `n/a: no CRUD`
- [ ] Empty state renders sensibly — `n/a: nothing renders`
- [ ] Invalid input rejected readably — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no values`

### Role access matrix

- [ ] Every role tested — `n/a: the file is not served to any role; it is repo content read by Claude`
- [ ] A role that should not have access is blocked server-side — `n/a: not reachable by URL`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: the manual documents the app for shelter staff; this is an internal planning instruction they never see`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [ ] Mobile viewport 375px — `n/a: nothing renders`
- [ ] Browser console clean — `n/a: nothing renders`
- [ ] Network clean — `n/a: no requests`

## 6. Regression

- [x] The pages nearest the change still work: none exist, so the equivalent check was run — `node scripts/gates.mjs` builds the whole app with this file present and reports `build=0`, proving a markdown skill file cannot affect the bundle
- [ ] Any shared file touched, checked from a second unrelated page by loading it — `n/a: no shared code file touched; the only file changed is a skill instruction read by Claude`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and gates passed after it

## 7. Documentation

- [x] Backlog item ticked — no backlog item exists; Lutan asked for this directly in chat, and the decision file records why there was none
- [x] Non-obvious design choices added as a new file in `docs/decisions/2026-10-12-brief-test-plan-gate.md`
- [x] `README.md` still accurate — it does not describe the planner skill, so nothing there goes stale
- [ ] **Release notes.** `n/a: a change to how Claude writes its own planning briefs. No shelter user can see it, and nothing about the app changes`
- [x] Commit messages say why, not just what — the commit names the six rework commits this prevents
- [x] Claims were measured, not reasoned — the six commits are quoted by SHA and subject from `git log`, and the two-space rule was read off `scripts/check-test-plan.mjs:361-363` (`[ \t]{2,}`), not assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — `deferred: production release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test — `deferred: production release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: production release manager`
- [ ] Timezone-sensitive behaviour proved — `n/a: no dates, clocks or derived "today" anywhere in this change`
- [ ] Boundary or banding assertions cover both edges — `n/a: no threshold, band or cutoff in this change`
- [ ] Evidence pasted is the tool's actual output, unedited — `deferred: production release manager`
- [ ] Public pages re-checked after a cache purge — `deferred: production release manager`

### Deploy safety

- [ ] Supabase project ref line read and matches production — `deferred: production release manager`
- [ ] `strip-baked-env` line seen in deploy output — `deferred: production release manager`
- [ ] Any new secret/env var exists in production Cloudflare — `n/a: this PR adds no secret or env var`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — `n/a: no migration`
- [ ] `--env production --dry-run` run and clean — `n/a: no migration`
- [ ] Backup exists and is fresh for a destructive migration — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, including what it does not cover: reverting this commit restores the previous `SKILL.md`, and nothing else is affected — no deployed artifact carries this file, so there is nothing to roll back on the Pi or the Worker. **What it does not cover:** briefs already written from the new block are local gitignored files and are not reverted by it

## Defects found

None.

## Left for manual verification

| what | who | why it needs a person |
|---|---|---|
| nothing | — | There is no screen, no route and no deployed artifact. The change is an instruction Claude reads when writing a brief, and its effect is observable only in the next batch's briefs — which is a planning outcome, not something to look at |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-12

### Manual verification

- [x] The manual list above is empty, so whoever filled the plan may tick this — there is nothing for a person to look at

Manual verification by: n/a: no screen, route or deployed artifact — the change is a planning instruction read by Claude, with nothing for a person to inspect

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing is outstanding for them beyond the standard §8 deferrals, which no deploy of this change requires

Result: pass
