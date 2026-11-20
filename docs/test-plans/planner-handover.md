# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `768` |
| Backlog item | n/a: a handover closes no backlog item |
| Branch / worktree | `claude/planner-handover` @ `C:\Development\Animal_Shelter_planner-handover`, port `3003` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (planner session) / 2026-11-20 |
| Carries a migration? | No |
| Tested at SHA | this commit |

## 1. Scope and risk

- [x] Change is described in one sentence — `docs/planner-handover.md` is replaced with edition `768`, a delta against `767`, covering the eight streams merged since it and the two releases shipped the same day
- [x] Files/areas touched — `docs/planner-handover.md` and this plan. **No code**
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: one markdown file read by one chat. Nothing is served, imported or rendered; no card, route or gate changes
- [x] Out of scope — the ninth stream's figure (`platform-drive-folder` is still running) and the skill-file edits the handover lists as owed
- [x] **It outranks nothing, and says so in its own opening lines.** A wrong line is corrected by its successor, which is why this PR merges on green without a review round-trip

### Why `768` exists on the same day as `767`

`767` was written after `0.47.6` in the morning. **Eight more streams merged and two more releases
shipped afterwards**, so by evening its headline state (`0.47.6`, UAT owing a deploy, `#hostx` open) was
wrong in every particular. **`768` says plainly that both were written on 2026-11-20 and which to read.**

### Written one stream early, deliberately

The count reaches nine when `platform-drive-folder` merges. **Lutan asked for it now**, while the day's
context existed, so **the ninth stream is written in as still running** with a note that its figure is
read next morning from its PR. **That is safe and it is stated as the reason:** a `stream-usage:` comment
outlives the branch and the worktree, proven on 2026-11-11 and again today.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was cut from `origin/main` at `33071547c`, which is #1780's merge, so it already carries both release records and the new release handover
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: build exited 0 after 153s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] **The four exit codes come from the summary line, which carries all four.** The run was backgrounded and its output tailed, so the three per-gate lines above `build` scrolled off; `gates: typecheck=0 lint=0 test=0 build=0` is `gates.mjs`'s own final assertion and is the line CI's equivalent is read from. **Said plainly rather than reconstructing lines that were not captured**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] `node scripts/check-release-guards.mjs` — n/a: it guards a release cut's data, and this PR changes none
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] **`audit` will show `skipped`**, because this PR changes no `package.json`. **Skipped is not a pass** — it means nothing was checked, on purpose

## 3. Schema and data

- [ ] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration
- [x] **Every figure in the handover was read, not recalled** — all eight `stream-usage:` comments read from their merged PRs with `gh pr view <n> --json comments`; the floors computed from those two fields; the migration and version figures from the `0.47.8` record, which measured them against the live databases and hosts

## 4. Functional checks

- [x] **Every claim about today traces to something read in this session** — the stale-Worker fault and its `/icon-192.png` probe (measured, 307 against 200), the two cuts, `#hostx` closing on Lutan's pressed sign-in, option A for the Drive scope, both release-email answers
- [x] **The one new finding is quoted from the stream that found it** — #1773's usage comment, in its own words, is the source of *"one session owns a branch"*. It is attributed, not paraphrased into a planner observation
- [x] **`414,500` is reported as a sentinel, not a cost, and no cause is offered.** It appeared twice, in `767`'s table and in #1774, both `compacted=yes` on opus-5/medium. **`767` watched three explanations of the floor die inside a day, so the instruction it carries forward is to record and stop**
- [x] **Nothing is claimed about the ninth stream.** It has no row, no figure and no verdict
- [ ] Empty state / invalid input / boundary cases — n/a: a document has no inputs
- [ ] A signed-in browser read — n/a: nothing here is served or rendered

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no gate

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: one markdown file, English, not served

## 6. Regression

- [x] The pages nearest the change still work — none: the file is not imported or rendered. The gates' typecheck and build cover that nothing references it
- [x] Shared file touched, checked from a second unrelated page — **nothing reads this file but a person.** Checked rather than assumed: `grep -rln planner-handover scripts/ .github/` returns nothing, and the only handover script is `check-release-handover.mjs`, which reads the *release* handover. **So the edition number has no automated consumer and the format is free** — worth knowing before anyone briefs a freshness check for it
- [x] Nothing merged from `main` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a handover ticks nothing. **The items today's work closed were ticked by their own PRs**, and `#hostx` was closed on the backlog branch when the UAT sign-in was pressed
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a: **the handover is itself the write-up.** The one judgement worth recording — writing it one stream early, at his instruction — is stated in the document's own opening and in §1 here
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a planner handover.** It is not served, imported or rendered and no behaviour changes
- [x] Commit messages say why, not just what
- [x] **It is 230 lines against the ~150-line target, and that is a real overrun rather than an oversight.** `767` was 221. Nothing was padded: every section is a measurement or a rule from today, and the two longest — the figures and the floor — are the ones the next planner reads first. **Named here so the next edition cuts rather than inherits**

## 8. Pre-production gate

- [ ] Deployed SHA / smoke test / UAT project line — n/a: **a handover deploys nothing**

### Rollback

- [x] Rollback position stated — reverting this PR restores edition `767`, which describes this morning's state and is wrong about the release, UAT and `#hostx`. **Nothing live changes either way**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (process) | **The skill-file edits are owed for a sixth consecutive edition.** Nothing in `.claude/skills/plan-day/` has changed since 2026-11-19 | **recorded, not fixed here.** Carried forward in the handover rather than reworded again, and one item now has evidence behind it (the specification discount), which is the first of the five that is actionable rather than a judgement call |
| 2 | low (handover) | **230 lines against a ~150-line target** | **recorded.** §7 names it for the next edition to cut |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | Nothing. A handover is read by the next planner chat, and its first reader is its test | `docs/planner-handover.md` | **n/a by design** |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (planner session)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one document, not served, imported or rendered, so there is no screen to look at

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — the next planner chat reads `768` instead of `767`

Result: pass with accepted defects
