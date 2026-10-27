# Feature test plan — record Lutan's decision about test in the handover

## Header

| | |
|---|---|
| Feature | The release handover said test's adapter upgrade "needs a decision". It is decided, so the handover is corrected to say so |
| Backlog item | `docs/backlog.md` → the cron item, which carries the same decision. **Ticked here? No** — production is fixed, test is not, so the item stays open. The decision was recorded on the `backlog` branch, where backlog edits belong |
| Branch / worktree | `claude/handover-test-decision` @ `C:\Development\Animal_Shelter_calendar-loop-fix` — **a free leftover reused**, paperwork rule 2. Branch made with `git checkout -b … origin/main`, not `git reset --hard` |
| Dev server | n/a: one markdown file; nothing runs |
| PR | #1012 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-28 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit, parent `512c51c3` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two passages in `docs/release-handover.md` that present test's upgrade as an open question are rewritten to record Lutan's answer: it rides the next release's ordinary test-Worker deploy
- [x] Files/areas touched listed — `docs/release-handover.md` and `docs/test-plans/handover-test-decision.md`. No code, no migration
- [x] Roles affected identified — none. `docs/` is not served by the app
- [x] Anything explicitly **out of scope** written down — **test is not deployed by this PR**, and nothing about the running system changes. This is a document that was going to make someone ask a settled question again

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch created from `origin/main` at `512c51c3` minutes before the edit; `git status -sb` read no ahead/behind
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: a documents-only PR skips the heavy CI jobs by design (paperwork rule 1), and one markdown file cannot change a typecheck, lint, test or build
- [x] CI green on the PR (runs the same checks) — filled in from the PR; the docs-only gate leaves `changes` and `test-plan`
- [ ] `node scripts/check-release-guards.mjs` — n/a: no release data changes in this PR
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit **0**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no path; one document
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no surface
- [x] Empty state renders sensibly — the relevant "empty state" is the open question this PR removes: after the edit, **neither passage asks the reader to decide anything**, which was checked by reading both in place rather than by trusting the diff
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — the handover's length ceiling (about 100 lines, 150 the limit) still holds after the edit: **142 lines** — under the 150 limit, but above the ~100 target, so the next edition should shorten rather than add

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | this file | no route serves `docs/` | **as expected** — no route added |

- [ ] Every role above tested — n/a: no role can reach a file the app does not serve
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: the handover is read by whoever runs the next release, not by shelter users
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI
- [x] **The repository is public and the change was checked for anything that should not be in it** — it quotes one sentence Lutan said about deployment scheduling; no personal data, no credentials

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; the reader is the next release manager, and **both edited passages were re-read in place** to confirm they still say what test's state is, not only what was decided. A reader who skips the decision must still learn that test is behind with a dead cron
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is the shared file. The same decision is recorded on the `backlog` branch, and the two were written to agree: both say it rides the next release's ordinary deploy, and both say the item is ticked only once `calendar-cron --env test` reads `verdict: healthy`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a as a tick, deliberately: the cron item stays **open** because test is still on the old adapter. What changed is its title, which now records the decision instead of implying work to arrange — done on the `backlog` branch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: recording an answer the user gave is not a design choice. It is the backlog-answer rule in `CLAUDE.md` being followed
- [x] `README.md` still accurate — unchanged and re-read; it says nothing about test's adapter
- [ ] **Release notes.** — n/a: nobody using the app would notice a change to a handover document
- [x] Commit messages say why, not just what — the commit names the specific failure this prevents: a settled question being put to Lutan a third time
- [x] **Claims in this document were measured, not reasoned** — the line count was read with `wc -l` rather than estimated, and both edited passages were located by `grep` and read in place rather than assumed from memory of writing them

## 8. Pre-production gate

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — parent `512c51c3`; nothing is deployed by this PR
- [ ] Deployed SHA matches the tested SHA — n/a: documents are not deployed
- [ ] Deployed to test — n/a: documents are not deployed. **The irony is noted and is not a gap**: this PR records a decision *about* deploying test, and does not deploy it
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents are not deployed
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today"; the one date is the literal `2026-10-28`
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or cutoff
- [x] **Evidence pasted into this document is the tool's actual output, unedited** — the line count and the grep hits
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR is served or cached
- [ ] The production deploy's Supabase project line read — n/a: this PR deploys nothing
- [ ] The `strip-baked-env` line seen in the deploy output — n/a: this PR deploys nothing
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: one markdown file
- [x] **Does this PR contain both a migration and code that reads it?** No, and it contains neither
- [x] Rollback position stated, **including what it does not cover** — reverting restores a document that asks a question Lutan has already answered. It cannot affect production

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **The handover shipped hours earlier presenting a question to Lutan that he then answered**, and would have put it to him again at the next release | **Fixed here**, which is the whole PR. This is the `assistant-retention` fault in miniature — an item answered and left reading as open was re-raised with him three times over nine days |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. One document, no UI, no behaviour | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: one markdown file, no UI, no route and no behaviour to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
