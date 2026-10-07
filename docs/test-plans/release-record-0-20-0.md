# Feature test plan — release-record-0-20-0

## Header

| | |
|---|---|
| Feature | The `0.20.0` release record, plus two lessons from that release written into `docs/release-procedure.md`: PowerShell has no `&&`, and the main checkout must be pulled before migrations are applied |
| Backlog item | none — the record step in `docs/release-procedure.md` §8, and the procedure's own "every one of them will recur otherwise" |
| Branch / worktree | `claude/release-procedure-powershell` @ `C:\Development\Animal_Shelter_release-procedure-powershell` |
| Dev server | not started — documentation only |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-07 |
| Carries a migration? | no — `0151`–`0155` shipped in `0.20.0` itself and were applied before its deploys |
| Tested at SHA | `d7f5dddc` + this branch's commit |

The branch is named for the PowerShell note, which was asked for first; the
release record was added to it rather than opening a second worktree while the
release was still in flight. Both changes come out of `0.20.0` and neither
touches code.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a new `docs/releases/2026-10-07.md`, and three insertions into `docs/release-procedure.md`
- [x] Files/areas touched listed — `docs/releases/2026-10-07.md` (new) and `docs/release-procedure.md`. No code, no migrations, no `src/`, no `worker/`
- [x] Roles affected identified — none. Neither file is served by the app; both are read by whoever runs the next release
- [x] Anything explicitly **out of scope** written down — (a) Lutan's Contacts pass, the one release item still open; (b) the permission rules he is adding, which are his settings and not this repo's. The Pi test build and both `--drift` checks were outstanding when this plan was first written and have since been completed — the record was updated rather than left stale

### What the procedure gained, and why each was worth a permanent entry

1. **The standing rule gains `0.20.0`'s case.** It already recorded two commands handed over that could not run in Lutan's shell. A third was handed over this release — twice in one message — so it belongs beside them rather than only in the record.
2. **A trap of its own for `&&`.** `powershell.exe` is PowerShell 5.1, where `&&` is a parse error, so **neither half of a joined command runs** and the half you assume ran is the second. The entry also records the two things that *do* work and are easy to second-guess into breaking: `| tee` (hence the UTF-16 log) and `&&` **inside** a quoted `ssh` argument, which bash on the Pi parses.
3. **"Pull before you apply", in §5.** This one cost real exposure. The procedure's §5 assumes `main` is current and never says so; the migrations were applied and the deploy that should have followed immediately was refused for a six-commit-behind checkout, leaving production on old code against narrowed policies. The guard was right to refuse; the generic `Apply them first` advice printed one step earlier is what opened the window in that state.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was created from `origin/main` during the release and is behind only by what landed after; checked before the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — run, although nothing here can affect a build; `0.19.3`'s cut recorded the standing lesson that a data-only edit is not self-evidently safe, and documentation is a weaker version of the same assumption
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — and `audit` is expected **red**: the `sharp` advisory is open on `main` because #418, which clears it, is green but still unmerged. That is a known item, not this PR's doing
- [x] The record's figures were taken from tool output, not from memory — the four deploy lines came from `deploy-0.20.0.log` through `tr -d` (the log is UTF-16), the versions from `/api/version` on both hosts, the Worker version IDs from the two deploy runs
- [x] Markdown tables and fenced blocks render — checked by reading the rendered diff, the only check available for a document

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `--env production --status` reviewed — during the release: `150 applied, 5 pending` before, all five applied after
- [x] `--env production --dry-run` reviewed — all five `… ok`, read one at a time
- [ ] Applied to **dev** and recorded — n/a: no migration in this PR; dev held all five before the release
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — executed during `0.20.0`; **and the fact that its ordering went wrong is the substance of insertion 3**

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI and no code in this PR
- [ ] Data persists — n/a: the change is two documents, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | neither file | the app does not serve `docs/` | not driven — no route exists |

- [ ] Every role above tested — n/a: no code changed and no route exists
- [ ] A role that should not have access is blocked server-side — n/a: no access path in this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual is for shelter users; this is the release runbook and its record
- [ ] Translatable strings go through the translation path — n/a: internal documentation, English by design
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — none exist; the build compiles unchanged
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-procedure.md` is read by people, not imported by anything; `grep` confirms no code path reads either file
- [x] Nothing merged from `main` was broken by this branch — documentation only

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: neither a release record nor a procedure correction is a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice here. The three procedure insertions *are* the lessons, recorded where the next release manager will actually read them, which is the point of the Traps section
- [x] `README.md` still accurate — it does not describe the runbook's contents
- [ ] **Release notes.** — n/a: nobody using the shelter app would notice. This PR adds a release record and three paragraphs to an internal runbook; `unreleased` is deliberately empty immediately after a cut
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — every figure in the record is quoted from output captured during the release, and the gaps section states what was *not* run rather than inferring it was fine

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR is a record of a release that has already happened; it ships no build
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy

### On the deployed build

- [ ] Deployed to test — n/a: this PR is documentation and ships no build. The **release** reached test after this plan was drafted: `test.lannacare.org` now reports `0.20.0` at `d7f5dddc`, the same sha as production, `x-lanna-served-by: pi`
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no code in this PR
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date at runtime. The record's dates are written, not computed
- [ ] **Boundary or banding change** — n/a: none
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the refusal reasons, the deploy lines and the `6 behind / 0 ahead` guard message are verbatim
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] **The working tree is clean before deploying** — n/a: nothing deploys from this PR
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys from this PR; the line was captured for `0.20.0` and is quoted in the record
- [ ] `strip-baked-env` seen — n/a: nothing deploys from this PR; the line was captured and is quoted in the record
- [ ] Any new secret/env var — n/a: none
- [ ] **The deploy prints a release mail** — n/a: nothing deploys from this PR. `0.20.0` printed `sent 1, skipped 1` and that is quoted, along with what `sent` does not establish

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR; all five dry-ran clean during `0.20.0`
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [x] Apply plan stated — n/a in form, but the ordering rule this PR *adds* to §5 is the one that was missing when `0.20.0` applied its five

### Rollback

- [x] Rollback position stated, including what it does not cover — `git revert` of this commit; nothing is deployed, nothing is served, no database is touched. **What it does not cover:** reverting it would also remove the three procedure insertions, and those are the only durable record of why the `0.20.0` window opened — the record file alone would survive but the runbook would go back to assuming `main` is current

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `docs/release-procedure.md` §5 told the release manager to apply migrations without first pulling the main checkout, which on `0.20.0` left production running old code against narrowed policies | **fixed in this PR** (insertion 3) |
| 2 | low | The standing rule's examples did not cover PowerShell's missing `&&`, so the same handover mistake was available to make twice in one message | **fixed in this PR** (insertions 1 and 2) |
| 3 | low | `apply-migrations.mjs --drift` was refused as `[Self-Modification]` although it is a read-only comparison, after the same script had been allowed for `--status` and `--dry-run` in the same session | **cleared.** Lutan added permission rules and both checks then ran: dev `No drift`, production differing only by `0156`, which landed after the release and belongs on dev until the next one. Recorded because the misclassification is the evidence that the Pi and merge refusals were the same cause |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the record's account of who ran what matches Lutan's memory of it — this release he ran five steps rather than his usual one (both merges, the production apply, the Worker deploy, both Pi builds), and the record says so in the header and in its own section | `docs/releases/2026-10-07.md` |
| 2 | That the three procedure insertions read as intended by the person who will next follow them | `docs/release-procedure.md`, the standing rule, Traps, and §5 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's, both about wording only

Manual verification by: pending: Lutan on the record's account of who ran what, and on the three procedure insertions

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises §1 and the defects table
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass

Release manager acknowledgement: Claude (release manager session), 2026-10-07 — this PR records `0.20.0` and fixes the two procedure gaps that release exposed. Of the release's own outstanding items, the Pi test build and both `--drift` checks were closed while this plan was open and the record now carries their results; **Lutan's Contacts pass remains open** and is the one thing the release still owes
