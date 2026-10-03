# A date a person picks is a shelter calendar day; "in the future" means after today in Asia/Bangkok

2026-10-03. Staff dry run findings F-02, F-03, F-04
(`docs/uat/dry-run-2026-10-03-staff.md`, PR #314). F-03 and F-04 turned out to
be one fault, and F-02 an unrelated typo.

## The rule (F-03)

A date a user picks in a form is a **calendar day at the shelter**, not an
instant. "In the future" means *after today in Asia/Bangkok*, never *after
`Date.now()`*. The comparison lives in one place:
`isFutureDate(date, now)` in `src/lib/placements/dates.ts`, which compares the
`YYYY-MM-DD` string with `todayIso(now)` (`src/lib/format.ts`, the shelter-zone
date). Every "can't be in the future" check goes through it.

Why a bare `Date.now()` comparison is wrong: `new Date("2026-10-03")` is
**midnight UTC**, which is 07:00 in Bangkok. Between 00:00 and 07:00 Bangkok
time a date input's own default (today, from `todayIso()`) parses to an instant
*later than now*, so the server refused the form's default. Measured, not
inferred: at 18:00Z on 2 Oct (01:00 on 3 Oct in Bangkok), `new
Date("2026-10-03").getTime() > now` is `true`; at 03:00Z it is `false`.

**Where it still lived.** `utc-today` (PR #59, `docs/utc-date-audit-2026-09-23.md`)
replaced the `toISOString().slice(0, 10)` *defaults* and gave the placement,
weight, adoption-update and microchip actions the shelter-zone comparison. It
did not find three server actions that parse the date and compare the
*instant*: `src/app/immunizations/new/actions.ts`,
`src/app/blood-tests/new/actions.ts` and `src/app/procedures/new/actions.ts`.
The dry run only tried the first two; procedures had the identical line and is
fixed too. A grep for `.getTime() > Date.now()` across `src/` now finds
nothing, and `scripts/check-shelter-dates.mjs` fails if it ever finds one
again. The remaining `Date.now()` comparisons in `src/` are on genuine
instants (a datetime-local visit time, token expiry, cache age) and are correct.

Not changed: the browser `max` attributes already use `todayIso()`, and the SQL
`current_date` sites were closed by `0073` (`shelter_today()`).

## F-04 shared the cause

It was not a `>` versus `>=` slip. Intake writes its placement as
`p_intake_date::timestamptz` (`0008`, `0029`), i.e. **00:00 UTC of the intake
date, which is 07:00 in Bangkok**. A move dated today is stamped with `now`
(`placementStartDate`), and the old guard refused any new placement whose start
was `<=` the previous start. Before 07:00 Bangkok on the intake day, `now` is
*earlier than the intake's own stamp*, so the move was refused: "must be after
the current placement started". Measured the same way: refused at 18:00Z on
2 Oct for an intake dated 3 Oct, accepted at 03:00Z. So the finding's "wait a
day" was too pessimistic — waiting until 07:00 also worked — but it is the same
seven hours, and the same form of fault: a date and an instant compared as if
they were the same kind of thing.

A second, rarer form of the same refusal: two back-dated changes on one day
both land on `T12:00:00Z`, and `placement_history` has `end_date > start_date`
(0001), so the second was refused as "before" the first. This is the finding's
"hospital admission and return on one day".

**The business rule, decided:** a placement may follow another on the *same
shelter day*; it is refused only when its date is a *day before* the day the
current placement began. `placementStartAfter(date, now, previousStart)`
implements it for all six placement actions (move, hospital in and out,
rehome out and back, death). When the natural stamp does not fall after the
previous start, the new one is the previous start plus one second: that keeps
the order, satisfies `end_date > start_date`, and does not change the day. The
only visible oddity is an early-morning move on the intake day stamped
ahead of the clock (07:00:01 for an action taken at 01:00); it sorts
correctly and is on the right day, which is what the record is read for.

The refusal's wording changed from "must be after the current placement
started" to "can't be before the day the current placement started", since
the same day is now allowed. The Thai strings were edited the same way
(`ต้องอยู่หลังวันที่` → `ต้องไม่ก่อนวันที่`) without a Thai reader; they want a
look at the next Thai pass.

The intake stamp itself is **not** changed. Moving it to shelter midnight would
be a data migration over every existing intake placement for no behavioural
gain once the comparison is by day, and the one-in-flight migration rule makes
it a separate decision.

## F-02 and F-13

F-02 was the missing backslashes in `/^[ds-]+$/` (since `108415ac`, 2026-09-29).
The write was fine — the check script confirms a stored chip is exactly the 15
digits — so only the search was broken. The test is now `chipFromSearch()` in
`src/lib/residents/microchip.ts`, and `scripts/check-chip-scan.mjs` looks a
chip up *through the page* as a throwaway staff login.

**This does not fix F-13** (`R0055` finds nothing; `R-0055` does). That is a
different normalisation, on the ID branch of the search, and was left for the
batch that owns it. `chipFromSearch` only decides "is this a chip"; it does
not rewrite anything else the box accepts.

## How it is pinned

`scripts/check-shelter-dates.mjs` runs the real exported functions (no copy of
the logic) at fixed instants either side of 17:00Z — 16:59:59Z, 17:00:00Z, 18:00Z
and 03:00Z — under four process time zones (UTC, Bangkok, Los Angeles,
Kiritimati), because the answer must depend on the instant and the shelter's
zone only, never on the server's. It also covers the intake-day move at 01:00,
the same-day back-dated tie, and the genuinely earlier day.
