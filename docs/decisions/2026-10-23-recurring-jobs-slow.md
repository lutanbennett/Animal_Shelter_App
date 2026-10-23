# The recurring-jobs page was slow because of role_can, not next dates (2026-10-23)

The backlog item guessed the per-row next-date work across 24+ jobs. **Measured, that was wrong.**

## What was measured (dev, 2026-10-23, management login, page GET)

| | before | after |
|---|---|---|
| page open | 21.4 s, 24.2 s, 32.1 s | 4.4 s, 3.8 s, 4.2 s |
| `recurring_job_dates` (3 pages of 1000 rows) | ~140 ms each | unchanged |
| `loadEligibility` | 25.8 s for 627 calls | a handful of calls |

`recurring_jobs` has 19 rows on dev; the date function is cheap. The cost was `loadEligibility`
(`src/lib/recurring-jobs/eligibility-load.ts`): it called `role_can()` once per role per page,
`Promise.all`, for every page in the registry (33 needs x 19 roles = 627 calls) so the form's
assignee picker could filter by link. Run against the service key alone, 924 concurrent calls took 6.4 s;
through the app, each call also carries a session.

## The error line

"TypeError: fetch failed" is that same burst: hundreds of simultaneous fetches from one request. It
appeared above a list that rendered because the other queries finished; the eligibility one is what
failed. I did not reproduce the error line itself on this branch (it did not appear in any of the
timed runs), so this is the explanation that fits the numbers, not an observed failure.

## The fix (no migration)

- The page asks `role_can` only about pages jobs already link to (`needsForLinks`).
- The form asks for the link it is showing through `eligibilityForLink` (a few calls), and keeps the answer.
  Until it arrives nobody is filtered out of the picker; `saveRecurringJob` still refuses an ineligible
  assignee on the server, so the check was never only the picker's.
- `loadEligibility` runs 12 calls at a time, so a link such as `/management` (many pages) cannot burst.

## Production

**Likely affected, not measured.** Cost is roles x pages; production has the same 33 pages and
some number of roles. With fewer roles than dev's 19 it is proportionally smaller. To settle it: the
role count in production's `roles` table (not read here: ad-hoc production reads are refused), or one
timed page load there.

## Not done

A single SQL function returning a role's full matrix would remove the remaining per-link calls. That is
a migration, which this stream may not add; it would be its own schema PR.

The 46 s save was not re-timed. Saving revalidates and re-renders this page, which is where the time was.
