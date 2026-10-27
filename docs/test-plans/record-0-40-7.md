# Feature test plan — record `0.40.7` and the handover

## Header

| | |
|---|---|
| Feature | The `0.40.7` release record (`docs/releases/2026-10-27-0-40-7.md`) and the release handover's `0.40.7` edition |
| Backlog item | `docs/backlog.md` → n/a: the record and the handover are steps 8 and 4 of `docs/release-procedure.md`, not backlog items |
| Branch / worktree | `claude/record-0-40-7` @ `C:\Development\Animal_Shelter_cut-release-0-40-7` — **the cut's own worktree, reused after its PR merged**, which is paperwork rule 2. The branch was made with `git checkout -b claude/record-0-40-7 origin/main`, not `git reset --hard`, which the classifier refuses |
| Dev server | n/a: two markdown files; nothing runs |
| PR | #998 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-27 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit, parent `fe1ed99e` (the deployed release SHA) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the release that already shipped is written down, and the handover is replaced with its `0.40.7` edition
- [x] Files/areas touched listed — `docs/releases/2026-10-27-0-40-7.md` (new), `docs/release-handover.md` (replaced), `docs/test-plans/record-0-40-7.md` (this file). No code, no migration, no `worker/`
- [x] Roles affected identified — none. Documents under `docs/` are not served by the app and no role can reach them
- [x] Anything explicitly **out of scope** written down — **this PR is not a gate.** `0.40.7` was deployed and verified before it existed; it describes a release that has already shipped. The nine items awaiting Lutan belong to him and are listed, not ticked

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `fe1ed99e`, the deployed release SHA, and nothing has merged since. `git status -sb` read no ahead/behind
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: **a documents-only PR skips the heavy CI jobs by design** (`scripts/check-docs-only.mjs`, paperwork rule 1), and three markdown files cannot change a typecheck, a lint, a test or a build. Running a four-minute build to prove that is the waste that rule exists to stop. The release's own gates were run on the cut and are recorded in `docs/test-plans/cut-release-0-40-7.md`
- [x] CI green on the PR (runs the same checks) — filled in from the PR after it was opened; the docs-only gate is expected to skip `check`, `public-views` and the rest, with `test-plan` and `changes` running
- [ ] `node scripts/check-release-guards.mjs` — n/a: no release data changes in this PR. It was run on the cut, exit 0, 16 assertions
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit **0**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The release's four, `0270`–`0273`, are applied and recorded; the next free number is `0274`
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; nothing reads a markdown file
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: there is no path. These are documents read by people and by the next release manager's session
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — the boundary that matters for a handover is its **length ceiling**: paperwork rule 4 says aim for about 100 lines and treat 150 as the limit. Measured, not estimated: **129 lines**

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | these files | no route serves `docs/`; they are readable only in the repository, which is public | **as expected** — no route added, and `git grep` finds no reader of `docs/releases/` or `docs/release-handover.md` in `src/` |

- [ ] Every role above tested — n/a: no role can reach a file the app does not serve
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: the record and the handover describe a release to the people who run releases, not a feature for shelter users
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI
- [x] **The repository is public, and these files were checked for anything that should not be in it** — no personal data, no donor or resident names, no tokens. The one thing deliberately **not** written down is the dev sign-in snippet used during the cut, which holds a live session token

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check, but the nearest *readers* are the next release manager and `/plan-day`, and both read these files by path. Both paths are unchanged: the record follows the dated-and-versioned naming convention every other file in `docs/releases/` uses and the handover is replaced in place
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is the one shared file, and it is read whole rather than by section, so replacing it cannot leave a stale fragment. The previous edition is not lost: it is in git history and the release it described has its own record
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item. Two items it *touches* are deliberately left alone: the 15-minute cron and the `audit`-skips item are both already filed, and the record says so rather than re-filing them
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the record makes no design choice; it reports. The judgements of this release live in their own PRs' decision files
- [x] `README.md` still accurate — unchanged by this PR and re-read: it quotes no version number
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover. `unreleased` is empty and correctly so: it was emptied by the cut hours ago, and this PR adds nothing a shelter user could see
- [x] Commit messages say why, not just what — the commit records what the record establishes that the headers alone would not, and why two carried items were closed rather than passed on
- [x] **Claims in these documents were measured, not reasoned.** Three that could each have been asserted instead: the OpenNext copy errors were settled by listing the built output rather than by six releases of precedent; the Cloudflare timeouts were diagnosed by testing and **disproving** an IPv6 hypothesis rather than by blaming the network; and the cron item was confirmed present on the backlog by grepping for it rather than taken on trust

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deployed SHA, `fe1ed99e`, is this branch's parent and is recorded in the record's header
- [x] Deployed SHA matches the tested SHA — for the **release**, superseded by the code-identity diff, which was empty (recorded). For **this PR**, nothing is deployed: documents do not ship

### On the deployed build

- [ ] Deployed to test — n/a: documents are not deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents are not deployed. The release's own smoke test **is** this record
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today". The dates are literals, and the one time-of-day claim (the cron's next fire) is written as a measurement with its clock reading beside it
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band or cutoff
- [x] **Evidence pasted into these documents is the tool's actual output, unedited** — the version ids, counts and `No drift` lines are copied from `wrangler deployments list`, `apply-migrations.mjs` and `check-production.mjs` as printed
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR is served or cached. It was done for the release and recorded as vacuous while `PUBLIC_SITE=locked`

### Deploy safety

- [ ] The production deploy's Supabase project line read — n/a: this PR deploys nothing. It was read for the release (`dbkodyyxxhtygxcxmfcu` at `fe1ed99e`) and recorded
- [ ] The `strip-baked-env` line seen in the deploy output — n/a: this PR deploys nothing. It was read for the release (**14**, both environments) and recorded
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: three markdown files

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No, and it contains neither. The release's four migrations went on **before either deploy**, which the record states with the consumer warnings that make the ordering mandatory rather than tidy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes a record of a release that still shipped, which is why it is bookkeeping rather than a gate. It cannot affect production: nothing here is deployed, and the release it describes was live and verified before the branch existed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | The record names two items it did **not** file, because both are already on the backlog: the `audit`-skips-the-cut item and the stopped 15-minute cron | **Accepted and deliberate.** Both were confirmed present by grepping `docs/backlog.md` rather than assumed. Re-filing either would be the duplicate-note fault `CLAUDE.md` warns about |
| 2 | none | The handover **closes** two items previous editions carried, rather than passing them on | **Accepted and deliberate**, and this is the point of the exercise: a carried item with no command attached is a rumour. Both were closed by measurement — the OpenNext output was listed, and `0272` deleted the archived-roles fault outright |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in **this PR** needs a person. The nine items the **release** leaves for Lutan are listed in the record and are not repeated here, because copying another plan's outstanding items gives them a second home that nothing closes | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: there is nothing to look at — this PR is three markdown files, no UI, no route and no behaviour. The release's own nine items belong to the record and to Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
