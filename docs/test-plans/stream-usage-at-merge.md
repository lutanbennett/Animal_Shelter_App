# Feature test plan — stream-usage-at-merge

## Header

| | |
|---|---|
| Feature | Each stream posts a `stream-usage:` comment on its own PR before merging; `/plan-day` reads it first |
| Backlog item | `docs/backlog.md` → **EACH STREAM RECORDS ITS OWN USAGE AT MERGE** (ticked) |
| Branch / worktree | `claude/stream-usage-at-merge` @ `C:\Development\Animal_Shelter_stream-usage-at-merge` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | tip of the branch at PR time |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — process documents only: `CLAUDE.md` merge train step 4 and the `/plan-day` skill step 2
- [x] Files/areas touched listed — `CLAUDE.md`, `.claude/skills/plan-day/SKILL.md`, `docs/backlog.md` (tick), `docs/decisions/2026-10-28-stream-usage-pr-comment.md`, this plan
- [x] Roles affected identified — none; no code or access rule changed
- [x] Anything explicitly **out of scope** written down — `docs/release-procedure.md`, workflows, `src/`, migrations untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates
- [x] `node scripts/gates.mjs` — typecheck, lint, test, build run; exit codes read from its output
- [ ] CI green on the PR — n/a: ticked once CI has run on the open PR

## 3. Schema and data — *skip if no migration*

- [ ] Migration number correct — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the first real run is the next batch's merges
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing changed | unchanged | n/a — documents only |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: process change, nothing a shelter user sees
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the edit sits in two prose documents; the skill's fallback guidance and `session_id` warning were kept
- [ ] Any shared file touched checked from a second page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — the item itself; no other open item names this mechanism
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-28-stream-usage-pr-comment.md`
- [x] `README.md` still accurate — it does not describe the merge train
- [ ] **Release notes.** — n/a: no shelter user would notice a planning-process change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the floor figure 98,063 is the brief's measurement, dated in the skill

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: no threshold in the app
- [ ] Evidence pasted is unedited — n/a: no evidence pasted
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reader in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the PR; documents only

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Next batch's streams each leave a `stream-usage:` PR comment | the merged PRs |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: item 1 can only be checked after the next batch merges

Manual verification by: n/a: process change with nothing to look at until the next batch merges

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links it
- [ ] Handed to the production release manager — n/a: documents only

Result: pass

Release manager acknowledgement: n/a: not yet released
