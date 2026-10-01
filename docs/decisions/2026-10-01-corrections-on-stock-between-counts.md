# 2026-10-01 — Corrections are shown on Stock between counts, and still not counted as use

Closes the half of `0112` that was left open. That migration added
`stock_counts.source` (`count` | `correction` | `backfill`) and routed the
single-cell stock edit on Management → Medications / Diets through
`record_stock_correction()`, so a typed figure is history rather than nothing.
It also narrowed `stock_count_intervals` (0096) to pair `count` and `backfill`
rows but **not** `correction` rows, so a typo cannot read as usage.

What it did not do was show the column anywhere. It had been collecting real
rows since `0.9.1` with nothing on screen reading it, which is how the
"schema ahead of code" expiry date in `docs/releases/2026-09-30.md` came to be
written.

## The problem being fixed

Because an interval skips corrections, a figure typed **between** two
stocktakes changes `stock_on_hand` and then leaves the interval reading exactly
as though nothing had happened. The arithmetic is right and should not change.
The consequence is that the page can present a gap it is unable to explain,
while the explanation sits one column away in the history.

## What was decided

**Lutan, 2026-10-01: show it on Stock between counts only.** Two wider options
were put and declined for now:

- labelling counts by origin wherever a count is listed, so a `backfill` row
  stops passing as a real stocktake;
- a provenance view per item under Management.

So the change is deliberately narrow: a per-row note, in the same place the
page already carries "the plan leaves out residents who have since left" and
"changed by hand after this count", plus the same text in the CSV.

**No figure moves.** `correctionsBetween()` is read-only and feeds nothing but
a string. The page's history query keeps its `.neq("source", "correction")`,
and the corrections are fetched by a second query that exists only for the
note. A failed corrections query therefore costs the note and not the page: an
empty list is a safe answer, so it is not given an error state of its own.

## Two details worth keeping

**The window matches the view's, not the obvious one.** `correctionsBetween`
attributes a correction to the interval when
`from.counted_at < counted_at <= to.counted_at` — half-open at the start,
closed at the end — which is the window `stock_count_intervals` already uses
for receipts (`previous.counted_at < received_at <= next.counted_at`, 0096). An
interval boundary is a single instant shared by two intervals, so picking the
other convention would attribute a correction stamped at exactly a stocktake's
time to the interval *before* the one its delivery went to. Both are asserted
in `scripts/check-stock-usage.mjs`.

**`editedSince` was left alone, and its comment corrected.** That function
reports a correction *after* the pair's later count, and it does so by
comparing `stock_on_hand`'s timestamp to the count's, because it predates
`0112` — when a cell edit wrote nothing at all, a timestamp was the only
evidence there was. Its comment still claimed the edit leaves no history row,
which has been untrue since `0112`.

It is tempting to re-derive it from a `correction` row now that one exists, and
that was not done on purpose: **an edit made before `0112` shipped has no row**,
so reading the history would silently stop reporting those. The timestamp is
the wider net, and it is still the right one for its side of the interval.

The two cannot double-report. A correction at or before `to.counted_at` belongs
to the interval and is reported by `correctionsBetween`; a later one is
`editedSince`'s. The boundary is the same instant in both, and a case asserting
it is in the checker.

## Still open

`backfill` rows are paired into intervals exactly as counts are — they are the
only baseline the earliest items have — and nothing on screen says a figure
rests on one. That is the same class of problem as this one, one step earlier,
and it is not addressed here.
