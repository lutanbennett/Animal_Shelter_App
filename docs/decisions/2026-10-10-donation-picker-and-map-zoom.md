# Donation resident picker, and the map's zoom buttons

2026-10-10, `claude/donation-picker-and-map-zoom`. Two small bugs in one stream.

## The resident picker includes deceased residents

Lutan, asked in chat on 2026-10-10: **include them.** A gift given in memory of
an animal that has died is a normal thing for a shelter to receive, and leaving
deceased residents out would make it impossible to record against the animal it
honours. Each row already shows the resident's status, so a deceased one is
labelled *Deceased* and nobody picks one by accident. That is why the query has
no `NOT_DECEASED`, unlike the medical pickers it was copied from.

## A failed load is said out loud

The bug was a query that failed on every load (`residents` has no
`current_status`; PostgREST 42703, reproduced on dev before the fix) and a page
that turned the failure into an empty list with `?? []`. The picker then said
*no residents match* — a wrong answer that looks like a correct one. Now:

- the new-donation page logs a failed resident or contact load, and shows a
  message above the picker when the resident list failed;
- the donation's own page throws on a failed read of the donation or its
  receipts. *Not found* or *no receipts yet* would be wrong answers, and the
  second offers to issue a receipt that may already exist.

The same `?? []` pattern elsewhere in the app is a backlog item, not part of
this stream.

## The zoom buttons sit under the plan at every width

The backlog item and brief suggested a row under the plan on phones and the
corner overlay kept on wider screens, *where it does not overlap*. Measured at
1280 px on Main Zone, it does overlap: the buttons still covered the right-hand
part of enclosure 1. So the row under the plan is used at every width. It costs
one 52 px row and covers nothing; the buttons stay 44 px.
