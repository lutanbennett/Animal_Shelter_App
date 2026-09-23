# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is either ticked (it was run and passed)
or marked `n/a` with a reason.

---

## Header

| | |
|---|---|
| Feature | The test plan asks whether a shelter user would notice the change, and `check-test-plan.mjs` compares the answer with `unreleased` |
| Backlog item | `docs/backlog.md` → Completed → Architecture → "Nothing catches a user-visible PR that forgot its `unreleased` line" |
| Branch / worktree | `claude/unreleased-check` @ `C:\Development\Animal_Shelter_unreleased-check` |
| Dev server | n/a: no UI change, so no dev server was started |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | the commit that adds this file, on top of `7d66935` (gates ran on that merge of `origin/main`; the matcher fix after it was re-linted and re-run in §4) |

## 1. Scope and risk

- [x] Change in one sentence, matching the backlog item: §7 of the template gains a release-notes line (ticked, or `n/a: <reason>`), and `check-test-plan.mjs` compares it with the `unreleased` lines this PR added
- [x] Files/areas touched: `scripts/check-test-plan.mjs`, `docs/test-plan-template.md`, `docs/decisions.md`, `docs/backlog.md`, `CLAUDE.md`, `README.md`, and a comment in `src/lib/releases.ts` (no code change there). Nothing under `src/app/`, `worker/` or `supabase/`
- [ ] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — n/a: CI and docs only; no app role sees any of it
- [x] Out of scope, written down so nobody is surprised: the check stays part of the soft `test-plan` job, and making it required is Lutan's call; plans already on `main` are not back-filled with the new line; `deploy.mjs` is unchanged; whether a release line is well written is still judged by a person, not checked

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written or reason stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The feature under test is the checker. Each scenario ran the modified script against real commits in a throwaway detached worktree of `origin/main` at `84e61e0`, using `--base` pointed at that commit, with the matcher as finally committed. A minimal plan was written for each scenario. Hooks were disabled so nothing was pushed, and the worktree was removed afterwards.

- [x] Happy path works end to end: A (a `src/app/` change with a reasoned `n/a`) passes and prints the reason, and D (a tick with a real `unreleased` line added) passes
- [x] Data persists — the only state is git history. H covers a UI change made in an *earlier* commit of the branch, and the check still sees it
- [x] Each failure path exercised: B (UI change with no release line in any plan), C (ticked, but nothing added to `unreleased`), F (bare `n/a:` on the line), and G (uncommitted `src/lib/manual/` change on a local run). All four exit 1 with a message that names the fix
- [x] Empty state: E (docs-only PR, plan without the new line) passes, so older plans and docs follow-ups are not newly failed
- [x] Invalid input is rejected with a readable message: each failure says which file changed and what to write
- [x] A different checklist line that mentions both `unreleased` and `releases.ts` is not mistaken for the release line (I)
- [x] Boundary cases: a comment in `releases.ts` that mentions `unreleased` is not counted as an entry (this PR edits one, and `node scripts/check-test-plan.mjs` on this branch reports `ok` and counts nothing as added), and a missing `releases.ts` on the base counts as empty

Evidence: the script's actual output, unedited, from the final matcher (re-run after the defect below was fixed):

```
=== A app change, n/a with reason -> ok + echoed
check-test-plan: ok — docs/test-plans/scn.md
No release note, on the plan's word (touches src/app/layout.tsx, src/components/TranslationPanel.tsx, src/components/WeightChart.tsx, +20 more):
  docs/test-plans/scn.md:4 — refactor of the date helper, output identical
exit 0
=== B app change, no release line -> problem
check-test-plan: 1 problem(s)

  this PR touches src/app/layout.tsx and adds nothing to `unreleased` in src/lib/releases.ts, and no test plan has the §7 release-notes line — copy it from docs/test-plan-template.md and tick it with a line added, or say `n/a: <why nobody would notice>`


Every line is ticked, `n/a: <reason>`, or — in the pre-production gate — `deferred: <owner>`.
exit 1
=== C ticked, nothing added -> problem
check-test-plan: 1 problem(s)

  docs/test-plans/scn.md:4 — release-notes line is ticked, but `unreleased` in src/lib/releases.ts gained no line in this PR — add one written for a shelter user, or untick it and say `n/a: <why nobody would notice>`


Every line is ticked, `n/a: <reason>`, or — in the pre-production gate — `deferred: <owner>`.
exit 1
=== D ticked, line added -> ok
check-test-plan: ok — docs/test-plans/scn.md
exit 0
=== E docs only, no line -> ok
check-test-plan: ok — docs/test-plans/scn.md
exit 0
=== F worker, bare n/a -> problem
check-test-plan: 1 problem(s)

  docs/test-plans/scn.md:4 — unticked and not marked `n/a: <reason>`: "**Release notes.** `unreleased` in `src/lib/releases.ts` — n"


Every line is ticked, `n/a: <reason>`, or — in the pre-production gate — `deferred: <owner>`.
exit 1
=== G uncommitted manual change, no line (local run) -> problem
check-test-plan: 1 problem(s)

  this PR touches src/lib/manual/en.ts and adds nothing to `unreleased` in src/lib/releases.ts, and no test plan has the §7 release-notes line — copy it from docs/test-plan-template.md and tick it with a line added, or say `n/a: <why nobody would notice>`


Every line is ticked, `n/a: <reason>`, or — in the pre-production gate — `deferred: <owner>`.
exit 1
=== H app change in an earlier commit, n/a -> ok
check-test-plan: ok — docs/test-plans/scn.md
No release note, on the plan's word (touches src/app/layout.tsx):
  docs/test-plans/scn.md:4 — refactor of the date helper, output identical
exit 0
=== I docs only, another ticked line mentions unreleased + releases.ts -> ok (not the release line)
check-test-plan: ok — docs/test-plans/scn.md
exit 0
```

Why A lists 23 files: the harness set `core.autocrlf false` *after* checkout, so A's `git add -A` also committed the CRLF files as renormalized. That was a mistake in the harness, not in the checker, and `reset --hard` cleared it for B onwards. The checker correctly reported what the commit touched, which also shows the `+N more` truncation working.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | CI and docs only | n/a |
| management | n/a | CI and docs only | n/a |
| staff | n/a | CI and docs only | n/a |
| vet | n/a | CI and docs only | n/a |
| volunteer | n/a | CI and docs only | n/a |
| signed out | n/a | CI and docs only | n/a |

- [ ] Every role above tested — n/a: nothing in the app changed, so there is nothing for a role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route or RPC changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the process is documented in CLAUDE.md and the template, and the in-app manual is for shelter users
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest thing to the change still works: every existing rule was re-exercised in the scenarios above (placeholders, `n/a` reasons, signatures, `Result:`). The plan-discovery path was refactored into `porcelainPaths()`, and G confirms that uncommitted files are still found
- [ ] Shared file checked from a second page — n/a: no app file with runtime effect was touched. The `releases.ts` edit is a comment, and `/releases` renders the same data
- [x] Nothing merged from `main` during `sync` was broken: the gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (moved to Completed → Architecture)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "What counts as user-visible, and the escape hatch"
- [x] `README.md` still accurate: step 7 now mentions the check
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: CI and contributor docs only, and nothing in the app looks or behaves differently
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: every behaviour described in decisions.md and CLAUDE.md is one of scenarios A–H above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: CI tooling; nothing in the Worker bundle changes
- [ ] Deployed SHA matches the tested SHA — n/a: CI tooling; nothing in the Worker bundle changes

### On the deployed build

- [ ] Deployed to test — n/a: nothing to deploy; the check runs in GitHub Actions
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here depends on the time of day
- [ ] Boundary/banding assertions cover both edges — n/a: no threshold. The path-prefix list is covered on both sides by the scenarios: in the list (A–D, F–H) and out of it (E)
- [x] Evidence pasted is the tool's actual output, unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Fresh backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Nothing runs outside CI and nothing touches the database, so the revert is complete

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The first matcher found the release line by what it mentioned (`unreleased` + `releases.ts`), so this very plan failed on another ticked line in §4 that mentions both. That would have been a false red on any plan discussing the register | fixed: the line is now found by its bold **Release notes.** label, the template says to keep the label, and scenario I covers it |

## Left for manual verification

None. The change has no surface a person needs to look at. Its first live test is the next UI PR's CI run, and that run's output is the evidence.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: CI and docs only, and there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above (there are none)
- [ ] Checklist pasted into the PR — n/a: linked from the PR body instead, as the other plans are
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass

Release manager acknowledgement: n/a: nothing to deploy
