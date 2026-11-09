# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `735` — the delta for the plan that ran 2026-11-09 |
| Backlog item | `docs/backlog.md` → none. A handover is process bookkeeping, not a backlog item; `CLAUDE.md` names `docs/planner-handover.md` as one of the two documents whose PR merges on green |
| Branch / worktree | `claude/planner-handover-735` @ `C:\Development\Animal_Shelter_planner-handover-735` |
| Dev server | not started — docs only, no runtime surface |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner) / 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | 124ee9d7 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one file rewritten, `docs/planner-handover.md`, from edition `726` to `735`, as a delta reporting what `726`'s owed items and warnings did**
- [x] Files/areas touched listed — `docs/planner-handover.md` (rewritten) and `docs/test-plans/planner-handover-735.md` (this file). **No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, no scripts**
- [x] Cards affected identified — **none.** The file grants nothing, is read by no code, and has no card, page or activity attached to it. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — **the plan itself.** `.plan-day.md` is gitignored and is not in this PR. So are the two backlog items this plan filed (`#k7waq`, `#m2vxe`) and the four ticks it closed (`#h8xqv`, `#av8rq`, `#k3mqp`, `#rg7pv`): the filings went to the `backlog` branch and the ticks arrived through their own streams' PRs. **Also out of scope: batch 3's three streams**, which were briefed and handed over with no session opened, so none of their figures are in this edition and the edition says so in its own opening lines

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — **`n/a: refused by design in a worktree`** (it answers *"worktree: run 'git pull' in the main checkout instead"*). `git fetch origin && git merge origin/main` was run in its place and answered `Already up to date`, which is what that line is for — the branch was cut from `origin/main` minutes earlier
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — run in this worktree, output pasted below exactly as it printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 234s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 831s
=== gates: test — npm test
=== gates: test exited 0 after 139s
=== gates: build — npm run build
=== gates: build exited 0 after 531s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

Skipped: this PR carries no migration.

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `--status` reviewed before applying — `n/a: no migration`
- [ ] `--dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly — `n/a: no migration, and no code reads this file`
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated — `n/a: no migration`

## 4. Functional checks

A handover has no runtime behaviour. It is prose read by one chat.

- [x] Happy path works end to end — **the file was read back from disk after writing and its headings, tables and `#id` references were checked**: it opens as edition `735`, states it is a delta against `726`, and leads with the one fault of this plan rather than with its actuals
- [ ] Data persists — reload the page and the change is still there — `n/a: no page`
- [ ] Create / edit / delete all exercised — `n/a: no UI`
- [ ] Empty state renders sensibly — `n/a: no UI`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

`n/a`: the file is in the repository, which is public. It is not served by the app, has no route and no card.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a — not served by the app | n/a | n/a: no route |
| exactly `<card key>` | n/a — not served by the app | n/a | n/a: no route |
| signed out | n/a — not served by the app | n/a | n/a: no route |

- [ ] Every login above tested — `n/a: the file has no route and no card; there is nothing to sign in to`
- [ ] A login that should not have access is blocked server-side — `n/a: no route`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: no nav entry; NavLinks.tsx is untouched`
- [ ] Manual updated (`src/lib/manual/en.ts`) — `n/a: the manual is for shelter users; a planner handover is not a shelter-facing document`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — **`n/a: no pages`, and the gates above are the regression evidence for the repository as a whole** (typecheck, lint, test and build on a tree containing this change)
- [x] Any shared file touched — **none.** `docs/planner-handover.md` is read by no code and imported by nothing; `grep` for it finds only prose references in `CLAUDE.md`, `docs/release-procedure.md` and earlier decision files, none of which parse it
- [x] Nothing merged from `main` during `sync` was broken by this branch — `origin/main` was fetched and merged before the gates ran (`Already up to date`), and the gates ran on that tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a handover has no backlog item, and this PR deliberately touches no backlog file`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: no design choice. The handover's content is a report of measurements this plan already took; the decisions it refers to are recorded in the sixteen decision files dated 2026-11-09 that batches 1 and 2 wrote`
- [x] `README.md` still accurate — **unchanged and unaffected**; it does not describe the handover
- [ ] **Release notes.** `n/a: nobody at the shelter would notice. The file is read by one chat and by nobody using the app`
- [x] Commit messages say why, not just what — the commit says what `726` left owed, what this edition found, and which of `726`'s conclusions it corrects
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** **This is the line that matters most, because a handover is nothing but claims.** Each figure in `735` is traceable: the six `tokens`/`messages` figures come from the `stream-usage:` comments on PRs #1421–#1428 and were read with `gh pr view --json comments`, not recalled; the floor is `tokens − messages` computed from those; the band outcomes are those figures against the bands recorded in `.plan-day.md` **before** the streams ran; `#h8xqv`'s production result (`eligible 33 / no_row 0 / video 0 / held_back 2`, 300 residents, 35 with a photo) and `#k3mqp`'s (13 contacts, 13 rows, 13 twinned) are this planner's own read-only production runs from the main checkout; the `#j8vt4` correction was established by reading #1426's PR body (*"#q7dn3, cards.ts, .githooks untouched"*) and `#q7dn3`'s own tail, not inferred from the tick. **Where a conclusion is the planner's reading rather than a measurement, the sentence says so** — the floor's apparent model-dependence is written as *"an observation, not a finding"*, and `726`'s new band row is reported as **untested** rather than carried as validated

## 8. Pre-production gate

Nothing here is deployed by this PR. The file is not served, not bundled and not read at runtime, so each
gate below is `n/a` with its reason rather than `deferred:` — there is no deploy-time moment at which it
would become true.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a: nothing is deployed by this PR`
- [ ] Deployed SHA matches the tested SHA — `n/a: nothing is deployed by this PR`

### On the deployed build

- [ ] Deployed to test — `n/a: nothing is deployed by this PR`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: no runtime surface to smoke-test`
- [ ] Timezone-sensitive behaviour proved — `n/a: no date logic. The dates in the file are prose`
- [ ] Boundary or banding change — both edges covered — `n/a: no boundary in code. The band figures in the file are a record of past readings, not a threshold any code applies`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is the run's own output file, `cat`-ed and pasted, including its per-gate timings
- [ ] Public pages re-checked after a cache purge — `n/a: no public page changes`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `n/a: no deploy`
- [ ] `strip-baked-env` line seen — `n/a: no deploy`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: none added`

### Migration ordering — *skip if no migration*

Skipped: no migration.

- [ ] Does this PR contain both a migration and code that reads it? — `n/a: no migration`
- [ ] `--env production --dry-run` run and clean — `n/a: no migration`
- [ ] Backup fresh for a destructive migration — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this one commit restores edition `726`, and that is the whole of it.** Nothing is deployed, no schema changes, and no running system reads the file, so there is nothing a revert would fail to cover. **What a revert would NOT undo, and it is worth naming because this edition is the only record of some of it:** the two backlog items this plan filed and the four ticks it closed are in other commits and other branches; `0343` and `0344` remain pending on **production**, which is the sequencing warning the handover carries; and the nine worktrees this plan created are on disk, not in git

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | At 211 lines the file is over the ~150-line target `CLAUDE.md` sets for a handover (`726` was 195, `717` 174). **The trend is the defect, not this edition** — three editions running have exceeded it and each accepted it for the same reason. The lead was trimmed once; the remainder is six streams' actuals, a correction to `726`'s fold, a production sequencing warning and two filed findings | accepted — **and flagged as a trend rather than an instance**, so the next editor treats "cut it to 150" as a real task and not a formality. Cutting this one further would drop a measurement rather than a word |
| 2 | low | The handover reports that the floor *"LOOKS model-dependent by roughly 1–6k"* on two same-day samples. That is weaker evidence than anything else in the file | accepted — written into the file **as an observation, not a finding**, with "re-derive it; never carry it forward" beside it |

## Left for manual verification

Empty. There is no surface a person needs to look at: the change is one prose file, read by the next
planner chat, with no page, no card and no deployed behaviour. The next edition is itself the correction
mechanism — `CLAUDE.md` says a wrong line in a handover "is corrected by its successor rather than by a
reviewer", and Lutan has never reviewed one, which is the reasoning that put these PRs on merge-on-green.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so nothing is being signed for

Manual verification by: n/a: nothing to look at — one prose file, no page, no card, no deployed behaviour

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — **nothing in this PR reaches production.** But the handover itself carries one thing the release manager must read: **`0343` and `0344` are pending on production, and `0343` deliberately changes what a visitor sees** (the appeal override). The read-only instrument to count it exists (`node scripts/check-production.mjs appeal-override`, built by #1428) and **must be run before `0343` deploys**, because dev's answer of 0 proves nothing — dev has no appeals

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR reaches production — the pending-migration warning above is carried in the handover's own OWED section, which is where the release manager reads it
