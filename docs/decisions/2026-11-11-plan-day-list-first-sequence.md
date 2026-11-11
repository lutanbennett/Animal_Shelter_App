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

## 3. Measurement happens once a day, for the previous day's complete set

**His words:** *"can we save measuring the streams for the end of batch 3 … I'm thinking measurement
should occur at the beginning of the day for the previous days streams. That way we always have a
complete set"*, and on where the step sits: *"it's step is after we agree the days plan and setup batch
1"*.

**So step 3 is now a once-a-day step** in that exact slot: the day's plan agreed, batch 1's worktrees
and briefs written, the list sent — **then** read all nine of the previous day's `stream-usage` figures
together. **On a resume that sets up batch 2 or 3, the step is skipped entirely:** yesterday's set was
read this morning and today's streams are not finished.

**Why it works, and this is the fact the whole change rests on: the figures cannot expire.** Each
stream posts its `stream-usage:` comment on its own PR immediately before merging, and
`gh pr view <n> --json comments` reads it from a merged PR long after the branch and worktree are gone.
**Proven on 2026-11-11**, when batch 1's three were read after their worktrees had already been
cleared. Contrast the live reading, where an archived session answers `unavailable` and the figure is
lost for good — **that** is the one that cannot be deferred, and it is not the one we use.

**What it buys:** three batches of three gave the planner three partial pictures and a floor
re-derived three times a day. Nine read together give one complete set and one floor. The floor line in
step 3 changed accordingly, from *"re-derived each batch"* to *"re-derived once a day from the complete
set"*.

**ONE CONSEQUENCE, AND IT IS WRITTEN INTO THE SKILL RATHER THAN GLOSSED: the day's FIRST batch is
banded before the previous day's figures have been read.** Its bands come from the handover instead.
Batches 2 and 3 are banded at their own setup, after the measurement, so **only batch 1 lags.**
Measuring before planning would remove that lag and would be paperwork ahead of his list — which is
the thing change 1 above exists to stop. **He chose the ordering; the lag is its price and it is
small.**

**A second consequence, for the handover.** A handover is written at the setup of the plan's last
batch, so it now carries **no figures from its own plan at all** — its nine are read the next morning
and reported by its successor. **That is the delta model working as intended**, since each edition
already exists to report what its predecessor's plan actually did. The skill now requires each edition
to **say which plan's figures it is reporting**, so a missing set is never read as a lost one. The old
instruction — *"say that that batch's figures are not in it"* — described the per-batch world and is
superseded.

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
- **The 2026-11-04 preflight incident is cut to its rule**, because retelling it is `reference.md` §2's
  job.
- **Step 7's `.plan-day.md` editing traps are cut to the two that bite silently** (`replace()` reading
  `$`, and the missing-anchor guard), pointing at `reference.md` §6 for the rest.
- **Two bullets in HIS DECISIONS are merged into one pointer**, because `test-plan` being advisory and
  merge-on-green are both in `CLAUDE.md` at length.

**Net: `SKILL.md` 330 → 387 lines, and that is honestly +57 rather than a wash.** Three new rules of
his cannot be free. What the cuts bought is that none of the 57 is narrative — every incident now lives
in `reference.md` and the skill holds only the instruction. **The rule exists to stop the file drifting
back towards the 2,176 lines it was cut from on 2026-11-08, and a planner adding to it next should cut
harder than this did.**

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
