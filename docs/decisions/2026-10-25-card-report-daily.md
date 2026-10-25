# Card report stream 6: the daily-work cards (2026-10-25 to 26)

Stream 6 of 6 of the card report. Four cards, driven in a browser on the dev project as a login holding only the card, each after a read-back from `role_cards` and
`role_permissions` of what the login held (`recurring_jobs` 3 cells, `record_weight` 2, `feed_special_diets` 2, `my_tasks` 1). Output: four files in `docs/card-reports/`
(`--check` now reads *20 of 29 cards written up, all well formed*), one block of rows in `docs/card-access-faults.md`, this file and the test plan.
Nothing was fixed, no grant changed, no card proposed, no migration. The format is #942's and `build-card-report.mjs` was not touched.

## What the brief called the one thing no stream had driven: answered

A recurring job **can** be assigned to a card-only login, and it works end to end. `recurring_jobs` created a weekly job, assigned it to itself, saw it under "Due today" on
My tasks, pressed Done, and it stayed done after a reload. `my_tasks` did the same with a job `recurring_jobs` had assigned to it, with a note, which was stored. Stream 3's
"no recurring task is assigned to a card-only login" was a statement about its dev data, not about the system.

## What was found that Lutan asked to be told about

- **A job card that cannot be handed its job.** `record_weight` and `feed_special_diets` can be assigned a job that opens their own page (the assignee picker even offers the
  card-only login for that page), and the person then never sees it: My tasks reads "Nothing is assigned to you right now" and has no menu entry, because both are
  gated on `recurring.do_own`, which neither card carries. `do_maintenance` carries it and is the contrast. By its grants `administer_medication` is the same shape; it was
  stream 3's card and was not driven here. One row in the log, naming the cell.
- **`feed_special_diets` cannot record a feeding, only look.** Both of its pages say nothing is ticked off, and no page in the system records a meal given. A card named
  "Feed Special Diets" is a feeding list. Recorded as by design, with the Add diet button it is offered and refused.
- **The no-page-job consequence is confirmed by driving**, not re-filed: a job with no page saved against logins holding only `recurring_jobs` and only `my_tasks`. The existing
  backlog item (line starting *A RECURRING JOB THAT LINKS TO NO PAGE*) is referenced in the log row; no second item was opened.
- **`recurring_jobs` shows every login's name and email** in its pickers, and delete is one press (not pressed). A judgement row.
- **The spreadsheet download returned every resident to `feed_special_diets`**, the same finding as the other card-only resident readers.

## Choices made

- **Assigning by driving, then by service role where the app cannot.** The three logins for the other cards were created first and assigned their jobs from the
  `recurring_jobs` session through the real form, so the assignment itself is driven. The jobs for `record_weight` and `feed_special_diets` were given a page by typing
  `/medical/weight` and `/medical/diets` under "Other page…", which narrows the assignee list to logins that can open it.
- **Scratch scripts** (a read-back and a table query, using the service role from `.env.local`) lived in the scratchpad and were not committed.
- **Records on dev are left, named `walk-<card>`:** jobs "walk-recurring_jobs own job" (paused, with its done date and a hand-over of 1 Nov to another login),
  "walk-record_weight job", "walk-feed_special_diets job" and "walk-my_tasks job" (done, with a note). A weight of 4.4 kg with the note "walk-record_weight" was recorded
  for an existing test resident (`Capwarn Test 0924`), which has no `walk-` name because the resident was not made by this stream. An older "walk-recurring_jobs" job from an
  earlier pass (nobody assigned) was left alone.
- **Production was not read.** The brief ruled it out: card grants are byte-identical on dev and production. The production cells say so.

## Not established, said plainly

- **Skip and Undo on My tasks**, Resume, Edit, Delete, Give back and the "from now on" kind of Hand over on Recurring jobs: offered, not pressed.
- **Whether the handed-over date shows under "Handed to someone else"** once its job is paused: the hand-over answered "Handed over 1 date." and the row exists in the
  database, but the panel did not list it after a reload (the job was paused by then, which is the likeliest reason). Not claimed as a fault.
- **`record_weight`'s Residents list and the Log weight button** were not opened; only its weight pages and a resident's page were.
- **The Doctor's cards were not touched**, and `doctor-cells` was not run.

## What this does not close

`RERUN EVERY CARD TEST` stays open: 20 of 29 cards are written up. The nine not yet written up are `dashboard`, `website`, `assistant`, `add_photos`, `approve_photos`, `meme_library`,
`operations_landing`, `management_landing` and `who_does_what`; none is in this stream's brief, so none was taken on.
