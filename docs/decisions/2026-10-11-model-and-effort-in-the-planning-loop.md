# Model and effort become part of `/plan-day`, and the schema band stops being "unmeasured"

**Date:** 2026-10-11 · **Branch:** `claude/planner-handover-90`

## What was asked

Lutan, 2026-10-11:

> "As part of this process can you also suggest for each workstream what the optimal model
> and effort would be to give me the best mix of accuracy along with optimised usage"

"As part of this process" is the operative half: a recommendation given once in a chat is
not part of the loop. He then chose to fold the change into this handover PR rather than
spend a separate PR on it, since the handover already goes through a branch, a worktree, a
test plan and a PR.

## Decision 1 — the two dials are not interchangeable, and the skill now says so

**Model changes the price per unit of work, not the amount.** The ~110k floor — tools,
`CLAUDE.md`, memory, skills, the brief — is identical whichever model runs, so choosing a
cheaper family is the only dial that reduces usage without changing the work.

**Effort changes how much thinking happens per turn, so raising it raises the figure.** It
buys care and it costs.

**So the skill now forbids presenting effort as a usage optimisation, and forbids raising
effort to fix an overrun.** That second rule is the one with evidence behind it: batch 88's
three streams all ran over because each had to *measure* what the system does before it
could change anything, and more thinking per turn would have made those figures worse, not
better. The cure for a discovery overrun is a tighter brief or a spin-out.

## Decision 2 — the default is `claude-sonnet-5-5` at `low`, and the planner's own
## recommendation is retired

**The planner recommended `claude-opus-5-5` / `high` for `role-floor-schema`** on the
grounds that it changes permissions, carries a migration, and could over-grant where no
screen would show it.

**That recommendation was wrong, and this file records it as wrong rather than quietly
dropping it.** Lutan had already started batch 89 when the model question was asked, so the
recommendations applied to nothing; all three ran `claude-sonnet-5-5` at `low` and came in
**23–39% under estimate** — `role-floor-schema` 231,297, `perm-role-lists` 189,777,
`status-tile-truth` 152,979.

**Quality was then inspected rather than inferred from the numbers**, because "cheap and
merged" is worthless if the deliverable was skipped. `role-floor-schema` (`0179`) pointed
`sees_all_residents()` and `sees_all_contacts()` at the role's **own** scope columns rather
than loosening them — which was the trap the brief warned about — implemented Lutan's
2IC/Head-of-Maintenance split exactly, wrote a rollback note, **spun `databaseWider` out as
its own item** as permitted, and **correctly did not tick the blocker item** because part
remained. `status-tile-truth` did the full tile-by-tile audit and **found the fourth
instance** of the Pi-does-not-get-Worker-values fault (*Release mail*), which is what its
brief predicted.

It also **corrected an error in its own brief**: the brief asserted the Head of Maintenance
would *lose* the ability to delete a maintenance job and that this needed a release note as
a narrowing. The stream established they never had it — `has_shelter_floor()` already
refused them, as `docs/roles-and-permissions.md` line 1224 records — so nothing is taken
away and the 2IC simply gains.

**Why this is not over-claimed.** The task changed between the two batches as well as the
model: batch 89's briefs were far more prescriptive, and `scripts/check-who-does-what.mjs`
already existed, so the measurement that blew up batch 88 was pre-paid. **The model cannot
be credited for the result**, and the skill says so. What can be said is that Sonnet/low has
now cleared a permissions migration, an app conversion and an audit with no quality cost
anyone could find on inspection — which is enough to make it the default and more than
enough to retire a recommendation that was reasoning rather than evidence.

**Vary one dial per batch.** `model` and `effort` are now columns in `.plan-day.md`'s actuals
table, and the skill requires recording what a stream **actually ran on**
(`get_session` reports both), not what was recommended. Reading a recommendation as the
setting would have produced a false finding on this very batch.

## Decision 3 — the schema band is corrected, on Lutan's answer

The skill's token table said the schema-PR band was **`unmeasured`**, and pointed the reader
at `zone-colour-schema` from batch 73 — a stream whose session is long gone.

`docs/decisions/2026-10-10-schema-pr-band-is-150k-and-cost-tracks-discovery.md` deliberately
did **not** edit the skill, recording that changing the rules file is Lutan's call and not a
session's. **He was asked on 2026-10-11 and chose to correct it**, so it now reads:

> ~150k single-file · 230–285k with code

measured four times: `map-rooms-schema` 151,273, `receipt-issuer-server-side` 143,678,
`role-floor-schema` 231,297, `perm-functions-schema` 284,248.

**The split matters more than the number.** A single-file migration and a migration that also
rewrites functions or carries app code are not the same job, and the earlier ~150k reading —
taken from the two cheap ones — would have under-priced both of this period's schema streams
by a third.

## Decision 4 — estimates are bands, not figures

The skill now says so in terms, because the bands have been wrong by **+50% and −39% in
consecutive batches**. `who-does-what-view` was fully briefed, with every file named, and ran
+50% because establishing which of 300 permission boxes the system actually obeys *was* the
work — it wrote `scripts/check-who-does-what.mjs` to do it.

**So the axis is not "briefed vs unbriefed" but "is the scope known, or must the stream
establish it?"** The skill's new instruction is to ask **what does this stream have to
count?** before estimating, and to widen the band and say in the brief that the counting is
the deliverable whenever the answer is anything other than "nothing".

## Not changed

- **`check-test-plan.mjs`**, which is untouched and must stay so. It can see whether a §7
  release-note line exists, never whether it is true.
- **The one-migration-per-batch rule.** Model choice does not relax it.
- **Who signs *Manual verification*.** Nothing here lets a cheaper or more expensive model
  sign for a person who has not looked.
