# The planner hands the sessions back — 2026-11-03

## Decision

`/plan-day` creates the worktrees and writes the briefs, then names **the folder, the port, and the model
and effort to set** for each stream and stops. Lutan opens each session himself. The planner no longer
calls `start_session` for a stream.

Lutan, watching the first batch of a nine-stream plan run:

> *"this new process seems to be using a lot more of my allocation per batch. Can we go back to the way we
> used to do it, you create the streams and I will manually start each one"*

and, correcting the planner's reply, which had answered in tokens:

> *"My usage is not based on Tokens, it's based on turns"* … *"it's the Maxplan"*

Both halves are the decision. The trial being reverted was his own (2026-11-01, *"Yes, try it next batch."*).

## What the trial proved

It ran for two plans and **worked mechanically**: twelve of twelve session starts, none refused, dials read
back correctly every time. It was reverted for its cost in **requests**, not because it failed. The old text
stays in `.claude/skills/plan-day/SKILL.md`, marked superseded.

## Measured, and reasoned

**Measured:** batch 1's streams were ordinary (`doctor-insert-as-caller` 191,212, band 165–215k;
`video-upload-fault` 177,919, band 200–260k, 11% under). The planner's own session reached 354,693 tokens
and its 5-hour window went 7% → 19% across the planning round.

**Reasoned, not measured:** a session started with `start_session` is linked, so the planner is woken each
time one ends a turn, and each wake-up costs several requests. A second, smaller cost: forty-odd separate
tool calls in the round where about a dozen batched ones would serve. Nobody has measured requests per
wake-up against a batched read, so no figure is given.

## The trade accepted

He goes back to setting model and effort on three new sessions a batch by hand, which is the cost the trial
removed. The finishing message therefore lists the dials per stream so he copies rather than works them out.
In return the planner's session ends after setup and is never woken. The `stream-usage:` PR comments are
unchanged and are read at the next `/plan-day`, so no measurement is lost.

## Also changed

- The token bands are kept; a block at the top of *Token estimates* says they measure scale, that his limit
  is turn-based, and that a token band cannot see the planner's own cost. A rule tells the planner to batch
  independent reads.
- A "wording only" change that must be seen on screen in two languages and chased through neighbouring
  documents is banded 150–195k, not as a quick win (`website-content-label`, 157,458 against 110–150k). The
  Quick win row is untouched.
- `CLAUDE.md` workstream step 1 said `/plan-day` starts the session; it no longer does, so that sentence changed.
  Nothing else there read falsely.
- No request budget or stop threshold was added: warn and forecast, never gate.
