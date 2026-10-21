# Feature test plan

## Header

| | |
|---|---|
| Feature | A CLAUDE.md rule against writing scratch output above the repo, after four stray logs were found in `C:\Development\` |
| Backlog item | `docs/backlog.md` → n/a: raised by Lutan in chat, not a backlog item |
| Branch / worktree | `claude/scratch-output-rule` @ `C:\Development\Animal_Shelter_scratch-output-rule` |
| Dev server | `node scripts/worktree.mjs dev` → not started: two markdown files, none bundled |
| PR | opened from this branch |
| Tested by / date | Claude Sonnet 5.5 / 2026-10-21 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence: a rule in `CLAUDE.md` telling sessions to send scratch logs to the scratchpad, never `../`, plus a decision file
- [x] Files/areas touched listed: `CLAUDE.md`, `docs/decisions/2026-10-21-no-scratch-output-above-the-repo.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [x] Roles affected identified: none; no role sees these files
- [x] Out of scope written down: no script change, because a search of the repo found nothing that writes to `..`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch created from `origin/main` this session, nothing to merge
- [ ] `node scripts/gates.mjs` — n/a: documents only, nothing compiled or bundled
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-test-plan.mjs` run locally before pushing

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the new paragraph reads correctly in place in Workstreams §4 and its backtick spans render
- [ ] Data persists — n/a: no data path
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [ ] Boundary cases checked — n/a: no logic

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every live role | none of these files | nothing — `docs/` is not served | n/a: not bundled or routed |
| signed out | none | nothing | n/a: same |

- [ ] Every role above tested — n/a: no surface on which roles could differ
- [ ] A role that should not have access is blocked server-side — n/a: no guard, policy or permission touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; this is guidance for Claude sessions, not shelter staff
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no browser session
- [ ] Network clean — n/a: no browser session

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no pages; the surrounding §4 rules still read in order
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `CLAUDE.md` is read by sessions, not loaded by a page
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: no backlog item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-21-no-scratch-output-above-the-repo.md`
- [ ] `README.md` still accurate — n/a: not touched, unaffected
- [ ] **Release notes.** — n/a: nothing a shelter user could notice; a rule for Claude sessions
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The four files' names, dates and contents were read, and a `git grep` of the repo found no writer

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — n/a: nothing reaches a deployed build
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed

### On the deployed build

- [ ] Deployed to test — n/a: nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing served
- [ ] Timezone-sensitive behaviour proved — n/a: no logic
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: no pasted evidence
- [ ] Public pages re-checked after a cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: neither
- [ ] `--dry-run` against production run and clean — n/a: no migration
- [ ] Destructive or rewriting migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback is `git revert` of this PR; no deploy, no database effect. It does not cover the four deleted logs, which were scratch output and are not recoverable

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A rule only helps sessions that read it; no mechanism stops a redirect to `..` | accepted — no writer exists in the repo to fix |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | No new stray files appear in `C:\Development\` over the next few days | `C:\Development\` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Sonnet 5.5  Date: 2026-10-21

### Manual verification

- [ ] The manual list is not empty, so only the person who looked may tick this — n/a: pending, see the signature line below

Manual verification by: pending: whether stray files stop appearing can only be seen over the next few days

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: docs-only, no release dependency

Result: pass with accepted defects
