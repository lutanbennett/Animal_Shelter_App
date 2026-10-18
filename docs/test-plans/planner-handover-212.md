# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover rewrite at the nine-workstream mark |
| Backlog item | `docs/backlog.md` → none: the handover is a process artifact, written when `.plan-day.md`'s counter reaches nine |
| Branch / worktree | `claude/planner-handover-212` @ `C:\Development\Animal_Shelter_planner-handover-212` |
| Dev server | not started — `docs/` only change, nothing to render |
| PR | opened from this branch; number added in the follow-up commit that ticks CI |
| Tested by / date | Claude (Daily Planner) / 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | `31f8ec66` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` for the next `/plan-day` chat, after the nine workstreams of 2026-10-18; no backlog item, the trigger is the counter in `.plan-day.md`
- [x] Files/areas touched listed — `docs/planner-handover.md` and this new test plan. No routes, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified — none. Nothing in the app reads this file; its readers are Claude sessions and Lutan
- [x] Anything explicitly **out of scope** written down — four things are **recorded in the handover and deliberately not fixed here**, so this PR stays docs-only: (1) the peak-memory measurement on the next Pi build, which only Lutan can take; (2) the Cloudflare API token decision, which is his security call; (3) the Foster/Unassigned placement row the cross-check found, which is a data question only he can answer; (4) the Doctor's broken `home_path` on dev, a code fix for a later stream. `.plan-day.md` is gitignored local state and its counter reset is not part of this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged (`Already up to date`) and the branch was pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 124s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. Recorded for the next stream: the highest on `main` is `0220_doctor_report_purpose.sql`, so `0221` is free
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR, though `--status` was read while writing the handover and reported 221 of 221 applied, zero drift
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR. The handover does carry `0220`'s production ordering warning, which belongs to #710 and not to this PR

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
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date` against `origin/main` and all four gates passed afterwards at this SHA

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not a backlog item; the handover's trigger is the workstream counter, and `docs/backlog.md` is untouched by this PR. The day's three `git merge backlog` runs were resolved on `main`, not here
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a by the usual reading, but answered deliberately: **the handover is itself the record.** The round's design decisions already have their own files, written by the streams that made them — `2026-10-18-confirm-outside-start-transition.md`, `2026-10-18-pi-deploy-safety.md`, `2026-10-18-doctor-report-schema.md`, `2026-10-18-appeals-findable.md`, `2026-10-18-hub-photo-viewer.md`, `2026-10-18-admin-tables-cards-log-only.md`, `2026-10-18-cumulative-trend-chart.md` and `2026-10-18-clinic-visit-record-page.md` — and the handover points at them rather than restating them. `docs/decisions/2026-10-08-planner-handover-counter.md` already covers why this document exists and when it is rewritten
- [x] `README.md` still accurate — unchanged by this PR and makes no claim about the handover
- [ ] **Release notes.** — n/a: an internal planning document; no shelter user could notice it, and `src/lib/releases.ts` is untouched. Note that `unreleased` already carries four lines from this round's streams, which belong to those PRs and not to this one
- [x] Commit messages say why, not just what — the commit leads with the round's finding (nine streams spanned 134,743–237,951 with none over band, and the stream banded high for having to build its own counting came in 27% under) rather than describing the edit
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — all nine token figures were read from `get_usage` in the turn each merge was noticed, never estimated afterwards, and each stream's model and effort were read from `get_session` rather than assumed from what was recommended; the migration counts and zero drift came from `apply-migrations.mjs --status`; the open-item count (108) from `check-backlog-sections.mjs` with the `backlog` worktree's path passed explicitly; the PR numbers and merge order from `gh pr list` and `git log`; the cross-check finding is quoted from `docs/decisions/2026-10-18-cumulative-trend-chart.md`, which recorded it from a run of `scripts/check-daily-count.mjs`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `31f8ec66`; it is the tip of this branch, and the file does not ship in any build
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Nothing in this PR reaches a build
- [ ] Deployed to test — deferred: production release manager. A `docs/` file is not deployed
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. No deployed surface to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; the only dates are written in prose
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the "bands" in this document are planning estimates in prose, not code thresholds; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is copied from the run, not retyped
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed. The handover does record that a purge is now a runbook step after every Pi deploy (#708), which belongs to that PR

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

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this commit restores the previous edition, which is #704's. Nothing else is affected: no build carries this file, no migration is involved, and no runtime reads it. What a revert does **not** cover: `.plan-day.md`'s counter is gitignored local state, so reverting would leave the counter reset while the handover describing the round was gone — whoever reverts should set it back to 9 by hand

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | Discard and Remove on *Photos to approve* froze the whole app including the nav, **live on production** — `await confirm()` inside `startTransition()` in two files, the only two in `src/` that inverted the house pattern | fixed — #707, this round. A guard (`scripts/check-confirm-outside-transition.mjs`) now fails the build if the pattern reappears, because twelve files got it right by convention alone and two did not |
| 2 | high | A Pi deploy could poison Cloudflare's edge cache with a broken stylesheet for a **year**, invisibly and on every deploy; it reached a real user on a real phone on 2026-10-17 | partly fixed — #708 made the swap atomic, added `scripts/pi/check-assets.mjs` and put a manual purge step in `docs/release-procedure.md`. **Automating the purge needs a Cloudflare API token on the Pi, which is Lutan's security decision** and is recorded in the handover as blocked on him |
| 3 | high | The Pi build ran out of memory and killed deploys three times running; the 6 GB swap that unblocked `0.36.0` existed only as an undocumented hand edit, so a rebuilt Pi would have gone straight back to failing | partly fixed — #708 put the swapfile in `setup.sh`, documented the size in `docs/pi-hosting.md` and made `deploy-pi.sh` refuse below ~5.5 GiB. **Dropping the typecheck is still open and waits on a peak-memory measurement only Lutan can take** — the item is explicit that the measurement comes before the fix |
| 4 | medium | A `Foster` placement (2026-06-01 to 2026-09-07) carries an **Unassigned** enclosure rather than Fostered, so the daily at-the-shelter series and a straight count disagree by one on 2026-07-16 | deferred to backlog — **a data question for Lutan, not a chart bug.** Found by `scripts/check-daily-count.mjs` because #714's brief told it to report a discrepancy rather than reconcile it. Either the type or the enclosure on that row is wrong; the script will surface any others |
| 5 | medium | An unverified admin saw a Who-does-what board with no buttons and the browser's no-drop cursor, and read a lock as a fault — it blocked Lutan's own next step | fixed — #709. The gate itself was deliberately **not** weakened |
| 6 | low | The cumulative chart's own explanatory note said "Black line", which is white in dark mode | fixed — #716, a one-line follow-up Lutan asked for after reading the merged chart. Recorded because the handover notes that a follow-up PR on a merged branch is normal and **not** a tenth workstream |

Defects 1–6 are not in this PR's diff. They are listed because this plan is where the planner's pass
over the round is recorded, and all six were established or resolved during it.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty, deliberately. There is no surface a person needs to look at: the document's audience is the
next `/plan-day` chat, and the way it gets verified is being used — which happens after this merges,
not before it. Every figure in it was read from a session or the repository rather than estimated.

The four things that **do** need a person are not checks on this PR; they are recorded in the
handover under *Items whose remaining condition is a person*, which is where they belong.

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
- [x] Handed to the production release manager — nothing here needs deploying; the section 8 `deferred:` lines are the standing handover, and **Defects 2 and 3 are the ones worth their attention before the next Pi deploy**, along with the handover's warning that `0220` must be applied to production before this round's app code

Result: pass
