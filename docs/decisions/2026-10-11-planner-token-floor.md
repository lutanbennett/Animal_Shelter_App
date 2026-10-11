# The planner's token floor is ~80k, not ~110k — 2026-10-11

**Decision (Lutan, in the `/plan-day` chat, 2026-10-11):** correct the floor in
`.claude/skills/plan-day/SKILL.md` to **~80k** and trim the bands that sit on it, **recorded as one
measurement rather than a law.**

## What was measured

`release-note-truth-rule` (#540) came in at **103,070** tokens of context — **below the ~110k the
skill asserted every stream pays before doing any work.** Its own breakdown:

| category | tokens |
|---|---|
| System tools | 38,782 |
| MCP tools | 17,001 |
| Memory files | 9,695 |
| Skills | 6,377 |
| System prompt | 4,973 |
| **fixed subtotal** | **~77k** |
| Messages | 23,881 |

So a stream that did real work — a process answer written into three files, merged — spent about
**77k of fixed overhead and 24k of conversation.** The floor is the fixed part, and it is ~80k.

## Why it matters more than 30k

**Every band in the table sits on the floor**, so all of them inherited the error. That single
figure explains most of a pattern that otherwise looked like twelve separate misjudgements: across
batches 90–93, **twelve consecutive streams came in below or inside their band and not one went
over.** Correcting the floor is a cheaper fix than re-deriving every band.

## What was changed

- **Floor:** `~110k` → **`~80k`**, with the breakdown and an explicit *"one measurement, not a law:
  re-check it"*.
- **Schema PR:** now measured 6× — `~140–155k` single-file (was `~150k`), `230–285k` with code
  unchanged.
- **Medium:** `200–320k` → `170–290k`, with the five measurements that support it.
- **Large:** `350–550k` → `340–460k`, with four measurements — one of them flagged as not
  comparable (see below).
- **Rule 8** (fold small items): the arithmetic now reads `~80k` and `~240k`, not `~110k` and
  `~330k`. The conclusion is unchanged and if anything stronger.
- **The *Model and effort* section's** reference to the floor being identical across models.

## What was deliberately NOT changed

**The quick-win band stays `110–170k`.** Lutan ruled separately, the same day, that this band was
right and the planner's habit of quoting `130–200k` against it was the error: both measured quick
wins (`account-menu-min-width` 129,320 and `record-permission-gaps` 135,901) sit **inside** the
written band.

**These two rulings are not in tension, and a later reader should not "tidy" them into agreement.**
The band was not wrong; the floor provably was. The evidence differed, so the answers differed.

## A second correction, from the same evidence

The skill told the planner to widen a band whenever a stream *"has to count"* anything. That is now
disproven and was changed in the same PR.

`silent-empty-reads` faced 64 candidate files, eight named as a stated lower bound, each needing a
judgement — the textbook case for widening. It was banded `~250–400k` and **came in at 133,986.**

The real axis is **whether the stream must BUILD an instrument to measure with.**
`who-does-what-view` ran +50% over because establishing which of 300 permission boxes the system
obeys meant writing `scripts/check-who-does-what.mjs` — **that script was the work.** Reading a long
list of files is cheap by comparison.

## One figure in the table that must not be quoted as evidence

`fable-architecture-review` is recorded at **448,294** and marked **not comparable**. It ran on
`claude-fable-5-1` at **`xhigh`** effort, where every other row in the table is `claude-sonnet-5-5`
at `low`, and the recommendation for it had been `low`. **Two dials vary at once**, so the figure
says nothing about what Fable costs. `xhigh` on a 568-line whole-system review is plausibly most of
it.

This is the second time a stream's actual settings differed from the recommendation — the first
because the batch had already been started before the recommendation existed. **Reading a
recommendation as the setting produces a false finding**, which is why the skill requires reading
`model` and `effort` from `get_session`.
