# Planner handover every nine workstreams, counted in `.plan-day.md`

**Date:** 2026-10-08 · **Stream:** `planner-handover-doc`

## What Lutan asked for

> *"can you put together a daily planner handover similar to
> `docs/release-handover.md` so I can handover to a fresh chat at the end of
> each set of 3 batches. Please also include a prompt once it reaches 9
> workstreams to start a new stream and update the handover document"*

Built as `docs/planner-handover.md` and a few lines in
`.claude/skills/plan-day/SKILL.md` (steps 0, 6 and 8).

## Why the counter lives in `.plan-day.md`

`/plan-day` has no memory between runs except `.plan-day.md`. It is already
read on every run and already written in step 6, so a counter there costs no
new file and no new step. It is gitignored, which is right: the count is local
planning state, like the rest of the plan, not something a PR should carry.

The skill counts **workstreams, not batches**, because Lutan's trigger is nine
streams and batch 78 showed a batch can hold two or three. A batch of two and a
batch of four would make "three batches" drift from "nine streams".

## Why the prompt updates the handover *before* suggesting a fresh chat

The handover is only worth something if it is written by the chat that still
holds the context — which items turned out stale, which states looked like
faults, what each stream actually cost. A fresh chat asked to write it would
re-derive all of that from `.plan-day.md`, which is ~6,800 lines and exactly
what the handover exists to save reading. So the prompt orders the two steps,
and the counter resets only once the handover is written.

## Why the skill edit is small

`SKILL.md` is read in full on every `/plan-day` run, so each added line is paid
for on every run. The reasoning lives here instead, and the skill links to it.

## What was corrected from the draft

The brief's draft was written from batches 63–78 and said to re-verify every
number. Changed on checking:

- "Eighteen actuals; the last ten all under estimate" → **seventeen measured
  and one `unmeasured`**; of the last ten, two came in over
  (`zone-colour-feature` +8%, `facility-map-upload` +1%), so the file says
  seven of the last eight were under.
- The **HEIC confirmation** was dropped from the person-condition list: no open
  backlog item mentions HEIC.
- "Fifteen backlog conflicts": eleven are written up in `.plan-day.md`; the
  file says so rather than asserting fifteen.
- The squash-merge trap is real but occasional (most PRs are merge commits;
  `#416` was squashed), and the file says that.
