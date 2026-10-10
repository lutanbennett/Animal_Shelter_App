# check-recurring-job-eligibility: the three reds were a stale fixture, not a regression

**Date:** 2026-10-10 · **Stream:** `check-harness-repair`

## The question

After 0173 retired Staff, `scripts/check-recurring-job-eligibility.mjs` was red on three rows, none of them caused by
Staff itself (the script reads cells from the migration files and never touches a database):

- **E9** wanted `/contacts` eligible for admin, management, staff and volunteer; the app gives admin, management and
  the 2IC.
- **L canDoJob(/management)** wanted the landing open for staff and volunteers; it is not.
- **L canDoJob(/admin)** wanted the landing closed to Management; it is open.

Two readings were possible for each: the expectation is stale (a deliberate change nobody carried into the fixture),
or the app regressed (a permission quietly changed). Making a red test green by copying today's behaviour into the
expectation is how a regression gets blessed, so each was traced to the change that made it true before the fixture
was touched.

## What each one was

| Row | Reading | What made it true |
|---|---|---|
| E9 `/contacts` | **stale fixture** | 0155 and commit `c0dc9826` (2026-10-07): `/contacts` asks the new `contacts.browse` cell, held by Management and the 2IC only. This is the Director's answer to q6 + q7, "Management and the 2IC" (`docs/decisions/2026-10-07-director-answers-schema.md`). The volunteer losing `/contacts` was the point of that answer. |
| L `/management` | **stale fixture** | Staff and volunteers opened the landing only through the medication list (`medical.prescriptions` Read). Commit `1aea1798` (2026-10-08, Shelter Operations) moved that page to `/operations/medication-list`, so no page under `/management` is theirs any more and the landing is back to the pre-conversion table. The fixture's old note credited `contacts.directory` (0144); that was not the actual route. |
| L `/admin` | **stale fixture** | 0163 gave Management `website.content` Edit (`docs/decisions/2026-10-08-management-website-content.md`), and `/admin/website` asks it, so the `/admin` landing opens for Management. |

The brief guessed 0170/0171 for E9. That was wrong: 0170 and 0171 narrowed the contacts **table** policies, but the
`/contacts` **page** moved to `contacts.browse` three days earlier, in 0155.

## So

None of the three is an app regression, and nothing was reported to the backlog as one. The fixture now carries
E9 = admin, management, 2IC, and `MOVED_BY_CELLS` lists only `/admin` → Management, each with its citation in the
script. Checked that the harness can still go red: adding a volunteer `contacts.browse` cell fails E9, and adding a
staff `website.content` cell fails the `/admin` row.

## Left alone, on purpose

The script still lists Staff among the assignable roles, because `ASSIGNABLE_ROLES` in
`src/lib/recurring-jobs/eligibility.ts` is built from `APP_ACCESS_ROLES`, which still contains `staff`. That is app
code, out of scope for a scripts-only stream. It is harmless (no live login can hold Staff since 0173), but it is
on the backlog to tidy so the rota picker stops knowing about a role nobody can hold.
