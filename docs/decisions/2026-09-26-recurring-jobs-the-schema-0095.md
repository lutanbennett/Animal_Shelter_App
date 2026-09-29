# 2026-09-26 — Recurring jobs: the schema (0095)

The schema half of "Recurring jobs for staff, feeding My dashboard", plus
Lutan's addition the same day: **one week's job can be reassigned when the
usual person is sick.** The feature half (`claude/recurring-jobs`) builds on
these without another migration; the file's header is the column-by-column
map.

- **Occurrences are computed, never generated ahead.** A `recurring_jobs` row
  is the rule; a `recurring_job_occurrences` row exists only once someone has
  acted on one date: done, skipped, or handed to a cover team. No cron and
  no table of future rows. That matters most when a rule is edited: with
  generated rows every edit would need a re-generation step that knows which
  rows were acted on. The cost is that "today's jobs" is computed per read.
  At a shelter's scale (dozens of jobs, a window of weeks) that is a
  `recurring_job_dates(from, to)` call.
- **One evaluator, in SQL.** `recurrence_occurs_on()` is the only code that
  decides whether a rule falls on a date. The dashboard (`recurring_job_dates`),
  the admin preview of an unsaved rule (`recurrence_dates`, which takes the
  rule as values) and the harness all call it. The feature should not
  re-implement it in TypeScript: a second copy is where fortnightly anchoring
  drifts. The harness's negative control shows the failure. Anchoring on
  `starts_on` itself instead of its week puts a fortnightly Monday job starting
  Wednesday 7 Oct on 12 Oct instead of 19 Oct.
- **The recurrence subset**, as plain columns, not RRULE text: `weekly`
  (`weekdays`, ISO 1 = Monday … 7 = Sunday, every N weeks), `monthly_day`
  (`month_day`, every N months), `monthly_weekday` (`week_of_month` 1–4 or −1
  for last, one weekday, every N months), with `starts_on` and an optional
  inclusive `ends_on`. A CHECK allows exactly the columns each kind uses.
  Choices a user will notice:
  - *Every N counts from the week (Monday–Sunday) or month that contains
    `starts_on`.* A fortnightly Monday job starting on a Wednesday first falls
    12 days later, not 5, because the Monday of the start's week is before the
    start and the next one is an off week. The admin preview is how people see
    this. The alternative, counting from the first matching date on or after
    the start, reads well for one weekday and gets murky with two.
  - *A day the month doesn't have falls on its last day.* "The 31st" is 30
    April and 28/29 February. Skipping those months would silently drop a
    monthly job.
  - *No 5th week.* Most months don't have one; "last" (−1) is what people mean.
  - `every` also applies to months (quarterly = monthly, every 3), since the
    column was there anyway.
- **Dates vs instants.** Every date that decides when a job falls is a `date`
  on the shelter calendar: `starts_on`, `ends_on`, `overdue_from`,
  `occurs_on`. None is a `timestamptz`, so a UTC session or a Worker can't move
  it. `occurs_on` is the date the rule fell on, not the day it was done; that
  is `done_at`, an instant. `time_of_day` is a label (morning / afternoon /
  evening / anytime), not a clock time. `recurrence_dates` steps in
  integers, not `generate_series` over dates, which goes through
  `timestamptz`. The harness ran the same rules at UTC+14 and UTC−11 and got
  the same dates.
- **Missed jobs stay overdue until done or skipped.** Overdue means rule dates
  before today with no outcome row, from `overdue_from` onward. `overdue_from`
  bounds the look-back so it can't grow into a wall. It defaults to the day the
  job is created, and a trigger moves it to today when the job is **resumed**
  or its **rule changes** (repeat, every, weekdays, month_day, week_of_month,
  starts_on). So the paused weeks, and dates only the old rule produced, never
  show as missed. Editing `ends_on`, the title, the time of day or the
  assignees leaves it alone. A paused job shows nothing, overdue included.
  Each missed date is its own row on the dashboard. Collapsing "missed 3
  Mondays" into one line is the feature's call.
- **Reassigning one date (someone sick) is a cover team per (job, date).**
  `recurring_job_occurrence_assignees` rows, when present, *replace* the usual
  assignees for that date only. The template isn't touched, so the next week
  goes back to the usual person with nothing to undo. Changing the template
  was the rejected alternative: it forces the reverse edit a week later, and
  that step gets forgotten. The occurrence row records who reassigned it,
  when and why ("off sick"). The usual assignee can no longer record that
  date and the cover can, so the dashboard can show each person exactly their
  own list. A sick *week* is one call per occurrence; the form can offer
  "all of Anna's jobs, 5–9 Oct → Ben" and make the calls. Rejected: a
  person-level "Anna is off 5–9 Oct, cover Ben" range table. It is neater for
  a long absence, but it becomes a second source of truth about who does
  what, and the per-date rows are what the record needs anyway. It can be
  added later on top of the same cover rows. Future dates can be covered
  ahead; a date already done or skipped is history and can't be reassigned
  or handed back.
- **Assignees follow 0063**: `recurring_job_assignees` is one row per (job,
  login), so a job can go to one person or several; no rows = unassigned.
  Management writes it directly, as with maintenance.
- **Archived assignees don't strand a job silently.**
  `recurring_job_staffing` counts live and archived assignees per job. An
  active job with `live_assignees = 0` is stranded, and the Management page
  should say so. A `public_viewer` assignee counts as neither: they can sign
  in but can't do anything. `reassign_recurring_job()` refuses an archived,
  role-less or public-viewer login as cover. The template assignee table
  doesn't enforce this (0063 doesn't either), so the admin picker has to.
- **Order between jobs** is `depends_on_job_id`: this job's occurrence waits
  for the other job's occurrence **on the same date**, when it has one.
  Done or skipped both release it; if the other job doesn't fall that day
  there is nothing to wait for. It is shown ("waiting for Stocktake"), not
  enforced: the database won't refuse "done" on a waiting job, because the
  person may have done it anyway. A trigger does refuse cycles, which would
  leave every job in them waiting for ever.
- **Who can do what.** All five staff roles read everything (anyone can be
  assigned, so anyone reads the rules); public viewer, archived and role-less
  logins read nothing; anon is refused. Admin and management write templates
  and assignees through the tables. Outcomes go only through
  `record_recurring_job()`. It is allowed for the date's effective assignees
  (the cover team if there is one, else the usual team) and for admin /
  management, and it stamps `done_by` / `done_at` itself. "Done" is refused
  before the day; "skipped" ahead is allowed ("shelter closed"). Reassigning
  is management only (Lutan, 2026-09-26), plus admin as everywhere, through
  `reassign_recurring_job()`. Staff, vets and volunteers cannot hand a job
  on, not even their own. The occurrence tables have no
  write grants, so an outcome's who and when can't be typed in.
- **History holds the job.** Occurrences reference their job `on delete
  restrict`: a job that has ever been done, skipped or covered can only be
  paused or ended (`ends_on`), so "was the stocktake done on 5 Oct" stays
  answerable. A job with no history deletes freely.
- **Fitting `/my`.** A task is `key: recurring:<job>:<date>`, `due:
  occurs_on`, `href: link_path` (site-relative only; a CHECK refuses
  anything that could leave the site, e.g. `/stocktake?tab=diets`), with
  `time_of_day` and "waiting for …" as the "what it is about" line. The done
  action is `record_recurring_job`. The loader needs the reader's jobs (usual
  team, minus dates covered by others, plus dates covered by them), the dates
  from `recurring_job_dates(earliest overdue_from, today)`, and the outcome
  rows for that window: three reads.
