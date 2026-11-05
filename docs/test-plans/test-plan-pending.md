# Feature test plan — test-plan-pending

## Header

| | |
|---|---|
| Feature | `scripts/check-test-plan.mjs` stops failing on an honest `pending:` on a checklist line, and on a plan that is still being written. Template, `CLAUDE.md` and a decision file updated to match |
| Backlog item | `docs/backlog.md` → none. Lutan asked for it directly: *"Every stream is failing test plan, how can we improve this"*, then *"Yes, fix it"* |
| Branch / worktree | `claude/test-plan-pending` @ `C:\Development\Animal_Shelter_test-plan-pending` |
| Dev server | not started — `n/a: a CI script and three documents; no runtime surface` |
| PR | #TBD |
| Tested by / date | Claude (Planner) / 2026-11-05 |
| Carries a migration? | no |
| Tested at SHA | `22d768f0` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *two states that were never defects stop failing `test-plan`: an honest `pending: <what is outstanding>` on a checklist line, and a plan still being filled in.* There is no backlog item; it is Lutan's own request, and the measurement behind it is in the decision file
- [x] Files/areas touched listed — `scripts/check-test-plan.mjs`, `docs/test-plan-template.md`, `CLAUDE.md`, one new file in `docs/decisions/`, and this plan. **No `src/`, no `supabase/migrations/`, no `worker/`, no workflow file, no `.claude/skills/`**
- [x] Access affected identified — **none.** A CI script grants and denies nothing: no card, activity, policy, page, tile or control changes, and nothing in `src/` is touched. *(Stated by card rather than by role, per `CLAUDE.md`: there is no card-derived behaviour here)*
- [x] Anything explicitly **out of scope** written down — **(a) `test-plan` stays ADVISORY** (Lutan, 2026-10-20) and `continue-on-error` is still absent from the job; neither is touched, and neither should be raised again. **(b) The `card-walkthrough` red** on `claude/accountant-card-expenses` is a different job with a different cause and is left for that stream. **(c) The unticked-with-no-marker rule is deliberately NOT relaxed** — a line nobody addressed at all is a real omission, and relaxing it too would have left the check asserting almost nothing. **(d) No change to what a release manager must do**: `pending:` still ships nothing, exactly as on the signature lines

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` would be wrong: the worktree was created from `origin/main` minutes earlier, so there was nothing to merge in. The gates were run in full regardless, in the background with their output redirected to a file that was then read
- [x] `node scripts/gates.mjs` ends:

```
=== gates: typecheck exited 0 after 7s
=== gates: lint exited 0 after 174s
=== gates: test exited 0 after 36s
=== gates: build exited 0 after 64s
gates: typecheck=0 lint=0 test=0 build=0
```

**THE FIRST GATES RUN EXITED 1 ON `test`, AND THAT IS RECORDED RATHER THAN OVERWRITTEN**, because the drafted figures in this plan were about to be transcribed from the command rather than from its output file. `scripts/test-plan-template.test.mjs` matches the placeholder message's exact text to prove placeholders are reported on fields and never on the template's guidance prose; rewording that message broke the match. **The wording was restored rather than the test rewritten** — only the message's severity needed to move — and a comment at the call site now says so. The figures above are the second run, read out of its redirected file
- [ ] CI green on the PR — `pending: this PR's own run, which is itself part of the proof — the new wording should appear in the job log`

## 3. Schema and data

- [ ] Every line in this section — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — **the three real plans that went red were fed to both the old and the new checker.** `control-listing-sweep-9` (one `pending:` line, no `Result:` yet) and `video-upload-csp` (`pending: Lutan's own upload after the Worker deploy`) went **exit 1 → exit 0**; `fundraising-events-website` stayed **exit 1**, because it ticks the release-notes line with no release note, which is a real defect and the one red that should remain
- [x] Data persists — `n/a: the script writes nothing; it reads plans and exits`
- [x] Create / edit / delete all exercised — `n/a: no records`
- [x] Empty state renders sensibly — **tested: a PR with no plan at all still exits 1** with the unchanged "no completed test plan in this PR" message, which is the one presence check this change must not weaken
- [x] Invalid input is rejected with a readable message — **five wrong-plan fixtures, each asserted with `diff` to differ from its base before being run, all still exit 1:** unticked with no marker, bare `n/a:`, bare `pending:`, `deferred:` outside section 8, and `Result: fail`
- [x] Boundary cases checked — a bare `pending:` with no detail is the boundary between the new state and a sloppy one, and it **fails** with *"say what is outstanding and who it waits on"*. `isPlaceholder()` is matched on shape (`<…>`) rather than on the known names, so a placeholder from a future template also reads as unwritten rather than wrong
- [x] **All eight cases are pinned as a test** — `scripts/check-test-plan-states.test.mjs`, 8 pass / 0 fail: the two that now pass, the five that still fail, and a baseline asserting the complete fixture passes, **so the five failures cannot pass for an unrelated reason**. Its minimal plan is written in the test rather than copied from the template, so a template edit cannot change what it asserts

### Access matrix

**Written by card, not by role** (`CLAUDE.md`: all analysis is by card, because roles are a transient
grouping of cards and every assignment will be rebuilt).

| Card | Can reach | Expected | Result |
|---|---|---|---|
| *(none)* | nothing changes | a CI script and three developer documents: no card opens them, no card is read by them, and no page, tile, control, activity or policy is touched | as expected — no card-derived behaviour exists to test |

- [x] Every card above tested — vacuously: nothing under `src/` is in the diff
- [ ] A card that should not have access is blocked server-side — `n/a: no server surface in this PR`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated — `n/a: the manual is for shelter users; this is a CI check developers read`
- [ ] Translatable strings go through the translation path — `n/a: the script's output is developer-facing English in a CI log`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — **the four gates were run in full rather than skipped as a documentation change**, because `scripts/` is in the diff. All four exited 0 at the tested SHA. `node --check scripts/check-test-plan.mjs` parses
- [x] Any shared file touched checked from a second, unrelated place — **`CLAUDE.md` and `docs/test-plan-template.md` are read by every stream, so both were checked against the script rather than written from memory:** the template's four states now match the four the script accepts, and `CLAUDE.md`'s list of what still goes red matches the five fixtures above one for one. **A green plan cannot newly go red:** every changed branch sits after the `- [x]` early return or after the `n/a:` branch, so only lines that were already failing can reach it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is on top of `origin/main`

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — `n/a: no backlog item; this was asked for directly in chat`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-05-test-plan-pending-and-unfinished.md`, which carries the measurement (four of the last nine red runs), the asymmetry that caused half of it, the before/after table, the five fixtures, and **the first fixture attempt that silently proved nothing**, recorded rather than quietly fixed
- [x] `README.md` still accurate — it says nothing about this check
- [ ] **Release notes.** — `n/a: nobody at the shelter would notice. A CI check's exit code touches no page, no card and no data, and the releases file is not in this diff`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the "four of the last nine red runs" count is `gh run list` over pull-request runs with each run's failing job names read from `gh run view --json jobs`; every cause is quoted from the run's own `--log-failed` output; the three before/after exit codes are both checkers run against the real plan files taken from the exact commits whose runs went red, with the old script read out of `origin/main`; and each of the five wrong-plan fixtures asserts `diff` against its base before being run, after a first attempt whose anchors did not match and which therefore "passed" five identical files

## 8. Pre-production gate

- [ ] Every line in this section — `n/a: nothing in this PR is deployed. No code under src/, no schema, no Worker change, no secret, no env var; the artefact is a CI script and three documents`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **high** | **The check punished the honest plan.** `pending:` passed on a signature line and failed on a checklist line, so a stream waiting on a real person either went red for saying so or wrote `n/a:` for something that was not n/a — the exact habit `deferred:` exists to prevent | **Fixed.** `pending: <detail>` is accepted on a checklist line and printed as awaiting a person; a bare `pending:` still fails |
| 2 | medium | **Ordinary working churn reported as failure.** A plan is committed early and filled in as the work proceeds, so CI saw placeholders and a missing `Result:` on every push in between | **Fixed.** Reported as *still being written* and passes, the same decision as 2026-09-24 for an unsigned plan |
| 3 | medium | **My first set of wrong-plan fixtures proved nothing and looked like a pass.** The `sed` anchors did not match the real plan's wording, so all five fixtures were byte-identical to the base and all five exited 0 — indistinguishable from the intended result | **Caught and fixed before it was recorded.** The rebuilt fixtures assert `diff` against the base before running. Written into the decision file rather than quietly corrected, because a false proof is worse than no proof |
| 4 | low | `fundraising-events-website` still exits 1 | **Correct, and not a defect in this change.** It ticks the release-notes line with no release note. Its release-notes judgement in my test was made against this branch's diff rather than its own PR's, because it was run as a fixture — noted in the decision file so nobody reads it as a measurement of that PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the next few streams' `test-plan` checks are green while their plans are mid-flight, and that any red that does appear names something genuinely wrong | The three batch-3 PRs, as they open |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Planner)  Date: 2026-11-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty, so this waits on whoever watches the next streams CI runs. **This line is itself the change working:** the checker caught it unticked and unmarked, which is still a failure, and `pending:` is the honest state that now passes

Manual verification by: pending: the next streams' CI runs will show it, and Lutan raised the original complaint

### Result

- [x] Open defects are either fixed or explicitly accepted above — 1 and 2 fixed, 3 caught and recorded, 4 is correct behaviour
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing here reaches production`

Result: pass

Release manager acknowledgement: n/a: nothing in this PR is deployed
