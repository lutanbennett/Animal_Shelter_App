# The list-first rule becomes a sequence of tool calls, and the agreed plan is not re-checked each batch

**2026-11-11.** Two changes to `.claude/skills/plan-day/SKILL.md`, both from Lutan in chat on the day,
plus the matching evidence section in `reference.md`.

## 1. The list-first rule is now a lettered sequence of tool calls

**His words:** *"Why are we doing paperwork first again in front of setting up streams"*.

THE ONE RULE has said since 2026-11-08 that the list he copies from comes first, and that *"everything
else in this file happens after that list is in front of him"*. **It was broken anyway, for the third
time in four plans, by a planner that had read it and agreed with it in the same session.**

**What actually happened, because the specifics are the argument.** Setting up batch 2 of the
2026-11-11 plan, the planner read **three full PR bodies and three `stream-usage` comments and wrote an
entire band analysis before a single worktree existed.** Exactly **one** of those reads was
load-bearing: #1482's, because its migration `0354` is the worked example the `bills-job-link` brief
quotes and its 146,679 figure is what that band was lowered against. The other two PR bodies and the
whole band write-up were paperwork done ahead of delivery.

**The diagnosis is that the rule was written as a rule about PROSE** — "the first thing in your reply"
— **and a planner can obey that to the letter while spending twenty tool calls reading first.** The
reply was correctly ordered. The turn was not.

**So the rule now names the tool calls, lettered (a)–(e)** so they cannot be confused with the file's
own numbered steps: worktrees, briefs, `worktree.mjs streams`, the list, and only then the actuals, the
PR bodies, the filing, the bands and `.plan-day.md`. **Steps 0 and 1 of the file (resume-or-plan, then
the sync) happen first as written** — an ambiguity found while reviewing the first draft, which read as
forbidding the sync.

**And the allowed reads between the sync and (a) are now a closed list of three cheap facts:** has the
current batch merged; is the migration slot free; and does a brief you are about to write need to QUOTE
a merged PR, in which case name that one PR and read only it. **A PR body read "while you are there" is
paperwork.**

**Why a closed list rather than judgement:** every breach so far has been a planner exercising
judgement about what it needed to know first, and being wrong in the same direction each time.

## 2. The agreed plan is not re-checked at the end of each batch

**His words:** *"I will request a change to the daily plan if it's required otherwise you stick to the
daily plan"*, and *"So no rechecking at the end of each batch"*.

Step 0 used to say: on resuming, *"re-check the next batch against the backlog as it is now (items
still open? still disjoint? migration slot free?), report what changed"*. **That is gone.** Once he has
agreed the day's nine, the composition is settled and a change comes from him.

**Two guards stay, and the distinction is why this is safe rather than merely cheaper:**

- **Checking that the current batch actually MERGED stays.** That is not a re-check of the plan; it is
  what stops six worktrees being live at once, which is his own standing rule (two or three live,
  because merging is the bottleneck).
- **Every brief's STEP ZERO stays, and it is the real reason this is safe.** Every stream already
  proves its gap is still there before writing code, and stops and says so if the work has already
  shipped — *"that is a successful outcome for this stream, not a failure"*. **The per-batch re-check
  was a second, dearer copy of a guard that already existed one layer down**, and it was paid for in
  his waiting rather than in a stream's turn.

**What this gives up, stated rather than glossed:** if an item closes under the plan, nobody notices
until the stream's step zero catches it, which costs that stream its floor. **That is the trade, and it
is his to make.** The alternative cost him a re-read of the backlog three times a day.

**Also removed as a consequence:** step 0's closing line used to allow re-planning from scratch when
*"the plan predates a backlog that has moved under it"*. **That is the re-check under another name**, so
it went too. Re-planning from scratch now has exactly two reasons: he asks, or the saved items are all
closed.

## What came out, because the file requires it

`SKILL.md` says *"If you add to this file, something else comes out."* Two new rules went in, so:

- **Two of the three places the list was restated are gone.** It was stated in THE ONE RULE, again in
  step 2's item 3, and again at the top of step 8. **That triplication is itself the evidence that
  repetition does not work** — the rule was restated three times and broken three times. The sequence
  now owns it; step 2 points at it and step 8 says in one line why it used to be repeated.
- **The incident narrative moved to `reference.md` §1**, where the file says incidents belong
  (*"Cite them; do not copy them back in here"*).
- **The file's own history note is compressed** from five lines to three, keeping the pointers and the
  something-comes-out rule.

Net: `SKILL.md` 330 → 359 lines for two new rules of his, with the prose that explains them held in
`reference.md`.

## Corrected in passing: confirming a batch is single-select

Not one of his two instructions, but the same day and the same file. **Batch 1 was put to him as a
multi-select `AskUserQuestion` over its three streams, worded "confirm the three streams, or untick any
you want swapped". He left one ticked, meaning to confirm; the planner read it as "only this one", set
up one stream, and he asked *"I'm confused, is there only one stream for batch 1"*.**

**Unticking is indistinguishable from not meaning to tick.** Step 6 now says confirming a batch is
**single-select** — "all three" or "I want a swap" — and records why.

## The two things this cannot establish

**Both changes are mitigations, and the skill's own rule is that a mitigation written into a brief or a
process document is a HYPOTHESIS until it has been seen to fire.**

1. **Whether the lettered sequence actually changes behaviour.** The only test is the next batch
   set-up: does the planner create the worktrees, write the briefs, run `worktree.mjs streams` and send
   the list before reading any PR body? **Check at batch 3 of this plan.**
2. **Whether dropping the per-batch re-check costs anything.** The signal would be a stream reporting
   at step zero that its item had already closed. **Check batch 3's PR bodies.**

Neither is verifiable in this change, and both are recorded in its test plan under *Left for manual
verification* rather than claimed.
