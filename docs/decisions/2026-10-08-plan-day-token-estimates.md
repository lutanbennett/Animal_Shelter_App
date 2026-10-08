# 2026-10-08 — `/plan-day` shows an estimated token cost per stream

Lutan asked to see, when approving a batch, roughly what each task will cost. `/plan-day` now puts an
estimate beside every stream in step 5, records estimate and actual in `.plan-day.md`, and reads the
actual from the stream's own session in step 2. The bands live in the skill; this file holds the
reasoning, because every line in `SKILL.md` is paid for on every run.

## The measurement

`mcp__ccd_session_mgmt__get_usage` on `account-menu-min-width`, seconds after it started and before it
had done any work: **111k** in the context window, of which only 34k was Messages.

| category | tokens |
|---|---|
| System tools | 37,710 |
| MCP tools | 16,566 |
| Memory files | 9,290 |
| Skills | 6,380 |
| System prompt | 4,981 |
| **fixed floor** | **~75k** |

Reading `CLAUDE.md`, `AGENTS.md` and the brief adds roughly 34k more. So **a stream costs about 110k
before it does anything**, and that floor is the same for a one-line fix and an eighty-file sweep.

Batch 72 was then measured in full, each session read while still running:

| stream | scale | estimated | actual |
|---|---|---|---|
| `account-menu-min-width` | quick | 180–280k | 129,320 |
| `place-order-settings` | medium | 300–450k | 282,082 |
| `medications-diets-split` | large | 400–600k | 361,651 |

All three came in under the first guesses. The quick win is the telling one: ~110k of its 129k was the
floor, so the work itself added about 19k. The first guess assumed screenshots would dominate a small
stream; they did not. **The cost of a small stream is almost entirely the cost of starting one**, which
is why step 4 now says to fold small disjoint items into one stream (batch 73's `stock-pages-finish`
folds three).

## Two limits, written into the skill rather than glossed

1. **`get_usage` reads only a live session.** It asks the session's own process; an idle, starting or
   archived session reports `unavailable`, and a closed one is gone for good. That is why actuals are
   captured in **step 2**: merged streams' sessions have so far still been running when the next
   `/plan-day` starts, and that is the only window. A session that cannot be read is recorded as
   `unmeasured`, never estimated after the fact — a guessed "actual" would quietly corrupt the bands it
   exists to correct. `order-and-units-schema` closed before it was read, so the schema band is still
   unmeasured; `zone-colour-schema` in batch 73 is the one to read.
2. **Context-window tokens are not billed tokens.** Each turn re-sends the window, so consumption is
   roughly window × turns, most of it cached. The figure is a measure of **scale**, not a charge, and
   the skill says so under the tables so "400k" is not read as a bill. For scale: all of batch 72 plus
   the 0.21.0 release cut came to about 6% of a 5-hour plan window.

Auto-compact starts at 97% of a 1M window, so a stream past ~970k has compacted and spent more than its
final figure shows.

## Why the bands are provisional

Three data points, one per scale, is enough to replace guesses but not to trust a range. The
`estimated | actual` table in `.plan-day.md` is the mechanism: after a few batches the bands should be
re-cut from recorded work, and the ones in `SKILL.md` updated in a PR like this one.
