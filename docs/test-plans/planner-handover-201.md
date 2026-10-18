# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover rewrite at the ten-workstream mark |
| Backlog item | `docs/backlog.md` → none: the handover is a process artifact, written when `.plan-day.md`'s counter reaches nine |
| Branch / worktree | `claude/planner-handover-201` @ `C:\Development\Animal_Shelter_planner-handover-201` |
| Dev server | not started — `docs/` only change, nothing to render |
| PR | opened from this branch; number added in the follow-up commit that ticks CI |
| Tested by / date | Claude (Daily Planner) / 2026-10-17 |
| Carries a migration? | no |
| Tested at SHA | `b4b26b05` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` for the next `/plan-day` chat, after the ten workstreams of 2026-10-17; no backlog item, the trigger is the counter in `.plan-day.md`
- [x] Files/areas touched listed — `docs/planner-handover.md` and this new test plan. No routes, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified — none. Nothing in the app reads this file; its readers are Claude sessions and Lutan
- [x] Anything explicitly **out of scope** written down — three things are **recorded in the handover and deliberately not fixed here**, so this PR stays a docs-only change: (1) the Doctor's broken `home_path` on dev, which is a code fix for a later stream; (2) `0.35.0` having deployed a note that was not true at its deployed SHA, which is history and cannot be recalled, with the correction already sitting in `unreleased` for `0.36.0`; (3) the eleven leftover worktrees, nine of them `HELD`, which need sessions closed before `/clean-streams` can run. `.plan-day.md` is gitignored local state and its counter reset is not part of this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and the branch was pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 346s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. Recorded for the next stream: the highest on `main` is `0219_shelter_photo_folder.sql`, so `0220` is free
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR, though `--status` was read while writing the handover and reported 220 of 220 applied, zero drift
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a Markdown document with no runtime behaviour
- [ ] Data persists — n/a: nothing is written or read by the app
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

n/a for every row: the file is not served by the app and is not reachable from any route. It is read
from the repository by Claude sessions and by Lutan. The table is left unfilled for that reason.

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
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: internal process document, not user documentation
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: nothing loads in a browser
- [ ] Network clean — n/a: no requests

## 6. Regression

- [x] The pages nearest the change still work — none: no page reads `docs/planner-handover.md`. Verified by `grep -rn "planner-handover" src/ worker/ scripts/`, which returns nothing, so no code path depends on its shape or contents
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched; the diff is two `docs/` files
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged `origin/main` cleanly and all four gates passed afterwards at this SHA

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not a backlog item; the handover's trigger is the workstream counter, and `docs/backlog.md` is untouched by this PR. The `main`-side `docs/backlog.md` conflict from the day's `git merge backlog` was resolved on `main` before this branch synced, not here
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a by the usual reading, but answered deliberately: **the handover is itself the record.** The round's design decisions already have their own files, written by the streams that made them — `2026-10-17-photo-approval-schema.md`, `2026-10-17-pending-photos-schema.md`, `2026-10-17-photo-approval-queue.md`, `2026-10-17-add-shelter-photos-card.md` — and the handover points at them rather than restating them. `docs/decisions/2026-10-08-planner-handover-counter.md` already covers why this document exists and when it is rewritten
- [x] `README.md` still accurate — unchanged by this PR and makes no claim about the handover
- [ ] **Release notes.** — n/a: an internal planning document; no shelter user could notice it, and `src/lib/releases.ts` is untouched. Note that `unreleased` already carries four lines from this round's streams, which belong to those PRs and not to this one
- [x] Commit messages say why, not just what — the commit leads with the round's finding (a stale backlog branch cost a whole stream) rather than describing the edit
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — all ten token figures were read from `get_usage` in the turn each merge was noticed, never estimated afterwards; the migration counts, open-item count (107) and allow-list count (17) were read from the repository with `ls`, `grep -c` and `apply-migrations.mjs --status`; `0.35.0`'s deployed SHA was read from `docs/releases/2026-10-17.md` and compared against the merge order in `git log`, rather than inferred from the release notes

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `b4b26b05`; it is the tip of this branch, and the file does not ship in any build
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Nothing in this PR reaches a build, but the SHA check belongs to whoever next deploys — and this round is the reason it matters: see Defect 1
- [ ] Deployed to test — deferred: production release manager. A `docs/` file is not deployed
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. No deployed surface to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; the only dates are written in prose
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the "bands" in this document are planning estimates in prose, not code thresholds; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is copied from the run, not retyped
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this commit restores the previous edition, which is #690's. Nothing else is affected: no build carries this file, no migration is involved, and no runtime reads it. What a revert does **not** cover: `.plan-day.md`'s counter is gitignored local state, so reverting would leave the counter reset while the handover describing the round was gone — whoever reverts should set it back to 10 by hand

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `0.35.0` deployed at `faee19c5`, which is **earlier than the crash fix (#694)**, so its note saying name-card scanning works on Add Medical Photos and Record Weight was mailed to every admin while both pages were still crashing | accepted — it is history and a major release cannot be recalled. The correction is already in `unreleased` for `0.36.0`, so the next release states what happened. The **process** gap is recorded in the handover: check each note's subject is on the deployed SHA before deploying |
| 2 | high | `/medical/photos` and `/medical/weight` crashed with no resident chosen | fixed — #694, this round. The handover records that it **was** a regression from #685, proved by `ScanCardButton.tsx` being added in `55047db6`, where the previous edition had left it unproved |
| 3 | medium | PR #697 regressed `/photos/add` for Management and the Head of Medical by narrowing `photoCategoriesFor()` for everyone | fixed — closed unmerged before it reached `main`; Lutan caught it in review. Root cause (a stale `backlog` branch, seven commits ahead, while the brief was written from `main`) is the handover's lead finding |
| 4 | medium | The Doctor's `home_path` sends them to `/appointments`, which their cells cannot open | deferred to backlog — a live defect on dev, named in the handover as a strong candidate for next round. Pre-existing and not in this PR's diff |

Defects 1–4 are not in this PR's diff. They are listed because this plan is where the planner's pass
over the round is recorded, and all four were established or resolved during it.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty, deliberately. There is no surface a person needs to look at: the document's audience is the
next `/plan-day` chat, and the way it gets verified is being used — which happens after this merges,
not before it. Every figure in it was read from a session or the repository rather than estimated.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planning document with no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing here needs deploying; the section 8 `deferred:` lines are the standing handover, and Defect 1 is the one worth their attention before the next deploy

Result: pass
