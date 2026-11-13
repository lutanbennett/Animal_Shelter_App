# Refusal keys, group 10: the last group of person-read English (#3nuwy)

`recurrence_dates` and `recurring_job_dates` (both live in `0095`), `role_can` (`0277`, `security definer`) and
`propose_website_draft` (`0315`, `security definer`) now raise keys. Migration `0367`; each body is the live one with only its
raise lines changed, generated from those files by a script that asserted its match count on every substitution and diffed back
against the originals (5 lines changed, all `raise` lines). **This ends the programme: `node scripts/measure-sql-refusals.mjs`
reads "of the person-read (user + forwarded-and-masked), 0 messages are still English" (28 functions, 89 messages keyed).**

## Step zero

Before: 5 messages still English, no group 10 decision file, meter entries as the brief said. The brief's one correction held:
`eligibility-load.ts` is `role_can`'s caller, not `recurring_job_dates`'. A second thing the meter's caller list does not say:
`src/lib/medical/weigh-first.ts` is named only because a **comment** mentions `recurring_job_dates`; it calls `weigh_first_visits()`
and needed no change. The real caller of `recurring_job_dates` is `src/lib/recurring-jobs/queries.ts`.

## The keys

| function | message (was) | key |
|---|---|---|
| `recurrence_dates`, `recurring_job_dates` | Ask for at most two years of dates at a time. | `recurring_job.span_too_long` |
| `role_can` | role_can: not permitted to ask about the % role | `role.eligibility_not_allowed` |
| `propose_website_draft` | website.propose is required to propose a website change | `website.propose_not_allowed` |
| `propose_website_draft` | not a draftable table: % | `website.draft_table_invalid` |

**Shared key, as group 9 did for `merge_doctors`:** the two `0095` functions raise the identical sentence with one meaning, so
one key. It is a whole sentence with no noun slot, so Thai has nothing to fit. SQLSTATE stays the default `P0001`.

## The `role_can` judgement: keyed, with no role in it

Asked: key it, or mask it in the caller so it leaves the person-read class? **Keyed.** The message is reachable only by asking
about a role the login neither holds nor manages, which the rota page never does, but `loadEligibility()` returned
`error.message` straight to four callers, and the message is a shape the meter (rightly) counts as person-read. Masking would
have hidden the problem from the meter rather than removing English. The key carries **no role**: the old sentence interpolated
the role asked about, which a reader cannot act on, and nothing here reads a role by name or behaves differently on a match
(`CLAUDE.md`, "No code may fall back to a role BY NAME"). `loadEligibility()` now takes the dictionary and words its error
through `dbRefusal`.

## Callers

- `eligibility-load.ts`: error words through `dbRefusal`; takes `t`. Its four callers (`actions.ts` x2, `page.tsx`,
  `my-tasks/recurring.ts`) pass it.
- `queries.ts`: `loadJobDates` and `loadOpenOccurrences` take a `describe` callback (`(e) => dbRefusal(...).error`). A callback
  rather than `t`, because `countMyUrgentRecurring` (the nav badge) has no dictionary and discards the error; it passes
  `() => ""`. The span refusal cannot be reached from the app (every caller is capped at `MAX_SPAN_DAYS`); it is keyed anyway,
  since the database function can be called by anything.
- `recurring-jobs/actions.ts` `previewRecurrence`, and `admin/website/actions.ts` (both propose actions): `refuse(error.message)`
  became `dbRefusal(...)`. No caller held a regex rewording or an English allow-list, so nothing was deleted.
- Not touched: the many other `refuse(error.message)` in `actions.ts`, which belong to plain table writes, not these functions.

## 0262's rule and the security check

`role_can` and `propose_website_draft` are `security definer`; their checks (`auth.role()`, `has_permission('recurring.manage')`,
`has_permission('website.propose')`) are untouched. `check-hard-coded-security.mjs` flagged `role_can` in `0367` because its body
still contains `r.key = p_role_key` (the role being **asked about**, not a rule on the caller, and the Admin test reads
`roles.is_admin`); it is declared under `database.declared` with the same reason `0272` and `0277` carry. It prints
"no coded security outside the Admin bypass".

## Proof

`supabase/harness/0367_refusal_keys_last_group_harness.sql`: 5 of 5 raises provoked, each asserting the message **is** the key
(plus a control that asking about one's own role is answered, not refused). Not driven on screen in Thai: none of the five
refusals is reachable by pressing a button as the app is built (the span is capped, `role_can` is asked only about permitted
roles, the website proposal buttons are drawn only to holders of the card).

## What remains English on purpose

`#3nuwy` is ticked. A `grep` for English in `raise exception` in the migrations will still find lines, and that is **not** a
regression: the `maybe`, `masked` and `developer` classes stay English by design. A **masked** message never reaches a person
(its caller replaces it); a **trigger's** message is reworded by its caller or reaches no one; a **developer** message names a
programming mistake. `scripts/check-sql-refusal-keys.mjs` still guards every person-read function from `0339` on.

## Not acted on (group 9's two findings, per the brief)

`merge_doctors`' second `not_allowed` raise being unreachable, and the `doctors` SELECT policy asking `clinics.list` — both left
exactly as they were.

## Thai

The four Thai sentences are `UNREVIEWED` (a Thai reader has not seen them); `#y1dqu`'s routine covers them.
