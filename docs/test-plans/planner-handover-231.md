# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover rewrite at the ten-workstream mark (2026-10-19) |
| Backlog item | `docs/backlog.md` → none: the handover is a process artifact, written when `.plan-day.md`'s counter reaches nine |
| Branch / worktree | `claude/planner-handover-231` @ `C:\Development\Animal_Shelter_planner-handover-231` |
| Dev server | not started — `docs/` only, nothing to render |
| PR | PENDING |
| Tested by / date | Claude (Daily Planner) / 2026-10-19 |
| Carries a migration? | no |
| Tested at SHA | `e7955e79` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` for the next `/plan-day` chat after the ten workstreams of 2026-10-19; no backlog item, the trigger is the counter in `.plan-day.md`
- [x] Files/areas touched listed — `docs/planner-handover.md` and this new test plan. **Nothing else**: no routes, no `src/`, no `worker/`, no `scripts/`, no `supabase/migrations/`, no `.claude/`
- [x] Roles affected identified — none. Nothing in the app reads this file; its readers are Claude sessions and Lutan
- [x] Anything explicitly **out of scope** written down — the round's open questions are **recorded in the handover and deliberately not acted on here**, so this PR stays docs-only: the `CLAUDE.md` title rule (filed as its own backlog item, needs a PR of its own); the 15 GB figure still wrong in `docs/decisions/2026-10-12-daily-backup-prune-by-age.md` (also its own item); the meme-maker widening; the Home Assistant walkthrough itself; and every item under *Items whose remaining condition is a person*. `.plan-day.md` is gitignored local state and its counter reset is not part of this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `git fetch origin && git merge origin/main` reported **Already up to date**; the branch was cut from `f0c3ecf6`, which is the tip of `main` after #741 and the `backlog` merge. Pushed by the post-commit hook
- [x] `node scripts/gates.mjs` — closing lines exactly as printed:

```
=== gates: build exited 0 after 121s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — all eight checks pass on #742 (audit, cards-count, check, migration-numbers, new-policy-role-names, public-views, script-integrity, test-plan); seen green before ticking

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. Recorded for the next stream: the highest on `main` is `0225_role_home_tiles.sql`, so `0226` is free
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR, though `--status` was read while writing the handover and reported 226 of 226 applied, zero drift
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR. The handover does record that `0224` and `0225` belong to #738 and #739 and are theirs to sequence

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a Markdown document with no runtime behaviour
- [ ] Data persists — n/a: nothing is written or read by the app
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

n/a for every row: the file is not served by the app and is not reachable from any route. It is
read from the repository by Claude sessions and by Lutan. The table is left unfilled for that
reason.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: not served by the app |
| management | n/a | n/a | n/a: not served by the app |
| second_in_command | n/a | n/a | n/a: not served by the app |
| head_of_medical | n/a | n/a | n/a: not served by the app |
| doctor | n/a | n/a | n/a: not served by the app |
| volunteer | n/a | n/a | n/a: not served by the app |
| signed out | n/a | n/a | n/a: not served by the app |

- [ ] Every role above tested — n/a: the file has no route, so there is nothing for a role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route, no server handler

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; `src/app/NavLinks.tsx` untouched
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: an internal process document, not user documentation
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: nothing loads in a browser
- [ ] Network clean — n/a: no requests

## 6. Regression

- [x] The pages nearest the change still work — none: no page reads this file. Verified by `grep -rn "planner-handover" src/ worker/ scripts/`, which returns nothing, so no code path depends on the handover's shape or contents
- [x] Any shared file touched checked from a second, unrelated page — n/a by the usual reading, and answered deliberately: the handover is shared in the sense that every future planning chat reads it, so it was re-read after writing to confirm the tables render and no heading was orphaned. **One real risk was checked specifically**: the file was removed and written fresh rather than edited, which is the documented way round the Write tool's refusal to overwrite an unread file — `git diff --stat` confirms one file changed, not a delete plus an add
- [x] Nothing merged from `main` during `sync` was broken by this branch — `git merge origin/main` reported Already up to date; the branch was cut from the current tip

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not a backlog item; the handover's trigger is the workstream counter, and `docs/backlog.md` is untouched by this PR. The day's `git merge backlog` runs were resolved on `main`, not here, and the eleven backlog edits this planner made today went on the `backlog` branch as `CLAUDE.md` requires
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a by the usual reading, but answered deliberately: **the handover is itself the record.** The round's design decisions have their own files, written by the streams that made them, and the handover points at them rather than restating them. `docs/decisions/2026-10-08-planner-handover-counter.md` already covers why this document exists and when it is rewritten
- [x] `README.md` still accurate — unchanged by this PR and makes no claim about this file
- [ ] **Release notes.** — n/a: an internal planning document; no shelter user could notice it, and `src/lib/releases.ts` is untouched. Note that `unreleased` already carries this round's lines, which belong to #736–#741 and not to this one
- [x] Commit messages say why, not just what — the commit leads with the round's finding (the backlog's titles claimed blocks their own bodies had answered, and the real cost was sequencing, not repetition) rather than describing the edit, and names the planner's own instance of the same fault
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every token figure was read from `get_usage` in the turn each merge was noticed, never estimated afterwards, and every model/effort value from `get_session`. The floor figures are the category breakdowns from those same readings. The migration counts and zero drift came from `apply-migrations.mjs --status`; the open-item count (103) from `check-backlog-sections.mjs`; the PR numbers and merge order from `gh pr list`; the conflict's two side lengths (1,983 and 4,055 characters) were measured from the conflicted file, and the three-minute gap between Lutan's widening commit and #741's merge from `git log --format=%ci` against `gh pr view --json mergedAt`. **Where a claim could not be measured it is marked as such** — the handover repeats that a single end-of-run `get_session` reading records agreement with the recommendation, not proof of what a stream ran on

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded in the header; it is the tip of this branch, and the file ships in no build
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Nothing in this PR reaches a build
- [ ] Deployed to test — deferred: production release manager. `docs/` files are not deployed
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. No deployed surface to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; the only dates are written in prose
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the "bands" in this document are planning estimates in prose, not code thresholds; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is copied from the run, not retyped
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var in this PR

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this commit restores #730's edition of the handover. Nothing else is affected: no build carries the file, no migration is involved, no runtime reads it. What a revert does **not** cover: `.plan-day.md`'s counter is gitignored local state, so reverting would leave the counter reset while the handover describing the round was gone — whoever reverts should set it back to 9 by hand. It also would **not** undo the eleven backlog edits made on the `backlog` branch today, which are separate commits on a separate branch and are the substance of the round's findings

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | **Seven open backlog items had titles claiming a block their own bodies had already answered**; six were real. `assistant-retention` (DB-11) was decided 2026-10-10, carries a migration, was buildable throughout, and was parked as blocked by every `/plan-day` since — nine days, silently, because nobody re-asks a question they believe is pending with the user | fixed for the six — all titles rewritten and superseded passages marked in place on the `backlog` branch. **Root cause deferred to backlog**: an item asks for a `CLAUDE.md` rule that recording an answer must rewrite the title, plus the three-line scan that found all six. That needs its own PR |
| 2 | high | **The planner asserted a fact it could have asked for.** It inferred a Home Assistant Green ships with 128 GB from the model name, concluded ~108 GB was being consumed, and wrote a paragraph into the backlog sending a future session hunting through Lutan's backups, recorder retention and camera footage. His box has 28 GB | fixed — corrected on the `backlog` branch with the error attributed, and an explicit instruction not to reinstate the concern. Recorded in the handover as the planner's own instance of defect 1, so the `CLAUDE.md` item covers both |
| 3 | medium | **A merge conflict the documented method would have resolved wrongly.** `CLAUDE.md` says take `main`'s side when it is longer; here `main` was **shorter and ticked** (1,983 chars) while `backlog` was **longer and open** (4,055), because Lutan widened the meme-maker item **three minutes before #741 merged**. Taking the tick would have marked unbuilt scope as done | fixed — resolved as a union, left open, with a note recording what shipped against what remains. The handover documents the inverse case so the next conflict is read correctly |
| 4 | medium | **`scripts-truth-fixes` ran 2% over band** (203,316 against 140–200k) because it was banded as "two script files" when its real work was verifying twelve acceptance-matrix rows **against the running app** — live interactions, the third estimating axis | accepted and recorded — the handover extends the third axis to verification work: band by N screens, not by files changed |
| 5 | medium | **One item accumulated six separate dated appends in a single day**, from this planner, which is the burying pattern of defect 1 | fixed — consolidated into one ASSESSMENT COMPLETE block on the `backlog` branch before this file was written |
| 6 | low | **The Write tool refuses to overwrite a file the session has not read**, and the first attempt at this handover was rejected after the content was composed, costing a full rewrite | accepted — the documented workaround (`rm` then write as new) was used, and the handover now carries the trap in *Writing the next one* so the next edition does not pay it again |

Defects 1, 2, 3 and 5 were established and resolved during this round; their fixes are on the
`backlog` branch, not in this PR's diff. They are listed because this plan is where the planner's
pass over the round is recorded. **What this PR actually contains is the handover that carries all
six forward.**

## Left for manual verification

| # | What to check | Where |
|---|---|---|
|   |   |   |

Empty, deliberately. There is no surface a person needs to look at to verify this PR: the
document's audience is the next `/plan-day` chat, and the way it gets verified is being used, which
happens after this merges. Every figure in it was read from a session or from the repository rather
than estimated, and the one claim that cannot be measured — what model a stream truly ran on
throughout — is marked as unverifiable rather than asserted.

The things that do need a person are not checks on this PR; they are recorded in the handover under
*Items whose remaining condition is a person*. Two are worth naming here so they are not lost:
**ten leftover worktrees** are waiting on their sessions being closed before `/clean-streams` can
clear them, and **`docs/decisions/2026-10-12-daily-backup-prune-by-age.md` still reasons from the
wrong 15 GB Drive figure** — filed as its own item, because a decision file arguing from a wrong
number is worse than a stale backlog line.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-19

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planning document with no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing here needs deploying, and the section 8 `deferred:` lines are the standing handover. **What does need their attention before the next production deploy is in the handover**: `0224` and `0225` must be applied to production before this round's app code, or the photo-approval surfaces and the role home tiles have no tables behind them; and `deploy-pi.sh`'s build-cache bound (#733) has **not yet been exercised on a real Pi**, so the next deploy is its first proof

Result: pass with accepted defects
