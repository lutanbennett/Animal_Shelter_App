# Test plan — planner-handover-105

| | |
|---|---|
| Feature | `docs/planner-handover.md` rewritten at the nine-workstream counter, after #566–#574 |
| Backlog item | none — the handover rewrite is a standing obligation of `.claude/skills/plan-day/SKILL.md` step 8, not a backlog item |
| Branch / worktree | `claude/planner-handover-105` @ `C:\Development\Animal_Shelter_planner-handover-105` |
| Dev server | not started — no runtime surface |
| PR | #575 |
| Tested by / date | Claude (Daily Planner session), 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | `6fc23f2b` |

## 1. Scope and risk

- [x] Change is described in one sentence: one file, `docs/planner-handover.md`, rewritten wholesale for the next `/plan-day` chat, carrying eight token actuals, two band corrections, and the duplicate-`0191` planning error with the rule it gives
- [x] Files touched: `docs/planner-handover.md` and this plan. Nothing else
- [x] Roles affected: none. The file is read by Claude when planning; it is not served to any user, signed-in or public
- [x] Out of scope, written down: no change to `CLAUDE.md`, to `.claude/skills/plan-day/SKILL.md`, to `docs/backlog.md` (the new duplicate-`0191` item went on the `backlog` branch as `a1cba221`, which is where new items belong) or to `.plan-day.md` (gitignored local state)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran; reported `Already up to date` (the branch was cut from an `origin/main` that already had #574) and pushed the branch
- [x] `node scripts/gates.mjs` — pasted below, unedited
- [ ] CI green on the PR. `n/a: not yet — the PR does not exist at this commit`

```
=== gates: build exited 0 after 315s

gates: typecheck=0 lint=0 test=0 build=0
```

Four gates, not three: #573 added `test` (`npm test`, which runs `node --test` over the eight new
`*.test.mjs` files). This run is therefore also evidence that #573 did not break the pre-push check
every other stream relies on.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number one above the highest on `main` — `n/a: no migration. 0192 is the next free number and stays free`
- [ ] `--status` reviewed — `n/a: no migration, though --status was run to source the handover's "192 applied, 0 pending, no drift" line`
- [ ] `--dry-run` reviewed — `n/a: no migration in this PR. A dry run WAS run earlier in the planning session, against 0190 from the main checkout, and is reported in the handover`
- [ ] Applied to dev — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly — `n/a: no migration; no row or column is touched`
- [ ] Constraints exercised against real rows — `n/a: no migration`
- [ ] Down-migration written — `n/a: no migration`
- [ ] Production apply plan stated — `n/a: nothing to apply`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: no runtime surface; the PR is one documentation file`
- [ ] Data persists — `n/a: no data`
- [ ] Create / edit / delete exercised — `n/a: no CRUD`
- [ ] Empty state renders sensibly — `n/a: nothing renders`
- [ ] Invalid input rejected readably — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no values`

### Role access matrix

- [ ] Every role tested — `n/a: the file is repo content read by Claude, not served to any role`
- [ ] A role that should not have access is blocked server-side — `n/a: not reachable by URL`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: the manual documents the app for shelter staff; this is an internal planning note they never see`
- [ ] Translatable strings — `n/a: no user-facing strings`
- [ ] Mobile viewport 375px — `n/a: nothing renders`
- [ ] Browser console clean — `n/a: nothing renders`
- [ ] Network clean — `n/a: no requests`

## 6. Regression

- [x] The pages nearest the change still work: none exist; `gates.mjs` builds the whole app with the new file present and reports `build=0`
- [ ] Any shared file touched, checked from a second page by loading it — `n/a: no shared code file touched; the only file changed is a markdown document nothing imports`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`: the branch was cut from an `origin/main` that already carried #566–#574, so there was nothing to merge. The gates run above therefore ran *with* #573's new `npm test` gate present, which is the thing worth knowing

## 7. Documentation

- [x] Backlog item ticked — **no backlog item exists** for the handover itself. The rewrite is a standing obligation of the plan-day skill's step 8. One *new* item was raised by this work and filed on the `backlog` branch (`a1cba221`, the duplicate `0191`), which is where new items go — never in a PR
- [x] Non-obvious design choices — **the handover IS the record.** No separate decision file: a `docs/decisions/` entry about rewriting the handover would duplicate the thing it describes. The decisions this PR *reports* were each filed by their own stream (`2026-10-12-bills-schema.md`, `2026-10-12-daily-backup-prune-by-age.md`, `2026-10-12-photo-first-tagging.md`, `2026-10-12-record-attachment-bills.md`, `2026-10-12-donation-channels.md`, `2026-10-12-stock-receipts-update-policy.md` and others)
- [x] `README.md` still accurate — it does not describe the handover file
- [ ] **Release notes.** `n/a: an internal note for whoever plans the next day's work. Nothing about the app changes and no shelter user can see it`
- [x] Commit messages say why, not just what — the commit lists what only the planning chat knew and would have lost
- [x] **Claims were measured, not reasoned.** Every figure was read from a tool, not recalled: the eight actuals from `get_usage` called in the turn each PR merged; model and effort from `get_session` rather than from what was recommended; `192 applied, 0 pending, no drift` from `apply-migrations.mjs --status`; `92` open items from an `awk` count above `## Completed`; the merged PR numbers and states from `gh pr list`; the two `0191` filenames from `ls supabase/migrations/`; each half-done stream's contents from `gh pr view --json files`; `1,465` lines from `wc -l`; the four `record_attachment` owner arms from a `grep -oE` over the merged `0190`; the eight `*.test.mjs` from `find`
- [x] **A claim the planner nearly got wrong is recorded as such.** `node --test` appears nowhere in `gates.mjs` or `ci.yml`, which looked like #573 having missed half its brief. It is wired as `npm test`, confirmed in `package.json`. The handover records the trap rather than the false finding

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — `n/a: no dates or clocks in this change; the dates in the text are prose`
- [ ] Boundary or banding assertions cover both edges — `n/a: no threshold or band in code. The token bands discussed in the file are planning guidance, not logic`
- [ ] Evidence pasted is the tool's actual output, unedited — deferred: production release manager
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] Supabase project ref line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` line seen in deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — `n/a: this PR adds no secret or env var`

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — `n/a: no migration in this PR`
- [ ] `--env production --dry-run` run and clean — `n/a: no migration in this PR`
- [ ] Backup exists and is fresh — `n/a: no migration in this PR. Worth the release manager knowing: backups are still WEEKLY until the Pi crontab step is done, and the handover says so`
- [ ] Apply plan stated — `n/a: nothing to apply`

### Rollback

- [x] Rollback position stated, including what it does not cover: reverting this commit restores the batch-96 handover. Nothing else is affected — no code, schema or deployed artifact changed, and no deployed build carries this file. **What it does not cover:** the facts the file records would be lost with it, and the chat that knew them will be gone, so a revert is a worse outcome than an edit

## Defects found

**One, and it is not in this PR's diff — it is in `main`, and it was the planner's error.**

Two migration files are both numbered `0191`: `0191_donation_channels.sql` (#572) and
`0191_stock_receipts_update_policy.sql` (#574). Both merged, both applied to dev, dev reports
`192 applied, 0 pending` with no drift. **Nothing is broken** — `schema_migrations` records each by
its own filename and they touch unrelated objects, so the order between them does not matter — and
**applied files are never edited, so renaming is not the fix.** Accepted, recorded in the handover
with the planning rule that prevents a repeat (a schema-then-app stream holds the migration slot
until its *app* PR merges), and filed on the `backlog` branch as `a1cba221` so the production
release manager inherits it rather than meeting it mid-release.

## Left for manual verification

| what | who | why it needs a person |
|---|---|---|
| nothing in this PR | — | There is no screen, no route and no deployed artifact. The file's usefulness is tested by the next `/plan-day` run using it, which is not something anyone can inspect now |
| the duplicate `0191`, at the next production apply | production release manager | Not this PR's change, and not a code defect — someone applying migrations to production should know two files sit at `0191` before a runbook line names one. The backlog item carries it |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-12

### Manual verification

- [x] The manual list above has nothing for a person to look at **in this PR**; the second row is a hand-off to the release manager about `main`, not about this diff

Manual verification by: n/a: no screen, route or deployed artifact — an internal planning note, with nothing for a person to inspect

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — two things for them: the duplicate `0191` above, and that **backups are still weekly** until the Pi crontab step is done. **No release cut is due: `unreleased` carries one line**

Result: pass with accepted defects
