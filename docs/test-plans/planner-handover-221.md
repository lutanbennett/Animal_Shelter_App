# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover rewrite at the ten-workstream mark, plus two new rules in the `/plan-day` skill |
| Backlog item | `docs/backlog.md` → none: the handover is a process artifact, written when `.plan-day.md`'s counter reaches nine. The `SKILL.md` change is a process fix from this round's overrun, also not a backlog item |
| Branch / worktree | `claude/planner-handover-221` @ `C:\Development\Animal_Shelter_planner-handover-221` |
| Dev server | not started — `docs/` and `.claude/` only, nothing to render |
| PR | #730 |
| Tested by / date | Claude (Daily Planner) / 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | `7976d894` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` for the next `/plan-day` chat after the ten workstreams of 2026-10-18, and adds two rules to `.claude/skills/plan-day/SKILL.md` that came out of this round's one overrun; no backlog item, the trigger is the counter in `.plan-day.md`
- [x] Files/areas touched listed — `docs/planner-handover.md`, `.claude/skills/plan-day/SKILL.md`, and this new test plan. No routes, no `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified — none. Nothing in the app reads either file; their readers are Claude sessions and Lutan
- [x] Anything explicitly **out of scope** written down — the round's open questions are **recorded in the handover and deliberately not acted on here**, so this PR stays docs-only: the Foster/Unassigned placement row; the Pi peak-memory measurement; the Cloudflare token question; ticking four new cards onto roles; whether to retire the `staff` role; the 66 menu orphans; and the five remaining acceptance dry-run role passes. Also out of scope: the three *wrong result* defects the dry run found, which are filed as backlog items for their own streams. `.plan-day.md` is gitignored local state and its counter reset is not part of this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — refused from a worktree (`run 'git pull' in the main checkout instead`), so `origin/main` was merged directly with `git fetch origin && git merge origin/main`, which brought #726–#729 in. The branch was pushed by the post-commit hook
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 291s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — all eight checks pass on #730 (audit, cards-count, check, migration-numbers, new-policy-role-names, public-views, script-integrity, test-plan); seen green before ticking

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. Recorded for the next stream: the highest on `main` is `0223_social_shares.sql`, so `0224` is free
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR, though `--status` was read while writing the handover and reported 224 of 224 applied, zero drift
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR. The handover does carry the production ordering warning for `0221`, `0222` and `0223`, which belong to #721, #724 and #725 and not to this one

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two Markdown documents with no runtime behaviour
- [ ] Data persists — n/a: nothing is written or read by the app
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

n/a for every row: neither file is served by the app and neither is reachable from any route. They
are read from the repository by Claude sessions and by Lutan. The table is left unfilled for that
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

- [ ] Every role above tested — n/a: neither file has a route, so there is nothing for a role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route, no server handler

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; `src/app/NavLinks.tsx` untouched
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: internal process documents, not user documentation
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: nothing loads in a browser
- [ ] Network clean — n/a: no requests

## 6. Regression

- [x] The pages nearest the change still work — none: no page reads either file. Verified by `grep -rn "planner-handover" src/ worker/ scripts/`, which returns nothing, so no code path depends on the handover's shape or contents. `SKILL.md` is read by the `/plan-day` skill loader, not by the app
- [x] Any shared file touched checked from a second, unrelated page — `.claude/skills/plan-day/SKILL.md` is shared in the sense that every future planning chat reads it, so the inserted sections were re-read in place after insertion to confirm they landed inside the right headings and did not break the surrounding fenced code blocks — the new brief block is correctly nested inside its own fence, and the finish-line block above it is untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — `git merge origin/main` brought in #726–#729 and all four gates passed afterwards at this SHA

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not a backlog item; the handover's trigger is the workstream counter, and `docs/backlog.md` is untouched by this PR. The day's `git merge backlog` runs were resolved on `main`, not here, and the two items this planner filed (the home-screen ruling, and the dry run's reshape into one stream per role) went on the `backlog` branch as `CLAUDE.md` requires
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a by the usual reading, but answered deliberately: **the handover is itself the record**, and the `SKILL.md` change carries its reasoning in its own commit message. The round's design decisions already have their own files, written by the streams that made them — `2026-10-18-approve-photos-schema.md`, `2026-10-18-social-shares-schema.md`, `2026-10-18-role-home-is-tiles.md`, `2026-10-18-deploy-pi-reexec.md`, `2026-10-18-purge-from-the-deploy-machine.md`, `2026-10-18-phone-check-verified-admin.md` and `2026-10-18-admin-tables-cards-log-only.md` — and the handover points at them rather than restating them. `docs/decisions/2026-10-08-planner-handover-counter.md` already covers why this document exists and when it is rewritten
- [x] `README.md` still accurate — unchanged by this PR and makes no claim about either file
- [ ] **Release notes.** — n/a: internal planning documents; no shelter user could notice them, and `src/lib/releases.ts` is untouched. Note that `unreleased` already carries four lines from this round's streams, which belong to those PRs and not to this one
- [x] Commit messages say why, not just what — the handover commit leads with the round's two findings (a programme briefed as one stream, and a model column that cannot be trusted) rather than describing the edit; the `SKILL.md` commit explains why the stop rule is a narrow exception to the finish-line block rather than a replacement for it
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every token figure was read from `get_usage` in the turn each merge was noticed, never estimated afterwards. The 819,980 figure and the 21,282-token growth that exposed the turn-cost effect are two readings of the same session minutes apart, with the Fable window moving 41% → 47% between them. The migration counts and zero drift came from `apply-migrations.mjs --status`; the open-item count (112) from `check-backlog-sections.mjs` with the `backlog` worktree's path passed explicitly; the PR numbers and merge order from `gh pr list` and `git log`; the dry run's coverage and its 15 findings are quoted from `docs/uat/dry-run-2026-10-18.md`; the two deploy-script timings from the worktree's own `git log --date=format:%H:%M`. **Where a claim could not be measured it is marked as such** — the handover states plainly that this round's model column is unverifiable, and that the older "nineteen consecutive streams" figure cannot now be re-checked, rather than repeating either as fact

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `7976d894`; it is the tip of this branch, and neither file ships in any build
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Nothing in this PR reaches a build
- [ ] Deployed to test — deferred: production release manager. `docs/` and `.claude/` files are not deployed
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. No deployed surface to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; the only dates are written in prose
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the "bands" in this document are planning estimates in prose, not code thresholds; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is copied from the run, not retyped
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed. The handover does record that the purge now runs from the deploy machine (#720), which belongs to that PR

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var in this PR. The handover records that #720 introduced `CLOUDFLARE_PURGE_TOKEN` in `.env.deploy.production`, which belongs to that PR and is the release manager's to confirm

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of these two commits restores the previous handover (#717's edition) and the previous `SKILL.md`. Nothing else is affected: no build carries either file, no migration is involved, and no runtime reads them. What a revert does **not** cover: `.plan-day.md`'s counter is gitignored local state, so reverting would leave the counter reset while the handover describing the round was gone — whoever reverts should set it back to 10 by hand. Reverting the `SKILL.md` half alone would also remove the stop rule while leaving the handover pointing at it, so revert both or neither

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | A programme was briefed as one workstream: `fable-acceptance-dry-run` was banded 300–460k, reached **819,980 at ~35% done** and was stopped by Lutan. A full run extrapolates to ~2.3M — more than two context windows — so it was unfinishable in one session at any effort, on any model | fixed in process — `SKILL.md` gains a third estimating axis (how many **live interactions** must the stream drive) and a rule that a walk of N items × M roles is a programme, not a workstream. The backlog item is reshaped into one stream per role, Admin already done |
| 2 | high | Told to stop, the stream's **correct, brief-mandated tidy-up** (merge `main`, fill the test plan, open the PR) cost about **6% of the weekly Fable window on its own**, because every turn re-sends the whole context: context grew 21,282 tokens while Fable moved 41% → 47% | fixed in process — a stop rule now goes in every brief: told to stop, commit and report, and **do not** merge, write a test plan or open the PR from a large session. Written as a deliberately narrow exception beside the finish-line block, not instead of it |
| 3 | high | Every brief that round got a scope-creep escape except the largest one, which is the one that needed it | fixed in process — `SKILL.md` now requires a **hard deliverable boundary** in every brief, not only the escape |
| 4 | medium | This round's **model column cannot be trusted**. Lutan set Sonnet; sessions changed to Fable mid-build and he moved them back by hand. `get_session` reports the setting at read time, so one reading cannot establish what a stream ran on — and the older "nineteen consecutive streams on sonnet/low" claim was built the same way | accepted and recorded — the handover states plainly that no model conclusion may be drawn from these rows and that the older figure cannot be re-verified. Token figures stand, being measured directly. Next round must either read `get_session` at the start as well as the end, or stop presenting the dials as a controlled variable |
| 5 | medium | Two app halves ran **15% and 31% over band**, breaking a long run of inside-or-under results, because folding two items' schema into one PR led the planner to band their app halves as if the app work had folded too | accepted and recorded — the handover's rule: folding schema does not fold the app work; band each app half as the full feature it is |
| 6 | medium | The **retired `staff` role counted as a photo approver**, so removing Residents from Management was not refused | fixed — `0222` (#724), on Lutan's ruling that retired roles are excluded. Whether to retire the role properly is a separate question recorded as his |
| 7 | medium | Signing in as the **Doctor** landed on `/appointments`, which the Doctor's own cells refuse — a live defect on dev that had blocked the phone-width harness twice | fixed — #726, on Lutan's ruling that a role's home is its who-does-what tiles. It also closed the *Mobile sweep leftovers* item |
| 8 | medium | Three *wrong result* defects found by the dry run's Admin pass: a bill turned into a delivery loses its cost and never attaches; a mistyped diet silently inflates the food forecast, purchasing and cashflow; a visit left "Scheduled" with a past time saves as Completed | deferred to backlog — all filed as items (which is why the open count rose from 108 to 112). **Not in this PR's diff**; they need their own streams and are named in the handover as the strongest quick wins on the board |
| 9 | low | Four acceptance-checklist rows are themselves wrong, including one naming a control that does not exist | deferred to backlog — filed. Cheap to fix and they protect the real sign-off run |
| 10 | low | The backlog's line numbers shifted **inside a single session** when Lutan filed an item mid-conversation; three items read by line number came back as three different, already-completed items — which looks exactly like "the work is done, do not plan it" | fixed in process — the handover's rule is to locate items with `grep -n` on their title every time, never by a line number recorded earlier, even minutes earlier |

Defects 1–10 are not in this PR's diff. They are listed because this plan is where the planner's
pass over the round is recorded, and all ten were established or resolved during it. Defects 1–3 and
10 are the ones this PR actually fixes, in `SKILL.md` and in the handover.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
|   |   |   |

Empty, deliberately. There is no surface a person needs to look at to verify this PR: the document's
audience is the next `/plan-day` chat, and the way it gets verified is being used — which happens
after this merges, not before it. Every figure in it was read from a session or
from the repository rather than estimated, and the two figures that could not be measured are marked
as unverifiable rather than asserted.

The things that do need a person are not checks on this PR; they are recorded in the handover under
*Items whose remaining condition is a person*. One of them is a cleanup worth naming here so it is
not lost: the dry run left a standing admin login on dev, `dryrun-admin-20261018@example.test`, full
admin with an approved authenticator app. Its TOTP secret lives in that worktree's gitignored
`.env.local` and dies when the worktree is cleared, but the account does not — archive it in
Settings → Security when `/clean-streams` runs.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-18

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planning document with no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing here needs deploying, and the section 8 `deferred:` lines are the standing handover. **What does need their attention before the next production deploy is in the handover**: `0221`, `0222` and `0223` must be applied to production **before** this round's app code, or the Photos badge, `/memes` and the Bills surfaces error; the Cloudflare purge now runs from the deploy machine (#720) and needs `CLOUDFLARE_PURGE_TOKEN` present; and `deploy-pi.sh`'s re-exec fix (#722) has **never been exercised on a real Pi**, so the next deploy is its first proof

Result: pass with accepted defects
