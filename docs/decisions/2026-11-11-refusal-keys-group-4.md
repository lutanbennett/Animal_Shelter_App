# Refusal keys, group 4: the recurring-jobs screen (#3nuwy)

`0353_refusal_keys_recurring_jobs.sql` converts 12 raises in two functions to 10 keys, all under `recurring_job.`.
The SQLSTATE stays P0001 (the default the old raises used), so nothing testing `error.code` changes.

## Live bodies (from `measure-sql-refusals.mjs --list`)
- `record_recurring_job`: 0178 (7 raises). Later files (0196, 0259, 0272) only mention it in passing; the tool names 0178 as live.
- `reassign_recurring_job`: 0277 (5 raises). Bodies copied unchanged but for the raise lines (generated, not retyped).

## Keys, and what collapsed
12 sentences became 10 keys. Two pairs collapsed because the wording is identical:
`recurring_job.not_found` ("no longer exists", both functions) and `recurring_job.not_on_that_date`
("does not fall on %", both functions, parameter `date`). Others stay separate because they are different
activities or situations: `record_not_allowed`, `reassign_not_allowed`, `outcome_invalid`, `date_handed_over`,
`not_assigned`, `done_before_its_day`, `date_already_marked`, `cannot_sign_in`.
No wording names a role. Thai is the stream's own and unreviewed (`#y1dqu`).

## Caller
`src/app/management/recurring-jobs/actions.ts`: `recordRecurringJob` and `handBackRecurringJob` use `dbRefusal`;
`handOverRecurringJobs` builds its per-date `failed` strings from `dbRefusal(...).error` instead of `error.message`.
No other file calls these functions (`RecurringJobForm.tsx`, `RecurringJobsView.tsx` checked by grep).

## Proof (dev, 2026-11-11)
Method: a `do $$` block on dev run through the Management API as a chosen `request.jwt.claims` sub, with a throwaway
job inserted inside it and everything rolled back by a final `raise exception`. Direct function calls, not the screen
(the screen checks the card first, as group 3 found). Keys seen coming back:
`record_not_allowed`, `reassign_not_allowed` (a login with no roles); `not_found` (both functions), `outcome_invalid`,
`not_on_that_date` with `{"date": "18 Nov 2026"}` (both), `done_before_its_day`, `date_already_marked`, `cannot_sign_in`
(as an admin login). **Not provoked:** `date_handed_over` and `not_assigned`, which need a non-Admin assignee holding
`recurring.do_own`; their raises are the same one-line swaps and `check-sql-refusal-keys.mjs` confirms both have entries in both dictionaries.
Fallback for an unknown key is unchanged and covered by `src/lib/db-refusal.test.mjs`.

## Meter
Before: 11 functions / 21 messages keyed, 68 person-read still English. After: 13 / 33, **56** still English.
