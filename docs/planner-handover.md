# Planner handover — edition `756`, 2026-11-17

**This is a DELTA against `755`.** It says what changed, corrects its predecessor, and reports what each of
`755`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS.** The daily measurement read **the third plan of 2026-11-16's
complete set**, in one slot after batch 1 was set up. **This plan's own streams are reported too**, because
all three that finished did so within the same conversation and `gh pr view` does not care that the slot
has passed. **Nothing is owed to the next edition except batch 3's two**, which were still unstarted when
this was written.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** It is gitignored, so it is not in this file's history. It holds the
   day's batches, their statuses, the ACTUALS table and every finding filed.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **Check whether batch 3's two streams merged:** `gh pr list --state all --head claude/tenancy-part6-singletons`
   and the same for `claude/tenancy-part7-filters`.
4. **Read the repository AFTER the pull, not before.** `main` can be a day behind what shipped.
5. **DO NOT RE-PLAN ON SIGHT, AND DO NOT ASSUME IT IS FINISHED EITHER.**

## THE CORRECTION THAT MATTERS MOST: `755` TOLD ME TO REUSE A BRIEF, AND THE BRIEF WAS STALE

**`755` instructed its successor, in terms, to RE-USE `#lhdr7`'s already-written brief rather than rewrite
it.** That instruction was right about the cost and **blind to the only thing that could go wrong with
it**: the work had already shipped. **PR #1639** (`next dev and the anon scripts send the shelter header`)
built the entire `#lhdr7` mechanism on 2026-11-16 at 13:27Z — an **unplanned** stream that titled its PR
**`#ujqr5`**, not `#lhdr7`.

**HOW IT GOT PAST TWO SEPARATE GUARDS, BECAUSE THE SHAPE WILL RECUR:**

- **The step-4 "already done?" search looked for the item's own id** and found nothing, because the PR was
  titled for the programme part instead. **An id search is not a subject search.**
- **I read #1639 THAT SAME MORNING and did not see it** — I read it for a usage figure, not for what it had
  built. **`SKILL.md` step 3 says *"Read every merged PR body for findings outside its deliverable
  list"*, and reading one for a number is not reading it.**

**WHAT CAUGHT IT: the stream's own STEP ZERO, and Lutan asking.** The session reported *"nothing to
build"*, and he raised it. **That is the second time step zero has caught a faulty BRIEF rather than a
stale item** (the `th.ts` case of 2026-11-12 is the first). **It is now evidence rather than assertion, and
it is the argument for keeping step zero in every brief even when the planner is certain.**

**THE LESSON FOR THE NEXT EDITION, STATED AS A RULE RATHER THAN A REGRET:** reusing a brief is still right,
**but a brief older than the last merge is re-checked against the subject, not the id.** One
`grep -rln "<the mechanism>" src/` would have settled it in seconds.

## WHAT `755`'s OWED ITEMS DID

1. **Measure the remaining streams — DONE**, and three were unmeasurable for two distinct mechanisms.
2. **`#lhdr7` is the blocker, reuse its brief — OBEYED AND IT WAS WRONG.** See above. The stream was
   re-briefed to the two clauses genuinely unmet, then **closed entirely** on Lutan's decision and its
   residue folded into batch 2.
3. **Part 5 again, reading PR #1635's decision file first — DONE AND IT SHIPPED.** `0392`, `0393`, `0394`,
   PR #1645.
4. **Resolve the Part 7 inversion before briefing either side — RESOLVED BY MEASUREMENT, THE RIGHT WAY.**
   It was briefed as the planner's **hypothesis with its own numbered deliverable to test it**, and #1644
   answered: **the audit and check did NOT need Part 5** (73 of 81 call sites classify from what the code
   is for). **This is the shape to copy** — a planner reading offered as a question returns a measured
   answer instead of being obeyed.
5. **`#n4rpt` was in flight — IT MERGED** (PR #1642) and is measured below, inside its band.
6. **`gh pr list --state open` before any `worktree.mjs new` — DONE, empty every time.**
7. **Check whether `done` clears the handover's own branch — DONE, THE FIX FIRED.**
   `worktree.mjs done planner-handover-755` recognised the squash-merged case and cleared cleanly.
   **PR #1636's fix works; there was no finding to file.**

## `755` SAID "WATCH FOR THE THIRD". IT ARRIVED, AND IT IS FILED

**`#3qmzt` (Architecture), filed 2026-11-17.** Both of `755`'s measurement-chain mechanisms had recurred by
the morning reading:

- **Mechanism A — no comment at all (a stream stopping before the finishing sequence):** PRs #1625, #1636,
  #1637. `gh pr view <n> --json comments -q '.comments | length'` answers **0** on two of them, so it is
  not a grep missing a differently-worded comment. **And the same family claimed `755` ITSELF:** that
  edition was written, committed, pushed and **never opened as a PR**, so `main` served `754` to this
  planner for a day (settled by PR #1643). **Four occurrences of one shape in three plans.**
- **Mechanism B — the comment posted with its figures reading `unmeasured` (a tool failing, not a stream
  forgetting):** PR #1639. `754` said in terms to file the second as a harness finding. **This was it.**

**THE BAND TABLE IS BUILT ENTIRELY FROM THOSE COMMENTS**, so a stream that skips one is invisible to it and
the bands drift toward the streams that happen to be tidy.

## FIGURES

**The previous plan (third of 2026-11-16), read this morning:** `nightly-lint-reporting` **144,869**
(inside 130–170k); `tenancy-part5-policies` (#1635) **184,352** — **BAND DOES NOT APPLY**, see below;
`worktree-done-husk`, `deploy-cf-token` and `dev-shelter-header` **unmeasured** for the two mechanisms
above; `tenancy-localhost-shelter` never started.

**This plan's own, 2026-11-17:** `tenancy-service-role-audit` **179,813** (inside 175–215k, `finished=yes`);
`tenancy-part5-policies` (#1645) **211,806** against 230–285k — **under by about 18k**, dials matching,
`rescoped=no`, `compacted=no`, so it is a valid reading. **Batch 3's two were unstarted.**

**`#1635` IS NOT EVIDENCE ABOUT ESTIMATING IN EITHER DIRECTION, AND IT IS DISQUALIFIED THREE TIMES OVER:**
its `band=` carries `@opus-5-5/low` while its `model=` reads `sonnet-5-5`, and it reports `rescoped=yes`
and `finished=blocked`. **Printed as "band does not apply", never as a 76k underrun** — counting it would
read a permissions schema PR as far cheaper than it is and deflate every later band for that shape.

**THE FLOOR: 86,389, TWICE, IDENTICALLY.** Both #1644 and #1645 give `tokens − messages` = **86,389**, and
#1635's gives 86,165. All inside **86–89k**. **`SKILL.md`'s floor row still describes the data, so NO EDIT
IS OWED** — and the scale rows are still **not** to be shifted with it. They were measured from actuals,
not derived from the floor.

**ONE BAND OBSERVATION, NOT A REVISION.** The 230–285k row (permissions schema across many call sites)
produced one reading **under** it, on a job whose hardest judgement — which of 124 tables get a policy —
was briefed as a question with the table list handed over. **One reading moves nothing.** If the next
permissions schema PR also lands under, that row is a candidate.

## WHAT THIS PLAN LOOKED LIKE, AND WHY IT WAS FOUR STREAMS NOT NINE

**Of 34 open items at planning time, the only live Claude-buildable programme is multi-tenancy
(`#ykefa`), and it runs in a fixed order with one blocker at the front.** Everything else open is Lutan's
own hands, or waits on a person or on months of real data. **It was named in the first line of the first
reply**, which `755` said cost it five interruptions to omit, and he accepted it in one question.

**Five planned, four real:** `tenancy-localhost-shelter` was **closed rather than built** once its work
turned out to have shipped, and its three paperwork edits were folded into batch 2 on his decision.
**Folding beat a fresh session because a stream pays an ~86k floor for three edits.**

## THE PROGRAMME'S STATE, SO IT IS NOT RE-DERIVED

**Parts 1–5 and Part 7's first half are done.** Part 5's policies (`0392`–`0394`) are **applied to dev and
in no release yet**. **Batch 3 is Part 6 (`#bncd0`, singletons, carries the migration) and Part 7's second
half (`#ps6ms`, the 59 filters).**

**THREE THINGS FROM #1645 THAT THE NEXT PLANNER MUST NOT LOSE:**

1. **PRODUCTION MUST NOT RECEIVE `0392` WITHOUT `0394` RE-RUN IMMEDIATELY BEFORE IT.** Until `NOT NULL` and
   Part 7 land, every headerless writer keeps producing rows the policies hide — and **a null `user_roles`
   row locks a login out of every one of its cards**, silently, with no error. That is release-order
   business and the guard on `#ujqr5` stands.
2. **Part 5's browser click-through was NOT completed** (a sign-in cookie transcription failure, twice).
   The proof that tenancy holds was done in a rolled-back SQL harness instead: **residents 17 with the dev
   header, 0 without, 0 with another shelter's, 17 as a trusted caller.** **The click-through is left for a
   person**, and both batch-3 briefs say so rather than assuming someone has driven those pages.
3. **`usage.ts` IS a confirmed tenant leak**, settled by reachability rather than intent: `/admin/status`
   is gated by `system.status`, **an ordinary card**, so any login a shelter gives it would see another
   shelter's counts. **It is Part 7's filter to close and is briefed as such.**

## FILED THIS PLAN — four items, none of them a stream's to file

- **`#3qmzt`** — the measurement chain, above.
- **`#tnc10`** — **about nine tables hold one shelter's data with NO `shelter_id` column**, so `0392`'s
  policies cannot cover them and **no instrument will find it** (the canary diffs database roles; these are
  readable by design). Named: `diet_ingredients`, `item_unit_conversions`, `merch_exchange_rates`,
  `donation_channels`, `community_places`, `translations`, `label_drafts`, `label_sources`, plus
  `calendar_sync_state` and the shared lookup lists. **`diet_types` is Part 6's**, because its constraint
  cannot be made per-shelter without the column.
- **`#bld1f`** — a first `next build` in a fresh worktree fails with a `SecurityFatalError` advisory and
  passes on retry, so **every stream pays a wasted gate cycle and learns that a red build is noise.**
- **`#stscp`** — **a decision for Lutan**, and the only one this plan produced: should `system.status` be a
  card an ordinary role can hold, given the page reports the **installation** rather than one shelter?
  **The leak is already being fixed, so nothing is blocked.** Note the rule that rules out the obvious
  answer: *"Admin is never given cards"*, so "Admin-only" would mean **removing the card from the
  catalogue**, not granting it to Admin.

## PROCESS NOTES THIS EDITION ADDS

- **`TEST_SHELTER_ID` was missing and is now set.** #1639 asked Lutan for one repository variable and
  nobody checked it had happened; the repository had **zero** variables. Measured, put to him, set with his
  go, and `check-public-views.mjs` then run with the header in place — **exit 0**, so it cannot go red when
  the policies ship. **The lesson: a decision file's "What Lutan must do" section is not a record that he
  did it.** Re-read those sections when the work they gate comes up.
- **A hypothesis written into a brief fired twice this plan, and both were checked.** The Part 7 inversion
  (confirmed) and the `usage.ts` reachability test (which flipped the planner's reading from *platform
  monitoring* to *tenant leak* for one of the two modules). **Writing the planner's reading in as a
  question with its own deliverable is what made both answerable.**
- **A pre-commit hook on the backlog branch refuses a message that does not name the ids** and offers an
  override environment variable. **Name the ids; do not take the override.**
- **The scratchpad path is long and mistyping it creates a stray directory** rather than failing. Two were
  created and removed this plan. **Check the session id before writing, and `ls` the parent if unsure.**

## INTERRUPTIONS

**One, and it was a good one.** Lutan asked why a batch-1 stream reported nothing to build, which is how
the stale-brief fault above was found. **Counted as a briefing defect, not a stream defect**, per
`SKILL.md`. **Two of his messages also corrected my own account of the state** — I said batch 1 was "ready
to open" minutes after one of its two had merged, and he had read the state correctly before I had.
**Read `gh pr list` before describing a batch, every time.**
