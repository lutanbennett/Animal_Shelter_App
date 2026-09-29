# 2026-09-26 — Recurring jobs: the feature (Management page and My tasks)

The feature half of "Recurring jobs for staff, feeding My dashboard", built on
`0095` without another migration. What `0095` left to the feature:

- **No rule evaluator in TypeScript.** Every "does it fall on this date"
  question goes to SQL: the list and `/my` through `recurring_job_dates`, the
  form's preview through `recurrence_dates` with the unsaved rule as values.
  `src/lib/recurring-jobs/rule.ts` only parses, checks the shape the table's
  CHECK wants (so the form can say what is wrong in words), and describes a
  rule in words. The one piece of date arithmetic in TS is the weekday of a
  date for display and "days late".
- **Missed dates are one row each, with how many days late.** `0095` left
  collapsing ("missed 3 Mondays") to the feature; we kept one row per date,
  because each is its own record (done or skipped separately) and
  `overdue_from` already stops the list growing into a wall.
- **`/my` shows the next seven days, the badge only today and overdue.** A
  weekly stocktake is visible on Friday for Monday; future dates offer Skip
  (allowed ahead) and a disabled Done (refused before the day). The badge
  keeps maintenance's rule: a count that is never zero stops being read.
  Recurring jobs come first on `/my`, as the day's routine.
- **The loader is `src/lib/my-tasks/recurring.ts`**, beside maintenance, and
  shares `openOccurrences()` (`src/lib/recurring-jobs/queries.ts`) with the
  Management page, so a date cannot be missed on one and not the other. It
  reads every job (dozens at shelter scale, and every staff role reads them
  all), the reader's cover rows, then dates and outcome rows for their jobs
  plus the jobs those wait for. Paged past PostgREST's 1,000 rows, since a
  daily job over a long look-back is hundreds of dates alone.
- **"Waiting for" respects the other job's own state.** A dependency that is
  paused, or whose date is before its own `overdue_from`, has nothing to wait
  for. Done is still allowed while waiting, as `0095` says.
- **A job with no screen has no link.** `MyTask.href` became nullable: the
  title is plain text rather than a link to a Management page staff cannot
  open. The section's "Manage recurring jobs" link shows only to managers.
- **Titles are not machine-translated.** Unlike maintenance (0057) there is
  no translation row: these are internal instructions management writes in
  whichever language the team reads.
- **Vets can be assigned.** The picker offers every role `0095` lets do a job
  (admin, management, staff, vet, volunteer), unlike maintenance's picker,
  which leaves vets out. The server re-checks that anyone newly added can
  still sign in; someone already on a job who has since left stays ticked
  (struck through) until taken off, as maintenance does.
- **Hand over has two modes.** *These dates only* makes one
  `reassign_recurring_job()` call per open date in the range whose team for
  that date includes the person, with the new team = that team minus the
  person plus the cover, so a teammate who was also on it stays. *From now
  on* swaps the person out of every job's usual team, which is how jobs
  stranded by an archived login are cleared; choosing someone who has left
  forces it. Capped at a year of dates per hand-over.
- **Stranded is `live_assignees = 0` on an active job**, straight from
  `recurring_job_staffing`, so an unassigned job counts too: either way,
  nobody will see it.
- **No new nav entry.** The Management group is a single link to its tile
  page since 2026-09-23, so the page is a tile there; `NavLinks.tsx` is
  unchanged. The My tasks badge adds the recurring count in `NavPane`.
