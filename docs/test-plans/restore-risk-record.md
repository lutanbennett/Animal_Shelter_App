# Feature test plan

## Header

| | |
|---|---|
| Feature | Settle the carried claim that the restore drill has never been exercised: it has, three times. Correct it in five documents and record Lutan's judgement that production restore risk is negligible |
| Backlog item | `docs/backlog.md` → none, and none is opened. All three restore items (`#q2vp7`, `#xa1jk`, `#rg7pv`) were already ticked; this PR corrects documents that had not caught up. Recorded in `docs/decisions/2026-11-09-restore-risk-settled.md` instead |
| Branch / worktree | `claude/restore-risk-record` @ `C:\Development\Animal_Shelter_restore-risk-record` |
| Dev server | not started — see §4 |
| PR | [#1432](https://github.com/lutanbennett/Animal_Shelter_App/pull/1432) |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | `9131613a` — the gates ran against this commit, and nothing but this plan changed afterwards |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — Lutan said *"We have done a restore already"*, then *"Given we restored the production backup into UAT I think risk on production at this stage is negligible"*, then *"Yes, write it up"*
- [x] Files/areas touched listed — `docs/release-handover.md`, `docs/releases/2026-11-08-0-43-6.md`, `docs/decisions/2026-10-19-restore-drill-real-supabase.md`, `README.md`, `docs/test-plan-template.md`, and a new `docs/decisions/2026-11-09-restore-risk-settled.md`. No `src/`, no `scripts/`, no `worker/`, no `supabase/migrations/`
- [x] Cards affected identified — none. No permission, page or control is touched, and nothing reads any of these files at runtime (`grep -rl release-handover src/ scripts/ worker/` finds nothing). Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — **(a) `docs/release-handover.md` is over its own ceiling.** `docs/release-procedure.md` rule 4 says *"aim for about 100 lines and treat 150 as the limit"*; the file arrived at **160** and this PR makes it **163**. Not trimmed here: the surplus is other sessions' dated "FIXED / SUPERSEDED" paragraphs, and `2026-11-09-handover-stale-undone-lines.md` rule 2 says deleting a wrong line loses the reason somebody believed it. Dropping them is the next edition writer's call at the next cut, not a side effect of this correction. **Found, not fixed. (b)** The three backlog items are left ticked exactly as they were. **(c)** No change to `scripts/backup.mjs` to cover the facility-map bucket. That gap is real and is named in the decision file, but closing it is a code change, not a correction

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly; see the block below
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — run unpiped, so each exit code is the gate's own and not a pager's:

```
=== gates: typecheck exited 0 after 257s
=== gates: lint exited 0 after 856s
=== gates: test exited 0 after 142s
=== gates: build exited 0 after 515s
gates: typecheck=0 lint=0 test=0 build=0
```

The timings are long for this repository because six `worktree.mjs done` runs were deleting
`node_modules` trees on the same machine at the time. They are pass/fail evidence here, not a
measurement of anything, so the load does not matter — unlike a Lighthouse run, which `CLAUDE.md`
says must never be taken while another stream is building.
- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change — `n/a: no migration in this PR`
- [ ] Constraints and defaults exercised against real rows — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: six markdown documents, no code path`
- [ ] Data persists — `n/a: no data`
- [ ] Create / edit / delete all exercised — `n/a: no UI`
- [ ] Empty state renders sensibly — `n/a: no UI`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

`n/a: no card, page or control is affected. All six files are repository documentation and none is served by the app.`

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| — | — | — | `n/a: documentation only` |

- [ ] Every login above tested — `n/a: no surface to test, per the note above`
- [ ] A login that should not have access is blocked server-side — `n/a: no surface`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: nothing in src/ touched`
- [ ] Manual updated — `n/a: nothing a shelter user sees changed; these are a release manager's and a developer's documents`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: no rendered surface`

## 6. Regression

- [x] The pages nearest the change still work — not pages but claims, and every one was measured before it was written. The three restores read in `docs/backlog.md` (`#q2vp7`, `#xa1jk`, `#rg7pv`, all `[x]`) and in their own decision files. The privilege figures (923 of 923, 163 tables read) read in `2026-11-09-restore-puts-back-the-backups-privileges.md`. **The storage claim measured, not reasoned:** `grep -rn "storage.from(" src/ worker/` returns 4 hits in one file, `src/lib/facility-map/plan-store.ts`, and `backup.mjs` has no storage or bucket handling, so the bucket really is outside the backup. **The backup cadence read from the live schedule:** `scripts/pi/setup.sh` line 151, `0 3 * * *` with `--keep-days 14` — not from `backup-schedule.ps1`, whose own first line says it is **not** the live schedule. The eight parts of the rewiring read in `docs/uat-finalisation.md`; `deploy.mjs`'s refusal to push a dev-only Supabase secret to UAT read at `scripts/deploy.mjs` lines 146–152
- [x] Any shared file touched checked from a second, unrelated page — `docs/test-plan-template.md` is the one file here that a script reads. `scripts/test-plan-template.test.mjs` copies it and asserts `check-test-plan.mjs` flags placeholders only on fields and never on guidance prose. The edited sentence contains no `<…>` placeholder and sits inside a checklist line that already existed, so the test's subject is unchanged — confirmed by the `test` gate in §2 rather than by reading alone, which is the weaker check the template warns about
- [x] Nothing merged from `main` during `sync` was broken by this branch — see §2's block

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: no backlog item, per the header; the three this concerns were already ticked and are left as they are`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-09-restore-risk-settled.md`. What it records beyond the correction: **why the line survived yesterday's correction pass**, which deliberately left it after weighing `#rg7pv` alone and not `#xa1jk`. The rule it adds is that a *"still never"* line is re-measured against every item that could have done the job, not only the one that merged that morning
- [x] `README.md` still accurate — it is one of the files corrected. Its *"What the drill proved"* paragraph was already right; its **Gap** paragraph overstated the exposure and is narrowed in place, with the original wording quoted so the reason it said that is not lost
- [ ] **Release notes.** — `n/a: nobody outside the release process and the repository reads these files. No shelter user could notice this change, and the PR touches no src/, components/, manual/, i18n/ or worker/ path`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the whole risk of this PR, since it is nothing but claims about state. Each is sourced in §6. Two places where measuring changed the answer rather than confirming it: the backup cadence, and the storage gap

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: production release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test — `n/a: changes no deployable artifact; the Worker and Pi builds do not include docs/ or README.md`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: nothing deployed changes`
- [ ] Timezone-sensitive behaviour proved — `n/a: no date or time logic`
- [ ] Boundary or banding change covers both edges — `n/a: no boundary, threshold or band`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in §2 is that run's own closing lines, per-gate timings included
- [ ] Public pages re-checked after a cache purge — `n/a: no public page changes`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `n/a: this PR triggers no deploy`
- [ ] `strip-baked-env` seen in the deploy output — `n/a: this PR triggers no deploy`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: no new secret or env var`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — `n/a: no migration`
- [ ] `--env production --dry-run` run and clean — `n/a: no migration`
- [ ] Production backup fresh for a destructive migration — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR's merge restores the previous text of all five files and removes the new decision file, completely: no schema, no deployed artifact, no setting, nothing to undo elsewhere. What a revert would also restore is the false claim, in five places, so a reverter should re-measure the three backlog items rather than trust the restored text — which is the point of the change

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **The claim was in five places, not one.** Beyond the handover and the release record it had been copied into `docs/test-plan-template.md` §8 as *"Note the README restore recipe has never been exercised"*, so every test plan written from the template since 2026-10-19 carried it to a reader | fixed — corrected in all five, in place and dated |
| 2 | low | Yesterday's correction pass weighed only the item that had merged that morning (`#rg7pv`) and so left a line that `#xa1jk` had settled three weeks earlier. Its rule was right; its search was one item wide | fixed as a rule in the new decision file: re-measure against every item that could have done the job |
| 3 | low | **I repeated the false line to Lutan myself**, having read the handover and relayed it rather than checked it — the exact failure the handover's own closing line warns about, pointing the other way | fixed by this PR; recorded because the cost was his time, twice |
| 4 | low | `docs/release-handover.md` stands at 163 lines against a stated limit of 150 | accepted — §1's out-of-scope note gives the reason; it is the next edition writer's trim, not this correction's |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | Every claim written was measured from the repository and the live records, and each measurement is named in §6. There is no screen, wording or device for a person to look at separately from reading the corrected files |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: six documentation files with no surface a person could look at; every claim in them was verified from the live state and listed in §6

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — the handover is the release manager's own document, corrected in place and dated, so the next cut reads it rather than being told about it

Result: pass with accepted defects

Release manager acknowledgement: n/a: this PR carries nothing to deploy and corrects the release manager's own handover
