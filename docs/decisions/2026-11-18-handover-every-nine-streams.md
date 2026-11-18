# The planner handover is written every nine merged streams (2026-11-18)

Lutan: *"this process is getting ridiculuous, why would we want to write a handover after just one stream.
we should have 3 batches of 3 streams between handovers"* and, asked streams or batches: *"so the rule is 9
streams irrelevent of batches"*.

## Decision
A handover is offered when nine stream PRs have merged since the previous handover, across batches, plans
and chats. A plan completing is no longer a trigger. Rule 7 (nine is a target, not a quota) is unchanged.

## Why this is a defect, not a preference
The old cadence only looked sane because he suppressed it by hand: edition `761` covered two plans and
twelve streams because he said "Not yet" twice. A process that relies on the user declining it is broken.

## Why not count batches
A batch has been one to three streams. Nine streams is the real unit, and it gives a complete set of
figures for the floor row.

## What counts
Counts: a merged PR from a stream /plan-day set up (one stream, one count, even with two PRs); an unplanned
stream that shipped a PR; a stream whose figure is `unmeasured` or `rescoped=yes` (counting is not the
same test as being a valid band reading). Does not count: a release's cut and record PRs, the handover's
own PR, bot PRs, unmerged branches.

## The lag statement, per stream
Measurement stays once a day (step 3, untouched). So an edition may have figures for some of its nine and
not others. The old wording ("figures lag one plan", per plan) described nothing under this cadence. Each
edition now names the streams it covers and says which have figures and which are read next morning.

## Where the count lives
`.plan-day.md` is gitignored and machine-local, so it holds only the live convenience count. The durable
boundary is the handover: it lists the streams it covered, and a fresh chat counts merged stream PRs
(`gh pr list --state merged`) after that edition. Edition `761` is current; four streams have merged since,
so the count is 4 of 9.

## Left alone
Line 11 (nine items, three batches of three), step 3's measurement slot, all band and floor rows, rule 7,
the (a0) gate and hard sequence. SKILL.md net +1 line (the removed sentence was the superseded
"old wording" clause); incident history is in reference.md.
